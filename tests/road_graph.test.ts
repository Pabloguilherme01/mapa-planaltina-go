import { describe, expect, it } from 'vitest';
import { buildRoadGraph, planLocalRoute, prepareRoadGraph, validateRoadGraph } from '../src/utils/roadGraph.ts';

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
  it('reutiliza índice de roteamento validado para consultas repetidas no celular', () => {
    const graph = network([road('way/1')]);
    const first = prepareRoadGraph(graph, 'walking');
    expect(first).not.toBeNull();
    expect(prepareRoadGraph(graph, 'walking')).toBe(first);
    expect(prepareRoadGraph(graph, 'driving')).not.toBe(first);
    expect(planLocalRoute(graph, a, b, 'walking')?.coordinates).toHaveLength(3);
    expect(prepareRoadGraph(graph, 'walking')).toBe(first);
    expect(prepareRoadGraph({ ...graph, edges: [[0, 999999, 2]] }, 'walking')).toBeNull();
  });
  it('permite planejar em segmentos longos já mapeados no OSM, sem ligar ruas independentes', () => {
    const path = [[-47.603, -15.4542], [-47.597, -15.4542]];
    const graph = network([road('way/longa', {}, path)]);
    expect(validateRoadGraph(graph)).toBe(true);
    expect(graph.nodes.length).toBeGreaterThan(2);
    const mid = { lat: -15.4542, lng: -47.600 };
    const finish = { lat: -15.4542, lng: -47.597 };
    const calculated = planLocalRoute(graph, mid, finish, 'walking');
    expect(calculated).not.toBeNull();
    expect(calculated!.startAccessMeters).toBeLessThan(65);
    expect(calculated!.distanceMeters).toBeGreaterThan(200);
    const distances = calculated!.coordinates.slice(1).map((p, i) => {
      const prev = calculated!.coordinates[i];
      return Math.abs(p[1] - prev[1]);
    });
    expect(Math.max(...distances)).toBeLessThan(0.001);
    const oneWay = network([road('way/longa-mao-unica', { oneway: 'yes' }, path)]);
    expect(planLocalRoute(oneWay, finish, mid, 'driving')).toBeNull();
  });

  it('A* escolhe a menor ligação OSM e não ignora mão única em percurso alternativo', () => {
    const west = [-47.603, -15.4542];
    const east = [-47.601, -15.4542];
    const eastNorth = [-47.601, -15.4537];
    const westNorth = [-47.603, -15.4537];
    const graph = network([
      road('way/direta', { oneway: 'yes' }, [west, [-47.602, -15.4542], east]),
      road('way/retorno', { oneway: 'yes' }, [east, eastNorth, westNorth, west]),
    ]);
    const outbound = planLocalRoute(graph, a, { lat: east[1], lng: east[0] }, 'driving');
    const returnTrip = planLocalRoute(graph, { lat: east[1], lng: east[0] }, a, 'driving');
    expect(outbound).not.toBeNull();
    expect(returnTrip).not.toBeNull();
    expect(outbound!.distanceMeters).toBeLessThan(260);
    expect(returnTrip!.distanceMeters).toBeGreaterThan(outbound!.distanceMeters);
    expect(outbound!.coordinates.every(([lat]) => Math.abs(lat - west[1]) < 0.00001)).toBe(true);
    expect(returnTrip!.coordinates.some(([lat]) => lat > west[1] + 0.0004)).toBe(true);
  });

  it('não perde a rua mais próxima em bordas de células do índice espacial', () => {
    const graph = network([road('way/1')]);
    const start = { lat: -15.4542 + 0.0012, lng: -47.603 };
    expect(planLocalRoute(graph, start, b, 'walking')?.startAccessMeters).toBeGreaterThan(100);
  });
  it('respeita mão única para carros mas permite caminhada no sentido contrário', () => {
    const graph = network([road('way/1', { oneway: 'yes' })]);
    expect(planLocalRoute(graph, b, a, 'driving')).toBeNull();
    expect(planLocalRoute(graph, b, a, 'walking')?.coordinates).toHaveLength(3);
    expect(planLocalRoute(graph, a, b, 'driving')).not.toBeNull();
  });
  it('respeita sentido implícito e exceções explícitas em autoestradas e rotatórias', () => {
    const motorway = network([road('way/1', { highway: 'motorway' })]);
    expect(planLocalRoute(motorway, a, b, 'driving')).not.toBeNull();
    expect(planLocalRoute(motorway, b, a, 'driving')).toBeNull();
    const twoWay = network([road('way/1', { highway: 'motorway', oneway: 'no' })]);
    expect(planLocalRoute(twoWay, b, a, 'driving')).not.toBeNull();
    const roundabout = network([road('way/1', { junction: 'roundabout' })]);
    expect(planLocalRoute(roundabout, b, a, 'driving')).toBeNull();
    const reverse = network([road('way/1', { highway: 'motorway', oneway: '-1' })]);
    expect(planLocalRoute(reverse, a, b, 'driving')).toBeNull();
    expect(planLocalRoute(reverse, b, a, 'driving')).not.toBeNull();
  });
  it('respeita os sentidos específicos para bicicleta, inclusive exceções em mão única invertida', () => {
    for (const [tags, forward, backward] of [
      [{ oneway: 'yes', 'oneway:bicycle': 'no' }, true, true],
      [{ oneway: '-1', 'oneway:bicycle': 'yes' }, true, false],
      [{ 'oneway:bicycle': '-1' }, false, true],
      [{ 'oneway:bicycle': 'yes' }, true, false],
    ] as const) {
      const graph = network([road('way/1', tags)]);
      expect(Boolean(planLocalRoute(graph, a, b, 'bicycling'))).toBe(forward);
      expect(Boolean(planLocalRoute(graph, b, a, 'bicycling'))).toBe(backward);
    }
  });
  it('respeita exceções explícitas OSM de acesso por modo, sem liberar acesso privado para outros', () => {
    const pedestrian = network([road('way/pedestres', { access: 'private', foot: 'yes' })]);
    expect(planLocalRoute(pedestrian, a, b, 'walking')).not.toBeNull();
    expect(planLocalRoute(pedestrian, a, b, 'driving')).toBeNull();
    expect(planLocalRoute(pedestrian, a, b, 'bicycling')).toBeNull();

    const cycle = network([road('way/bicicleta', { access: 'no', bicycle: 'designated' })]);
    expect(planLocalRoute(cycle, a, b, 'bicycling')).not.toBeNull();
    expect(planLocalRoute(cycle, a, b, 'walking')).toBeNull();
    expect(planLocalRoute(cycle, a, b, 'driving')).toBeNull();

    const car = network([road('way/carro', { access: 'no', vehicle: 'no', motorcar: 'yes' })]);
    expect(planLocalRoute(car, a, b, 'driving')).not.toBeNull();
    expect(planLocalRoute(car, a, b, 'walking')).toBeNull();
    expect(planLocalRoute(car, a, b, 'bicycling')).toBeNull();

    const localOnly = network([road('way/destino', { access: 'destination' })]);
    expect(localOnly.edges).toHaveLength(0);
  });

  it('não cria rota contrária a oneway:foot ou em via motorroad para pedestres', () => {
    const oneWay = network([road('way/sentido-pedestre', { 'oneway:foot': 'yes' })]);
    expect(planLocalRoute(oneWay, a, b, 'walking')).not.toBeNull();
    expect(planLocalRoute(oneWay, b, a, 'walking')).toBeNull();
    const reverse = network([road('way/sentido-inverso', { 'oneway:foot': '-1' })]);
    expect(planLocalRoute(reverse, a, b, 'walking')).toBeNull();
    expect(planLocalRoute(reverse, b, a, 'walking')).not.toBeNull();
    const motorroad = network([road('way/motorroad', { highway: 'trunk', motorroad: 'yes' })]);
    expect(planLocalRoute(motorroad, a, b, 'walking')).toBeNull();
    expect(planLocalRoute(motorroad, a, b, 'bicycling')).toBeNull();
    expect(planLocalRoute(motorroad, a, b, 'driving')).not.toBeNull();
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
  it('não anuncia rota quando início e fim são conectados ao mesmo nó sem trecho percorrido', () => {
    const graph=network([road('way/1')]);
    const from = { lat: -15.4542, lng: -47.60302 };
    const to = { lat: -15.4542, lng: -47.60298 };
    expect(planLocalRoute(graph, from, to, 'walking')).toBeNull();
  });
  it('recusa GPS longe da rede e grafo corrompido', () => {
    const graph = network([road('way/1')]);
    expect(planLocalRoute(graph, { lat: -15.48, lng: -47.65 }, b, 'driving')).toBeNull();
    expect(validateRoadGraph({ ...graph, edges: [[0, 5000, 1]] })).toBe(false);
    expect(validateRoadGraph({ ...graph, createdAt: 'ontem' })).toBe(false);
  });
});
