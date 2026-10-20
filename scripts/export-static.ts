import { inPlanaltina } from '../src/utils/territory.ts';
import { mapOverpassElements, overpassQuery, validateOsmSnapshot } from '../src/utils/osmCatalog.ts';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { pointsRepository } from '../server/repository/PointsRepository.ts';
import { IbgeAdapter, PrefeituraAdapter, CnesAdapter, InepAdapter, OsmAdapter } from '../server/adapters/SourceAdapter.ts';

const demoPoints = await pointsRepository.list();
const ibge = new IbgeAdapter();
const cnes = new CnesAdapter(process.env.CNES_SNAPSHOT_PATH);
const prefeitura = new PrefeituraAdapter();
const inep = new InepAdapter();
const osm = new OsmAdapter();

// A publicação é um snapshot auditável. O adapter tenta atualização ao vivo e,
// quando o órgão bloqueia/indisponibiliza a consulta, preserva somente o último
// snapshot real previamente validado. A publicação continua bloqueada se nem
// atualização nem fallback fornecerem ao menos um ponto real verificável.
const collectedHealthPoints = await cnes.fetchPoints();
const realHealthPoints = collectedHealthPoints.filter(point => inPlanaltina(point.lat, point.lng));
const territorialReview = collectedHealthPoints.filter(point => !inPlanaltina(point.lat, point.lng));
if (realHealthPoints.length === 0) {
  throw new Error('Publicação bloqueada: nenhum ponto real verificado do CNES foi obtido.');
}

console.log(
  JSON.stringify({
    event: 'cnes-planaltina-snapshot',
    source: 'SES-GO / CNES',
    resourceId: '7559175a-98ac-4719-bf30-5e6455ba57c5',
    sourceMode: cnes.dataMode,
    liveError: cnes.liveError,
    realCount: realHealthPoints.length,
    points: realHealthPoints.map((point) => ({
      id: point.id,
      name: point.name,
      lat: point.lat,
      lng: point.lng,
      provenance: point.provenanceMeta.provenance,
      zone: point.zone,
      addressHint: point.addressHint,
      retrievedAt: point.provenanceMeta.retrievedAt,
    })),
  })
);

