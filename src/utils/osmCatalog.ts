import type { MapPoint, PointCategory } from '../types/index.ts';
import { MUNICIPAL_BOUNDARY } from '../data/municipalBoundary.ts';
import { inPlanaltina } from './territory.ts';
import { isSnapshotDate } from './snapshotDate.ts';

type Tags = Record<string, unknown>;
type OsmElement = { type?: unknown; id?: unknown; lat?: unknown; lon?: unknown; center?: { lat?: unknown; lon?: unknown }; tags?: unknown };
type Kind = { category: PointCategory; label: string };

const AMENITIES: Record<string, Kind> = {
  school: { category: 'Educação', label: 'Escola' },
  kindergarten: { category: 'Educação', label: 'Educação infantil' },
  college: { category: 'Educação', label: 'Faculdade' },
  university: { category: 'Educação', label: 'Universidade' },
  library: { category: 'Educação', label: 'Biblioteca' },
  hospital: { category: 'Saúde', label: 'Hospital' },
  clinic: { category: 'Saúde', label: 'Clínica' },
  doctors: { category: 'Saúde', label: 'Consultório' },
  dentist: { category: 'Saúde', label: 'Odontologia' },
  pharmacy: { category: 'Saúde', label: 'Farmácia' },
  police: { category: 'Segurança', label: 'Polícia' },
  fire_station: { category: 'Segurança', label: 'Bombeiros' },
  townhall: { category: 'Serviços Públicos', label: 'Prefeitura' },
  courthouse: { category: 'Serviços Públicos', label: 'Justiça' },
  post_office: { category: 'Serviços Públicos', label: 'Correios' },
  public_building: { category: 'Serviços Públicos', label: 'Órgão público' },
  social_facility: { category: 'Serviços Públicos', label: 'Assistência social' },
  community_centre: { category: 'Serviços Públicos', label: 'Centro comunitário' },
  bus_station: { category: 'Transporte', label: 'Rodoviária' },
  ferry_terminal: { category: 'Transporte', label: 'Terminal de transporte' },
  fuel: { category: 'Comércio', label: 'Posto de combustível' },
  marketplace: { category: 'Comércio', label: 'Feira' },
  bank: { category: 'Comércio', label: 'Banco' },
  atm: { category: 'Comércio', label: 'Caixa eletrônico' },
  restaurant: { category: 'Comércio', label: 'Restaurante' },
  cafe: { category: 'Comércio', label: 'Café' },
  fast_food: { category: 'Comércio', label: 'Lanchonete' },
  arts_centre: { category: 'Lazer', label: 'Centro cultural' },
  theatre: { category: 'Lazer', label: 'Teatro' },
  cinema: { category: 'Lazer', label: 'Cinema' },
};
const SHOPS: Record<string, string> = {
  supermarket: 'Supermercado', convenience: 'Mercado', bakery: 'Padaria',
  butcher: 'Açougue', clothes: 'Vestuário', shoes: 'Calçados',
  hardware: 'Ferragens', car_repair: 'Oficina', pharmacy: 'Farmácia',
  greengrocer: 'Hortifruti', electronics: 'Eletrônicos', furniture: 'Móveis',
  books: 'Livraria', hairdresser: 'Cabeleireiro', beauty: 'Beleza',
  mobile_phone: 'Telefonia', optician: 'Ótica', pet: 'Pet shop',
  agrarian: 'Agropecuária', farm: 'Produtos rurais',
};

const clean = (value: unknown, max = 160): string | null => {
  if (typeof value !== 'string') return null;
  const text = value.trim().replace(/\s+/g, ' ');
  if (!text || text.length > max || /[<>\u0000-\u001f]/.test(text)) return null;
  return text;
};
const tag = (tags: Tags, key: string) => clean(tags[key]) || '';

function classify(tags: Tags): Kind | null {
  const amenity = tag(tags, 'amenity');
  if (AMENITIES[amenity]) return AMENITIES[amenity];
  const shop = tag(tags, 'shop');
  if (shop && !['no', 'yes', 'vacant', 'closed'].includes(shop)) {
    return { category: shop === 'pharmacy' ? 'Saúde' : 'Comércio', label: SHOPS[shop] || shop.replace(/_/g, ' ') };
  }
  const office = tag(tags, 'office');
  if (['government', 'administrative'].includes(office)) return { category: 'Serviços Públicos', label: 'Órgão público' };
  if (office && !['no', 'yes'].includes(office)) return { category: 'Comércio', label: 'Escritório' };
  const transport = tag(tags, 'public_transport') || tag(tags, 'highway');
  if (['platform', 'station', 'stop_position', 'bus_stop'].includes(transport)) return { category: 'Transporte', label: 'Parada de transporte' };
  const leisure = tag(tags, 'leisure');
  if (['park', 'sports_centre', 'sports_hall', 'playground', 'stadium', 'fitness_centre'].includes(leisure)) return { category: 'Lazer', label: 'Lazer e esporte' };
  const tourism = tag(tags, 'tourism');
  if (['attraction', 'museum', 'viewpoint', 'gallery'].includes(tourism)) return { category: 'Lazer', label: 'Atrativo' };
  if (['hotel', 'guest_house', 'hostel', 'motel'].includes(tourism)) return { category: 'Comércio', label: 'Hospedagem' };
  const healthcare = tag(tags, 'healthcare');
  if (['hospital', 'clinic', 'doctor', 'dentist', 'pharmacy'].includes(healthcare)) return { category: 'Saúde', label: 'Serviço de saúde' };
  return null;
}

