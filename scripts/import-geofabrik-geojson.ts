import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapOverpassElements, validateOsmSnapshot } from '../src/utils/osmCatalog.ts';

type RecordValue = Record<string, unknown>;
type Position = { lat: number; lon: number };
type OsmElement = { type: 'node' | 'way' | 'relation'; id: number; lat?: number; lon?: number; center?: Position; tags: Record<string, string> };
const TAG_KEYS = new Set([
  'name', 'amenity', 'shop', 'office', 'leisure', 'tourism',
  'public_transport', 'highway', 'healthcare', 'access',
  'disused', 'abandoned', 'demolished', 'opening_date',
  'addr:street', 'addr:housenumber',
]);
const asRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function osmType(value: unknown): 'node' | 'way' | 'relation' | null {
  if (value === 'n' || value === 'node') return 'node';
  if (value === 'w' || value === 'way') return 'way';
  if (value === 'r' || value === 'relation') return 'relation';
  return null;
}

function numericId(value: unknown): number | null {
  if (typeof value === 'string' && !/^[1-9]\d{0,15}$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

/** Preferimos geometria publicada. Para polígonos/linhas usamos centro do envelope
 * apenas como ponto cartográfico aproximado e nunca como entrada geocodificada.
 */
function geometryCenter(raw: unknown): Position | null {
  if (!asRecord(raw)) return null;
  const type = raw.type;
  if (!['Point', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'].includes(String(type))) return null;
  const pairs: [number, number][] = [];
  const visit = (part: unknown, depth = 0) => {
    if (!Array.isArray(part) || depth > 8 || pairs.length > 100_000) return;
    if (part.length >= 2 && typeof part[0] === 'number' && typeof part[1] === 'number') {
      if (Number.isFinite(part[0]) && Number.isFinite(part[1])) pairs.push([part[0], part[1]]);
      return;
    }
    for (const child of part) visit(child, depth + 1);
  };
  visit(raw.coordinates);
  if (pairs.length === 0 || pairs.length > 100_000) return null;
  const lon = (Math.min(...pairs.map(p => p[0])) + Math.max(...pairs.map(p => p[0]))) / 2;
  const lat = (Math.min(...pairs.map(p => p[1])) + Math.max(...pairs.map(p => p[1]))) / 2;
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

export function geojsonToOsmElements(payload: unknown): OsmElement[] {
  if (!asRecord(payload) || !Array.isArray(payload.features)) return [];
  if (payload.features.length > 100_000) throw new Error('Extrato de POIs acima do limite de segurança.');
  const result: OsmElement[] = [];
  for (const feature of payload.features) {
    if (!asRecord(feature) || !asRecord(feature.properties)) continue;
    const properties = feature.properties;
    const type = osmType(properties['@type'] ?? properties.osm_type);
    const id = numericId(properties['@id'] ?? properties.osm_id);
    const center = geometryCenter(feature.geometry);
    if (!type || !id || !center) continue;
    const tags: Record<string, string> = {};
    for (const [key, value] of Object.entries(properties)) {
      if (TAG_KEYS.has(key) && typeof value === 'string') tags[key] = value;
    }
    if (!tags.name || !Object.keys(tags).some(key => key !== 'name' && !key.startsWith('addr:'))) continue;
    result.push(type === 'node'
      ? { type, id, lat: center.lat, lon: center.lon, tags }
      : { type, id, center, tags });
  }
  return result;
}

async function main() {
  const input = process.argv[2], output = process.argv[3];
  if (!input || !output) throw new Error('Forneça arquivo GeoJSON de origem e destino do snapshot.');
  const payload = JSON.parse(await readFile(input, 'utf8'));
  const points = mapOverpassElements({ elements: geojsonToOsmElements(payload) }, new Date().toISOString());
  const valid = validateOsmSnapshot({ points });
  if (!valid.length) throw new Error('Extrato Geofabrik sem pelo menos dez pontos válidos; snapshot anterior preservado.');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify({ points: valid }));
  console.log(JSON.stringify({ event: 'geofabrik-planaltina', accepted: valid.length, source: 'Geofabrik/OSM', output }));
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
