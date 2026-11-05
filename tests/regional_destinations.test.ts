import { describe, expect, it } from 'vitest';
import { REGIONAL_DESTINATIONS, regionalRouteUrl, type RegionalDestinationId } from '../src/utils/mobility.ts';

describe('atalhos externos regionais sem localização pessoal', () => {
  it('oferece quatro destinos geográficos diferentes e explicitamente identificados', () => {
    expect(REGIONAL_DESTINATIONS.map(r => r.id)).toEqual([
      'planaltina-df', 'sobradinho-df', 'brasilia-df', 'formosa-go',
    ]);
    expect(new Set(REGIONAL_DESTINATIONS.map(r => r.address)).size).toBe(4);
    expect(REGIONAL_DESTINATIONS[0].address).toContain('Distrito Federal');
  });
  it('não anexa origem, GPS ou coordenadas pessoais aos links de navegação', () => {
    for (const route of REGIONAL_DESTINATIONS) {
      for (const mode of ['driving', 'walking', 'bicycling'] as const) {
        const url = new URL(regionalRouteUrl(route.id, mode));
        expect(url.origin).toBe('https://www.google.com');
        expect(url.pathname).toBe('/maps/dir/');
        expect(url.searchParams.get('api')).toBe('1');
        expect(url.searchParams.get('destination')).toBe(route.address);
        expect(url.searchParams.get('travelmode')).toBe(mode);
        expect(url.searchParams.has('origin')).toBe(false);
        expect(url.searchParams.has('ll')).toBe(false);
        expect(url.searchParams.has('center')).toBe(false);
      }
    }
  });
  it('recusa identificador regional desconhecido', () => {
    expect(() => regionalRouteUrl('nao-existe' as RegionalDestinationId, 'driving')).toThrow('Destino regional indisponível');
  });
});
