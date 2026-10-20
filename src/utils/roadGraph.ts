import { inPlanaltina } from './territory.ts';
import { distanceMeters, type MapCoordinates } from './catalogFilters.ts';
import type { TravelMode } from './mobility.ts';

export const CAR = 1, WALK = 2, BIKE = 4;
export type RoadNode = [number, number]; // latitude, longitude
export type RoadEdge = [number, number, number]; // nó origem, nó destino, modos permitidos
export interface RoadGraph {
  version: 1;
  source: 'OpenStreetMap/Geofabrik';
  createdAt: string;
  nodes: RoadNode[];
  edges: RoadEdge[];
}
export interface LocalRoute {
  coordinates: RoadNode[];
  distanceMeters: number;
  startAccessMeters: number;
  endAccessMeters: number;
}
type RawFeature = { geometry?: { type?: unknown; coordinates?: unknown }; properties?: Record<string, unknown> };
const driveRoads = new Set(['motorway','trunk','primary','secondary','tertiary','unclassified','residential','living_street','service','motorway_link','trunk_link','primary_link','secondary_link','tertiary_link','track']);
const walkRoads = new Set([...driveRoads, 'pedestrian','footway','path','steps','cycleway','bridleway']);
const cycleRoads = new Set([...driveRoads, 'cycleway','path','footway','pedestrian','bridleway']);
const accessDenied = (v: unknown) => v === 'private' || v === 'no';

