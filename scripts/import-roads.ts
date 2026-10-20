import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRoadGraph, validateRoadGraph } from '../src/utils/roadGraph.ts';

export async function importRoadGraph(input: string, output: string): Promise<{ nodes: number; edges: number }> {
  const data = JSON.parse(await readFile(input, 'utf8'));
  const graph = buildRoadGraph(data, new Date().toISOString());
  if (!validateRoadGraph(graph) || graph.nodes.length < 100 || graph.edges.length < 100) {
    throw new Error('Malha viária insuficiente para publicar o planejador local.');
  }
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(graph));
  const summary = { nodes: graph.nodes.length, edges: graph.edges.length };
  console.log(JSON.stringify({ event: 'road-graph-planaltina', ...summary, output }));
  return summary;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const input = process.argv[2], output = process.argv[3];
  if (!input || !output) {
    console.error('Uso: import-roads.ts entrada.geojson public/data/road-graph.json');
    process.exitCode = 1;
  } else {
    importRoadGraph(input, output).catch((err: unknown) => {
      console.error(err instanceof Error ? err.message : err);
      process.exitCode = 1;
    });
  }
}
