/**
 * GeoJSON FeatureCollection esquemático de Planaltina, Goiás (IBGE 5217609)
 * Geometrias sintéticas DEMO; não representam o perímetro oficial nem cursos d'água reais.
 */

export const PLANALTINA_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'boundary-planaltina-go',
      properties: {
        name: 'Área sintética DEMO — Planaltina, Goiás',
        provenance: 'demo',
        ibgeCode: '5217609',
        type: 'boundary',
        description: 'Polígono DEMO sem vínculo com limite municipal oficial.',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-47.66, -15.40],
            [-47.58, -15.41],
            [-47.54, -15.46],
            [-47.56, -15.52],
            [-47.64, -15.53],
            [-47.69, -15.48],
            [-47.68, -15.43],
            [-47.66, -15.40],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      id: 'zone-01-didatica',
      properties: {
        name: 'Área Demonstrativa 01',
        type: 'didactic_zone',
        color: '#BA623D',
        description: 'Zona Didática Central em Planaltina, Goiás (esquemática).',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-47.63, -15.44],
            [-47.60, -15.44],
            [-47.60, -15.47],
            [-47.63, -15.47],
            [-47.63, -15.44],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      id: 'hydro-rio-maranhao',
      properties: {
        name: 'Curso de água sintético DEMO',
        provenance: 'demo',
        type: 'hydrography',
        color: '#82C5E8',
        description: 'Linha sintética DEMO sem correspondência com curso hídrico real.',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-47.68, -15.41],
          [-47.64, -15.42],
          [-47.61, -15.41],
          [-47.57, -15.43],
          [-47.54, -15.42],
        ],
      },
    },
  ],
};
