import { describe, it, expect } from 'vitest';
import { assessRoadHealth } from '../scripts/road-health.ts';
const graph = { version: 1, source: 'OpenStreetMap/Geofabrik',
  createdAt: '2026-10-19T09:00:00.000Z',
  nodes: [[-15.45293, -47.60913], [-15.45295, -47.60915]],
  edges: [[0,1,7],[1,0,7]] };
describe('monitoramento automático da malha viária', () => {
  it('detecta idade e reporta quantidade sem consultar GPS pessoal', () => {
    expect(assessRoadHealth(graph, new Date('2026-10-20T09:00:00Z'))).toEqual({
      status: 'healthy', nodes: 2, edges: 2, ageDays: 1,
    });
  });
  it('rejeita snapshot obsoleto ou adulterado', () => {
    expect(assessRoadHealth(graph, new Date('2026-11-25T09:00:00Z')).status).toBe('stale');
    expect(() => assessRoadHealth({ ...graph, nodes: [] })).toThrow();
    expect(() => assessRoadHealth({ ...graph, edges: [[0,99,7]] })).toThrow();
  });
});
