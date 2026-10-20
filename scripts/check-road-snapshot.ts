import { readFile } from 'node:fs/promises';
import { assessRoadHealth } from './road-health.ts';

const path = process.argv[2];
if (!path) {
  console.error('Informe o arquivo road-graph.json.');
  process.exitCode = 1;
} else {
  try {
    const snapshot: unknown = JSON.parse(await readFile(path,'utf8'));
    const health = assessRoadHealth(snapshot);
    if (health.status !== 'healthy' || health.nodes < 100 || health.edges < 100) {
      throw new Error('Malha viária vazia, insuficiente ou com mais de 21 dias.');
    }
    console.log(JSON.stringify({event:'road-graph-fallback-validated', ...health}));
  } catch(error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
