import { describe, it, expect } from 'vitest';
import { geojsonToOsmElements } from '../scripts/import-geofabrik-geojson.ts';
import { mapOverpassElements } from '../src/utils/osmCatalog.ts';

const validPoint = (id: number, name: string) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-47.6029, -15.4542] },
  properties: { '@id': id, '@type': 'node', name, amenity: 'school' },
});

describe('importação do extrato Geofabrik sem geocodificação', () => {
  it('preserva IDs nativos de nós e dados escolares identificados', () => {
    const result = geojsonToOsmElements({ type: 'FeatureCollection', features: [validPoint(55, 'Escola Teste')] });
    expect(mapOverpassElements({ elements: result }, '2026-10-19T12:00:00.000Z')[0].id).toBe('osm-node-55');
  });

  it('converte geometrias de áreas de forma conservadora e evita coordenadas inventadas', () => {
    const features = [
      { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[-47.61,-15.46],[-47.60,-15.46],[-47.60,-15.45],[-47.61,-15.45],[-47.61,-15.46]]] }, properties: { '@id': '79', '@type': 'way', shop: 'supermarket', name: 'Mercado Central' } },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { '@id': 88, '@type': 'node', shop: 'bakery', name: 'Fora' } },
      { type: 'Feature', geometry: null, properties: { '@id': 99, '@type': 'relation', amenity: 'hospital', name: 'Sem geometria' } },
    ];
    const result = mapOverpassElements({ elements: geojsonToOsmElements({ features }) }, '2026-10-19T12:00:00.000Z');
    expect(result.map(p => p.id)).toEqual(['osm-way-79']);
    expect(result[0].category).toBe('Comércio');
  });

  it('não utiliza metadados de contribuidores e rejeita identidades e geometrias suspeitas', () => {
    const point = { ...validPoint(51, 'Panificadora'), properties: { ...validPoint(51, '').properties, amenity: 'bank', '@user': 'private_user', phone: '61999999999' } };
    const result = geojsonToOsmElements({ features: [
      point,
      { ...validPoint(0, 'zero'), properties: { '@id': 0, '@type': 'node', shop: 'bakery', name: 'zero' } },
      { ...validPoint(2, 'inválido'), geometry: { type: 'Point', coordinates: ['0', -15.4] } },
    ] });
    expect(result).toHaveLength(1);
    expect(JSON.stringify(result)).not.toContain('private_user');
    expect(JSON.stringify(mapOverpassElements({ elements: result }, '2026-10-19T12:00:00.000Z'))).not.toContain('61999999999');
  });
});
