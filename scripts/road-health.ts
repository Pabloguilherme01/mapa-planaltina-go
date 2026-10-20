import { validateRoadGraph } from '../src/utils/roadGraph.ts';
export function assessRoadHealth(payload: unknown, now = new Date(), maxAgeDays = 21) {
  if (!validateRoadGraph(payload) || !payload.nodes.length || !payload.edges.length) {
    throw new Error('Grafo municipal publicado inválido.');
  }
  const ageDays = Math.floor((now.getTime() - Date.parse(payload.createdAt)) / 86_400_000);
  if (!Number.isFinite(ageDays) || ageDays < 0) throw new Error('Malha viária com data futura inválida.');
  return { status: ageDays >= maxAgeDays ? 'stale' as const : 'healthy' as const,
    nodes: payload.nodes.length, edges: payload.edges.length, ageDays };
}
