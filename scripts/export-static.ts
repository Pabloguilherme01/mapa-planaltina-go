import { mkdir, writeFile } from 'node:fs/promises';
import { pointsRepository } from '../server/repository/PointsRepository.ts';
import { IbgeAdapter, PrefeituraAdapter, CnesAdapter, InepAdapter, OsmAdapter } from '../server/adapters/SourceAdapter.ts';

const data = await pointsRepository.list();
const ibge = new IbgeAdapter();
const sources = await Promise.all([ibge, new PrefeituraAdapter(), new CnesAdapter(), new InepAdapter(), new OsmAdapter()].map((adapter) => adapter.checkStatus()));
const ibgeStatus = sources.find((source) => source.id === 'ibge');
if (ibgeStatus?.status === 'connected') ibgeStatus.statusMessage = 'Identificação municipal consultada na geração deste site. Os dados são um retrato da data de consulta; esta publicação não mantém conexão contínua com o IBGE.';
let municipality: unknown;
try { municipality = { success: true, data: await ibge.getMunicipalityData() }; }
catch { municipality = { success: false, error: 'Consulta IBGE não disponível durante a publicação.' }; }
await mkdir('public/data', { recursive: true });
await writeFile('public/data/points.json', JSON.stringify({ success: true, data, meta: { total: data.length, count: data.length, municipality: 'Planaltina, Goiás', ibgeCode: '5217609', mode: 'demonstrativo', disclaimer: 'Todos os pontos são DEMO, não use para deslocamento.' } }));
await writeFile('public/data/sources.json', JSON.stringify({ success: true, data: sources, meta: { municipalCode: '5217609', totalSources: sources.length, verifiedCount: sources.filter((source) => source.verified).length, policyNotice: 'Snapshot de publicação. Origem não implica auditoria de pontos.' } }));
await writeFile('public/data/municipality.json', JSON.stringify(municipality));