function permissions(tags: Record<string, unknown>): { forward: number; backward: number } {
  const highway = tags.highway;
  if (typeof highway !== 'string' || accessDenied(tags.access) ||
      tags.abandoned === 'yes' || tags.disused === 'yes' || tags.construction === 'yes' ||
      highway === 'construction' || highway === 'proposed') return { forward: 0, backward: 0 };
  let drive = driveRoads.has(highway) && !accessDenied(tags.motor_vehicle) && !accessDenied(tags.motorcar) &&
    !accessDenied(tags.vehicle);
  const walk = walkRoads.has(highway) && highway !== 'motorway' && highway !== 'motorway_link' &&
    !accessDenied(tags.foot);
  const bike = cycleRoads.has(highway) && !['motorway','trunk','motorway_link','trunk_link','steps'].includes(highway) &&
    !accessDenied(tags.bicycle) && !accessDenied(tags.vehicle);
  if (tags.motor_vehicle === 'destination' || tags.motorcar === 'destination') drive = false;
  const forward = (drive ? CAR : 0) | (walk ? WALK : 0) | (bike ? BIKE : 0);
  if (!forward) return { forward: 0, backward: 0 };
  const oneway = tags.oneway === 'yes' || tags.oneway === '1' || tags.oneway === 'true' ||
    tags.junction === 'roundabout';
  const reverse = tags.oneway === '-1';
  const bothCycle = tags['oneway:bicycle'] === 'no';
  const backward = (drive && !oneway && !reverse ? CAR : 0) |
    (walk ? WALK : 0) |
    (bike && (!oneway && !reverse || bothCycle) ? BIKE : 0);
  if (reverse) {
    return { forward: forward & ~(CAR | (bothCycle ? 0 : BIKE)), backward: backward | (drive ? CAR : 0) | (bike ? BIKE : 0) };
  }
  return { forward, backward };
}
function segments(feature: RawFeature): unknown[][] {
  const shape = feature.geometry;
  if (shape?.type === 'LineString' && Array.isArray(shape.coordinates)) return [shape.coordinates];
  if (shape?.type === 'MultiLineString' && Array.isArray(shape.coordinates)) return shape.coordinates.filter(Array.isArray);
  return [];
}
function goodCoordinates(position: unknown): position is [number, number] {
  return Array.isArray(position) && position.length >= 2 &&
    typeof position[0] === 'number' && typeof position[1] === 'number' &&
    Number.isFinite(position[0]) && Number.isFinite(position[1]) &&
    Math.abs(position[0]) <= 180 && Math.abs(position[1]) <= 90;
}
export function buildRoadGraph(payload: unknown, createdAt: string): RoadGraph {
  if (!payload || typeof payload !== 'object' || !('features' in payload) ||
      !Array.isArray(payload.features) || payload.features.length > 250_000) {
    throw new Error('Extrato de vias ausente ou acima do limite de segurança.');
  }
  if (!Number.isFinite(Date.parse(createdAt))) throw new Error('Data de extração de ruas inválida.');
  const nodes: RoadNode[] = [], edges: RoadEdge[] = [];
  const index = new Map<string, number>();
  function nodeAt(lon: number, lat: number): number {
    const key = lat.toFixed(7) + ',' + lon.toFixed(7);
    const found = index.get(key);
    if (found !== undefined) return found;
    const n = nodes.length;
    nodes.push([lat, lon]);
    index.set(key, n);
    return n;
  }
  for (const raw of payload.features as RawFeature[]) {
    if (!raw?.properties || typeof raw.properties !== 'object') continue;
    const mask = permissions(raw.properties);
    if (!mask.forward && !mask.backward) continue;
    for (const line of segments(raw)) {
      if (line.length > 20_000) continue;
      for (let i = 1; i < line.length; i++) {
        const first = line[i - 1], second = line[i];
        if (!goodCoordinates(first) || !goodCoordinates(second)) continue;
        if (!inPlanaltina(first[1], first[0]) || !inPlanaltina(second[1], second[0])) continue;
        const a = nodeAt(first[0], first[1]), b = nodeAt(second[0], second[1]);
        if (a === b) continue;
        if (mask.forward) edges.push([a, b, mask.forward]);
        if (mask.backward) edges.push([b, a, mask.backward]);
      }
    }
  }
  if (nodes.length > 450_000 || edges.length > 1_300_000) {
    throw new Error('Malha rodoviária acima do limite do navegador.');
  }
  return { version: 1, source: 'OpenStreetMap/Geofabrik', createdAt, nodes, edges };
}
export function validateRoadGraph(data: unknown): data is RoadGraph {
  if (!data || typeof data !== 'object') return false;
  const g = data as Partial<RoadGraph>;
  if (g.version !== 1 || g.source !== 'OpenStreetMap/Geofabrik' ||
      typeof g.createdAt !== 'string' || !Number.isFinite(Date.parse(g.createdAt)) ||
      !Array.isArray(g.nodes) || !Array.isArray(g.edges) ||
      g.nodes.length > 450_000 || g.edges.length > 1_300_000) return false;
  return g.nodes.every(n => Array.isArray(n) && n.length === 2 &&
    Number.isFinite(n[0]) && Number.isFinite(n[1]) && Math.abs(n[0]) <= 90 && Math.abs(n[1]) <= 180) &&
    g.edges.every(e => Array.isArray(e) && e.length === 3 &&
      Number.isSafeInteger(e[0]) && e[0] >= 0 && e[0] < g.nodes!.length &&
      Number.isSafeInteger(e[1]) && e[1] >= 0 && e[1] < g.nodes!.length &&
      Number.isSafeInteger(e[2]) && e[2] >= 1 && e[2] <= 7);
}
function nearest(graph: RoadGraph, position: MapCoordinates, active: Set<number>): { id: number; distance: number } | null {
  let best = -1, distance = Infinity;
  for (const index of active) {
    const node = graph.nodes[index];
    const gap = distanceMeters(position, { lat: node[0], lng: node[1] });
    if (gap < distance) { distance = gap; best = index; }
  }
  return best >= 0 && distance <= 350 ? { id: best, distance } : null;
}
class MinHeap {
  private data: [number, number][] = [];
  push(pair: [number, number]): void {
    const a = this.data;
    let i = a.length;
    a.push(pair);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= pair[0]) break;
      a[i] = a[p]; i = p;
    }
    a[i] = pair;
  }
  pop(): [number, number] | undefined {
    const a = this.data;
    if (!a.length) return;
    const first = a[0], last = a.pop()!;
    if (a.length) {
      let i = 0;
      while (i * 2 + 1 < a.length) {
        let c = i * 2 + 1;
        if (c + 1 < a.length && a[c + 1][0] < a[c][0]) c++;
        if (a[c][0] >= last[0]) break;
        a[i] = a[c]; i = c;
      }
      a[i] = last;
    }
    return first;
  }
  get length(): number { return this.data.length; }
}
export function planLocalRoute(graph: RoadGraph, start: MapCoordinates, end: MapCoordinates, mode: TravelMode): LocalRoute | null {
  if (!validateRoadGraph(graph) || ![start.lat,start.lng,end.lat,end.lng].every(Number.isFinite)) return null;
  const flag = mode === 'driving' ? CAR : mode === 'walking' ? WALK : BIKE;
  const adj: { to: number; weight: number }[][] = Array.from({ length: graph.nodes.length }, () => []);
  const endpoints = new Set<number>();
  for (const [u,v,allowed] of graph.edges) {
    if (!(allowed & flag)) continue;
    const a = graph.nodes[u], b = graph.nodes[v];
    adj[u].push({ to: v, weight: distanceMeters({lat:a[0],lng:a[1]},{lat:b[0],lng:b[1]}) });
    endpoints.add(u); endpoints.add(v);
  }
  const source = nearest(graph, start, endpoints), target = nearest(graph, end, endpoints);
  if (!source || !target) return null;
  const distances = new Float64Array(graph.nodes.length).fill(Infinity);
  const previous = new Int32Array(graph.nodes.length).fill(-1);
  const heap = new MinHeap();
  distances[source.id] = 0;
  heap.push([0, source.id]);
  while (heap.length) {
    const item = heap.pop()!;
    const [cost, from] = item;
    if (cost > distances[from]) continue;
    if (from === target.id) break;
    for (const edge of adj[from]) {
      const d = cost + edge.weight;
      if (d < distances[edge.to]) {
        distances[edge.to] = d; previous[edge.to] = from;
        heap.push([d, edge.to]);
      }
    }
  }
  if (!Number.isFinite(distances[target.id])) return null;
  const coordinates: RoadNode[] = [];
  let current = target.id;
  while (current !== -1 && coordinates.length <= graph.nodes.length) {
    coordinates.push(graph.nodes[current]);
    if (current === source.id) break;
    current = previous[current];
  }
  if (coordinates.length > graph.nodes.length || current === -1) return null;
  coordinates.reverse();
  return { coordinates,
    distanceMeters: Math.round(distances[target.id] + source.distance + target.distance),
    startAccessMeters: Math.round(source.distance),
    endAccessMeters: Math.round(target.distance),
  };
}