const ringCoords = MUNICIPAL_BOUNDARY.features.flatMap(feature => feature.geometry.coordinates.flatMap(ring => ring));
const minLat = Math.min(...ringCoords.map(([_, lat]) => lat));
const maxLat = Math.max(...ringCoords.map(([_, lat]) => lat));
const minLng = Math.min(...ringCoords.map(([lng]) => lng));
const maxLng = Math.max(...ringCoords.map(([lng]) => lng));

/** Uma consulta por build e filtro posterior pela malha IBGE; não consulta usuários nem faz geocodificação. */
export function overpassQuery(): string {
  const bbox = [minLat, minLng, maxLat, maxLng].map(value => value.toFixed(5)).join(',');
  return `[out:json][timeout:25];(nwr["name"]["amenity"](${bbox});nwr["name"]["shop"](${bbox});nwr["name"]["office"](${bbox});nwr["name"]["leisure"](${bbox});nwr["name"]["tourism"](${bbox});nwr["name"]["public_transport"](${bbox});nwr["name"]["highway"="bus_stop"](${bbox});nwr["name"]["healthcare"](${bbox}););out center tags;`;
}

export function mapOverpassElements(payload: unknown, retrievedAt: string): MapPoint[] {
  if (!payload || typeof payload !== 'object' || !('elements' in payload) || !Array.isArray(payload.elements)) return [];
  if (!isSnapshotDate(retrievedAt)) throw new Error('Coleta OSM com data inválida.');
  if (payload.elements.length > 100_000) throw new Error('Coleta OSM acima do limite para revisão.');
  const seen = new Set<string>();
  const points: MapPoint[] = [];
  for (const raw of payload.elements as OsmElement[]) {
    if (!raw || !['node', 'way', 'relation'].includes(String(raw.type)) ||
        (typeof raw.id !== 'number' || !Number.isSafeInteger(raw.id) || raw.id <= 0) ||
        !raw.tags || typeof raw.tags !== 'object' || Array.isArray(raw.tags)) continue;
    const tags = raw.tags as Tags;
    if (['private', 'no'].includes(tag(tags, 'access')) ||
        ['yes', 'true'].includes(tag(tags, 'disused')) ||
        ['yes', 'true'].includes(tag(tags, 'abandoned')) ||
        ['yes', 'true'].includes(tag(tags, 'demolished')) ||
        tag(tags, 'opening_date') === 'planned') continue;
    const name = clean(tags.name);
    const kind = classify(tags);
    if (!name || !kind) continue;
    const lat = raw.type === 'node' ? raw.lat : raw.center?.lat;
    const lng = raw.type === 'node' ? raw.lon : raw.center?.lon;
    if (typeof lat !== 'number' || typeof lng !== 'number' ||
        !Number.isFinite(lat) || !Number.isFinite(lng) || !inPlanaltina(lat, lng)) continue;
    const id = `osm-${raw.type}-${raw.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const street = clean(tags['addr:street'], 100);
    const number = clean(tags['addr:housenumber'], 24);
    const address = street ? [street, number].filter(Boolean).join(', ') : 'Endereço não informado no OpenStreetMap';
    points.push({
      id, name, category: kind.category, description: `${kind.label} cadastrado por contribuidores do OpenStreetMap. A existência e o atendimento não foram confirmados por órgão público.`,
      lat, lng, zone: 'Não classificada', isDemo: false, demoDisclaimer: '',
      provenanceMeta: {
        provenance: 'community', sourceName: 'OpenStreetMap — mapeamento colaborativo',
        sourceUrl: `https://www.openstreetmap.org/${raw.type}/${raw.id}`,
        license: 'ODbL 1.0', retrievedAt, verificationStatus: 'unverified',
        disclaimer: 'Localização informada pela comunidade; pode estar desatualizada ou imprecisa. Confirme o estabelecimento antes de se deslocar.',
      },
      tags: [`Tipo: ${kind.label}`, `OSM ${raw.type}/${raw.id}`],
      addressHint: address,
    });
  }
  return points.sort((a, b) => a.id.localeCompare(b.id));
}
