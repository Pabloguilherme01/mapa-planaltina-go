import { describe, expect, it } from 'vitest';
import { estimateFuelCost, routeUrl, readTrip } from './mobility';

describe('planejamento privado', () => {
  it('monta navegação sem inventar origem', () => {
    const url = new URL(routeUrl({ lat: -15.45, lng: -47.61 }, 'walking'));
    expect(url.searchParams.get('travelmode')).toBe('walking');
    expect(url.searchParams.has('origin')).toBe(false);
  });
  it('rejeita coordenadas inválidas', () => {
    expect(() => routeUrl({ lat: NaN, lng: 0 }, 'driving')).toThrow();
  });
  it('calcula somente estimativa com entradas válidas', () => {
    expect(estimateFuelCost(100, 10, 6)).toBe(60);
    expect(estimateFuelCost(100, 0, 6)).toBeNull();
    expect(estimateFuelCost(-1, 10, 6)).toBeNull();
  });
  it('tolera armazenamento corrompido e limita identificadores', () => {
    expect(readTrip('{')).toBeNull();
    expect(readTrip('{"id":"a","mode":"walking"}')).toEqual({ id: 'a', mode: 'walking' });
    expect(readTrip('{"id":"a","mode":"bus"}')).toBeNull();
  });
});
