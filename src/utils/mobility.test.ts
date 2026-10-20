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
  it('integra Waze, Apple Maps e Organic Maps por URLs sem cobrança ou chave', () => {
    const dest = { lat: -15.45, lng: -47.61, name: 'Escola Municipal' };
    const waze = new URL(routeUrl(dest, 'driving', 'waze'));
    expect(waze.origin).toBe('https://waze.com');
    expect(waze.searchParams.get('ll')).toBe('-15.45,-47.61');
    expect(waze.searchParams.get('navigate')).toBe('yes');
    expect(() => routeUrl(dest, 'walking', 'waze')).toThrow(/carro/);
    const apple = new URL(routeUrl(dest, 'walking', 'apple'));
    expect(apple.origin).toBe('https://maps.apple.com');
    expect(apple.searchParams.get('daddr')).toBe('-15.45,-47.61');
    expect(apple.searchParams.get('dirflg')).toBe('w');
    const organic = new URL(routeUrl(dest, 'bicycling', 'organic'));
    expect(organic.origin).toBe('https://omaps.app');
    expect(organic.searchParams.get('ll')).toBe('-15.45,-47.61');
    expect(organic.searchParams.get('n')).toBe('Escola Municipal');
    expect(organic.searchParams.has('sll')).toBe(false);
    for (const provider of ['google', 'waze', 'apple', 'organic'] as const) {
      expect(() => routeUrl({ lat: 0, lng: 0 }, 'driving', provider)).toThrow();
    }
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
