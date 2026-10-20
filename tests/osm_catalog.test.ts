import { describe, it, expect } from 'vitest';
import { mapOverpassElements, overpassQuery, validateOsmSnapshot } from '../src/utils/osmCatalog.ts';

const snapshot = '2026-10-19T12:00:00.000Z';
const entry = (id: number, tags: Record<string, string>, lat = -15.4542, lon = -47.6029) =>
  ({ type: 'node', id, lat, lon, tags });

describe('catálogo OSM municipal', () => {
  it('publica somente POIs nomeados dentro da malha IBGE e conserva identidade OSM', () => {
    const result = mapOverpassElements({ elements: [
      entry(1, { amenity: 'school', name: 'Escola Comunitária' }),
      entry(2, { shop: 'supermarket', name: 'Mercado Exemplo' }),
      entry(3, { amenity: 'townhall', name: 'Atendimento Municipal' }),
      entry(4, { shop: 'bakery', name: 'Fora da cidade' }, -23.55, -46.63),
      entry(5, { shop: 'bakery' }),
      entry(6, { shop: 'bakery', name: 'Fechado', disused: 'yes' }),
    ] }, snapshot);
    expect(result.map(point => point.id)).toEqual(['osm-node-1', 'osm-node-2', 'osm-node-3']);
    expect(result.map(point => point.category)).toEqual(['Educação', 'Comércio', 'Serviços Públicos']);
    expect(result[0].provenanceMeta).toMatchObject({
      provenance: 'community', verificationStatus: 'unverified',
      license: 'ODbL 1.0', sourceUrl: 'https://www.openstreetmap.org/node/1',
    });
    expect(result.every(point => !point.isDemo && point.zone === 'Não classificada')).toBe(true);
  });

  it('aceita coordenadas centrais de ways e rejeita registros ambíguos ou duplicados', () => {
    const result = mapOverpassElements({ elements: [
      { type: 'way', id: 8, center: { lat: -15.4542, lon: -47.6029 }, tags: { amenity: 'hospital', name: 'Hospital de referência' } },
      { type: 'way', id: 8, center: { lat: -15.4542, lon: -47.6029 }, tags: { amenity: 'hospital', name: 'Duplicado' } },
      entry(9, { shop: 'retail', name: 'Residência privada', access: 'private' }),
      entry(10, { shop: 'retail', name: 'Nome estranho' }, 0, 0),
      entry(11, { amenity: 'school', name: '<img src=x onerror=alert(1)>' }),
    ] }, snapshot);
    expect(result.map(point => point.id)).toEqual(['osm-way-8']);
  });

  it('não atribui verificação oficial e não vaza telefone ou contato', () => {
    const [point] = mapOverpassElements({ elements: [
      entry(20, { shop: 'bakery', name: 'Panificadora Norte', phone: '61999999999', email: 'secreto@exemplo.org', 'addr:street': 'Rua 1' }),
    ] }, snapshot);
    expect(JSON.stringify(point)).not.toContain('61999999999');
    expect(JSON.stringify(point)).not.toContain('secreto@exemplo.org');
    expect(point.tags).toContain('Tipo: Padaria');
  });

  it('reutiliza somente snapshot de dez ou mais pontos sanitizados e geolocalizados', () => {
    const batch = Array.from({ length: 10 }, (_, i) =>
      entry(100 + i, { shop: 'bakery', name: `Padaria ${i}` }));
    const points = mapOverpassElements({ elements: batch }, snapshot);
    expect(validateOsmSnapshot({ points })).toEqual(points);
    expect(validateOsmSnapshot({ points: points.slice(0, 9) })).toEqual([]);
    expect(validateOsmSnapshot({ points: points.map((p, i) => i === 0 ? { ...p, lat: 0 } : p) })).toEqual([]);
    expect(validateOsmSnapshot({ points: points.map((p, i) => i === 0 ? { ...p, id: 'osm-node-102' } : p) })).toEqual([]);
    expect(validateOsmSnapshot({ points: points.map((p, i) => i === 0 ? { ...p, provenanceMeta: { ...p.provenanceMeta, verificationStatus: 'verified' } } : p) })).toEqual([]);
  });

  it('resiste a JSON inválido e restringe a área consultada', () => {
    expect(mapOverpassElements({}, snapshot)).toEqual([]);
    expect(mapOverpassElements({ elements: null }, snapshot)).toEqual([]);
    expect(overpassQuery()).toContain('out center tags');
    expect(overpassQuery()).toContain('shop');
    expect(overpassQuery()).not.toContain('around:');
  });
});
