import { mkdir, writeFile } from 'node:fs/promises';
import { pointsRepository } from '../server/repository/PointsRepository.ts';
import { IbgeAdapter, PrefeituraAdapter, CnesAdapter, InepAdapter, OsmAdapter } from '../server/adapters/SourceAdapter.ts';

const demoPoints = await pointsRepository.list();
const ibge = new IbgeAdapter();
const cnes = new CnesAdapter();
const prefeitura = new PrefeituraAdapter();
const inep = new InepAdapter();
const osm = new OsmAdapter();

// A publicação do Pages é um snapshot auditável. Para evitar promover uma
// publicação "real" sem dados reais, a geração falha se a fonte CNES não
// entregar pelo menos um ponto georreferenciado válido de Planaltina-GO.
const realHealthPoints = await cnes.fetchPoints();
if (realHealthPoints.length === 0) {
  throw new Error('Publicação bloqueada: nenhum ponto real do CNES foi obtido.');
}

const data = [...realHealthPoints, ...demoPoints];
const sources = await Promise.all(
  [ibge, prefeitura, cnes, inep, osm].map((adapter) => adapter.checkStatus())
);
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
      demoCount: demoPoints.length,
      municipality: 'Planaltina, Goiás',
      ibgeCode: '5217609',
      mode: 'misto_oficial_demo',
      disclaimer:
        'O catálogo combina estabelecimentos de saúde reais do CNES/SES-GO com pontos DEMO explicitamente identificados. Consulte a procedência de cada registro antes do deslocamento.',
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
        'Snapshot de publicação com proveniência por registro. Fonte oficial não elimina a necessidade de confirmar mudanças recentes de atendimento.',
    },
  })
);
await writeFile('public/data/municipality.json', JSON.stringify(municipality));
