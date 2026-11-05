import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mapOverpassElements } from '../src/utils/osmCatalog.ts';
import { geojsonToOsmElements } from '../scripts/import-geofabrik-geojson.ts';

// Protege a conexão entre categorias aceitas no catálogo e tags
// realmente extraídas pelo CI antes do importador Geofabrik.
describe('contrato da coleta OSM de locais adicionais', () => {
  const workflow = readFileSync(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
  it('extrai tags classificadas de ferrovias, emergência e patrimônio', () => {
    for (const item of [
      'nwr/railway=station',
      'nwr/railway=halt',
      'nwr/railway=tram_stop',
      'nwr/emergency=ambulance_station',
      'nwr/historic=memorial',
      'nwr/historic=monument',
      'nwr/historic=archaeological_site',
    ]) expect(workflow).toContain(item);
  });
  it('mantém ID, fonte e filtro territorial de um destino regional OSM', () => {
    const points = mapOverpassElements({
      elements: geojsonToOsmElements({ features: [
        {
          type: 'Feature',
          properties: { '@type': 'node', '@id': 981, name: 'Estação de teste', railway: 'station' },
          geometry: { type: 'Point', coordinates: [-47.6029, -15.4542] },
        },
        {
          type: 'Feature',
          properties: { '@type': 'node', '@id': 982, name: 'Fora do município', railway: 'station' },
          geometry: { type: 'Point', coordinates: [-46.63, -23.55] },
        },
      ] }),
    }, '2026-10-19T12:00:00.000Z');
    expect(points.map(p => p.id)).toEqual(['osm-node-981']);
    expect(points[0].category).toBe('Transporte');
    expect(points[0].provenanceMeta.verificationStatus).toBe('unverified');
  });
});
