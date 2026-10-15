import { inPlanaltina } from '../src/utils/territory.ts';
import { mkdir, writeFile } from 'node:fs/promises';
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

const data = [...realHealthPoints, ...demoPoints];
const sources = await Promise.all(
  [ibge, prefeitura, cnes, inep, osm].map((adapter) => adapter.checkStatus())
);
const cnesStatus = sources.find(source => source.id === 'cnes');
if (cnesStatus) cnesStatus.notes += ` Triagem pela malha IBGE: ${realHealthPoints.length} pins aceitos; ${territorialReview.length} registros separados para revisão.`;
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
      realCount: realHealthPoints.length,
      territorialReviewCount: territorialReview.length,
      demoCount: demoPoints.length,
      municipality: 'Planaltina, Goiás',
      ibgeCode: '5217609',
      mode: 'misto_oficial_demo',
      realSourceMode: cnes.dataMode,
      disclaimer:
        'O catálogo combina estabelecimentos de saúde reais verificados com pontos DEMO explicitamente identificados. Consulte a procedência e o modo da fonte antes do deslocamento.',
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
