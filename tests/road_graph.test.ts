import { describe, expect, it } from 'vitest';
import { buildRoadGraph, planLocalRoute, validateRoadGraph } from '../src/utils/roadGraph.ts';

const coords = [[-47.603, -15.4542], [-47.6025, -15.4542], [-47.602, -15.4542]];
const road = (id: string, properties: Record<string, unknown> = {}, path = coords) => ({
  type: 'Feature', id, properties: { highway: 'residential', ...properties },
  geometry: { type: 'LineString', coordinates: path },
});
const network = (features: unknown[]) => buildRoadGraph({ type: 'FeatureCollection', features }, '2026-10-19T12:00:00.000Z');
const a = { lat: -15.4542, lng: -47.603 };
const b = { lat: -15.4542, lng: -47.602 };

describe('roteamento local por ruas OSM', () => {
  it('cria grafo e calcula caminho real na malha sem mandar GPS a servidores', () => {
    const graph = network([road('way/1')]);
    expect(validateRoadGraph(graph)).toBe(true);
    const result = planLocalRoute(graph, a, b, 'driving');
    expect(result?.coordinates).toHaveLength(3);
    expect(result?.distanceMeters).toBeGreaterThan(100);
    expect(result?.distanceMeters).toBeLessThan(120);
  });
  it('respeita mão única para carros mas permite caminhada no sentido contrário', () => {
    const graph = network([road('way/1', { oneway: 'yes' })]);
    expect(planLocalRoute(graph, b, a, 'driving')).toBeNull();
    expect(planLocalRoute(graph, b, a, 'walking')?.coordinates).toHaveLength(3);
    expect(planLocalRoute(graph, a, b, 'driving')).not.toBeNull();
  });
  it('não manda carro para ciclovia nem cria pontes entre ruas desconexas', () => {
    const graph = network([
      road('way/1', { highway: 'cycleway' }),
      road('way/2', {}, [[-47.600, -15.4542], [-47.599, -15.4542]]),
    ]);
    expect(planLocalRoute(graph, a, b, 'driving')).toBeNull();
    expect(planLocalRoute(graph, a, b, 'bicycling')).not.toBeNull();
    expect(planLocalRoute(graph, a, { lat: -15.4542, lng: -47.599 }, 'bicycling')).toBeNull();
  });
  it('descarta segmentos fora do município e caminhos com acesso privado', () => {
    const graph = network([
      road('way/1', { access: 'private' }),
      road('way/2', {}, [[-47.602, -15.4542], [-46.63, -23.55]]),
    ]);
    expect(graph.edges).toHaveLength(0);
    expect(planLocalRoute(graph, a, b, 'walking')).toBeNull();
  });
  it('recusa GPS longe da rede e grafo corrompido', () => {
    const graph = network([road('way/1')]);
    expect(planLocalRoute(graph, { lat: -15.48, lng: -47.65 }, b, 'driving')).toBeNull();
    expect(validateRoadGraph({ ...graph, edges: [[0, 5000, 1]] })).toBe(false);
    expect(validateRoadGraph({ ...graph, createdAt: 'ontem' })).toBe(false);
  });
});