// A coleta OSM só ocorre durante a construção no CI, nunca a cada acesso de cidadãos.
// Falhas de terceiros degradam para o último snapshot real CNES sem impedir o deploy.
let communityPoints: Awaited<ReturnType<typeof mapOverpassElements>> = [];
let osmIssue: string | null = null;
let osmMode: 'live' | 'snapshot_fallback' | 'unavailable' = 'unavailable';
const osmSnapshotPath = process.env.OSM_SNAPSHOT_PATH ?? '.cache/osm/snapshot.json';
try {
  // Consulta enxuta primeiro: o endpoint comunitário não oferece SLA.
  // O perímetro IBGE permanece obrigatório na transformação de cada ponto.
  const overpass = await fetch('https://maps.mail.ru/osm/tools/overpass/api/interpreter', {
    method: 'POST',
    body: new URLSearchParams({ data: overpassQuery('urban') }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'User-Agent': 'MapaPlanaltinaGO/1.0 (+https://github.com/Pabloguilherme01/mapa-planaltina-go)',
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!overpass.ok) throw new Error(`HTTP ${overpass.status}`);
  const fresh = mapOverpassElements(await overpass.json(), new Date().toISOString());
  communityPoints = validateOsmSnapshot({ points: fresh });
  if (communityPoints.length === 0) throw new Error('Lote OSM insuficiente ou inválido; preservar snapshot.');
  osmMode = 'live';
  await mkdir(dirname(osmSnapshotPath), { recursive: true });
  await writeFile(osmSnapshotPath, JSON.stringify({ points: communityPoints }));
} catch (error) {
  osmIssue = error instanceof Error ? error.message : String(error);
  try {
    communityPoints = validateOsmSnapshot(JSON.parse(await readFile(osmSnapshotPath, 'utf8')));
    if (communityPoints.length > 0) osmMode = 'snapshot_fallback';
  } catch {
    communityPoints = [];
  }
}
// Publicação real por padrão: pontos DEMO permanecem no repositório para testes
// e só são exportados se houver opt-in explícito em homologação.
const publishDemo = process.env.INCLUDE_DEMO_POINTS === 'true';
const publicDemoPoints = publishDemo ? demoPoints : [];
const data = [...realHealthPoints, ...communityPoints, ...publicDemoPoints];
console.log(JSON.stringify({ event: 'osm-planaltina', count: communityPoints.length, error: osmIssue, sourceMode: osmMode, demoIncluded: publishDemo }));
const sources = await Promise.all(
  [ibge, prefeitura, cnes, inep, osm].map((adapter) => adapter.checkStatus())
);
const cnesStatus = sources.find(source => source.id === 'cnes');
if (cnesStatus) cnesStatus.notes += ` Triagem pela malha IBGE: ${realHealthPoints.length} pins aceitos; ${territorialReview.length} registros separados para revisão.`;
const osmStatus = sources.find(source => source.id === 'osm');
if (osmStatus) {
  osmStatus.status = osmMode === 'live' ? 'connected' : osmMode === 'snapshot_fallback' ? 'snapshot_fallback' : 'error';
  osmStatus.statusMessage = osmMode === 'live'
    ? `${communityPoints.length} locais comunitários coletados na região urbana, filtrados pela malha IBGE. Não são verificados pelo município.`
    : osmMode === 'snapshot_fallback'
    ? `${communityPoints.length} locais comunitários preservados de uma coleta anterior; Overpass não respondeu nesta publicação.`
    : 'Coleta colaborativa indisponível nesta publicação; não serão apresentados pontos OSM fictícios.';
  osmStatus.retrievedAt = communityPoints[0]?.provenanceMeta.retrievedAt ?? null;
  osmStatus.checkedAt = new Date().toISOString();
  osmStatus.verified = false;
  osmStatus.notes = 'Consulta pública em lote somente no build, com filtro municipal, IDs estáveis e licença ODbL. Sem verificação independente de existência, horário ou endereço. © contribuidores OpenStreetMap.';
}
const ibgeStatus = sources.find((source) => source.id === 'ibge');
if (ibgeStatus?.status === 'connected') {
  ibgeStatus.statusMessage =
    'Identificação municipal consultada na geração deste site. Os dados são um retrato da data de consulta; esta publicação não mantém conexão contínua com o IBGE.';
}

let municipality: unknown;
try {
  municipality = { success: true, data: await ibge.getMunicipalityData() };
} catch {
  municipality = { success: false, error: 'Consulta IBGE não disponível durante a publicação.' };
}

await mkdir('public/data', { recursive: true });
await writeFile(
  'public/data/points.json',
  JSON.stringify({
    success: true,
    data,
    meta: {
      total: data.length,
      count: data.length,
      realCount: realHealthPoints.length + communityPoints.length,
      verifiedCount: realHealthPoints.length,
      communityCount: communityPoints.length,
      osmSourceMode: osmMode,
      territorialReviewCount: territorialReview.length,
      demoCount: publicDemoPoints.length,
      municipality: 'Planaltina, Goiás',
      ibgeCode: '5217609',
      mode: publishDemo ? 'misto_oficial_demo' : communityPoints.length > 0 ? 'catalogo_real_comunitario' : 'catalogo_real_institucional',
      realSourceMode: cnes.dataMode,
      disclaimer:
        'Saúde CNES é verificada; locais colaborativos OSM têm geometria mapeada, mas existência e atendimento não verificados. Confirme a fonte antes do deslocamento.',
    },
  })
);
await writeFile(
  'public/data/sources.json',
  JSON.stringify({
    success: true,
    data: sources,
    meta: {
      municipalCode: '5217609',
      totalSources: sources.length,
      verifiedCount: sources.filter((source) => source.verified).length,
      policyNotice:
        'Snapshot de publicação com proveniência por registro e fallback explícito para a última coleta real validada quando a fonte ao vivo não responde.',
    },
  })
);
await writeFile('public/data/territorial-review.json', JSON.stringify({ source: 'CNES/SES-GO', boundary: 'IBGE 5217609 — malha simplificada', reason: 'Fora da malha simplificada; requer revisão, sem correção automática de coordenadas.', data: territorialReview }));
await writeFile('public/data/municipality.json', JSON.stringify(municipality));
