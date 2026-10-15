import { describe, expect, it } from 'vitest';
import snapshot from '../data/fuelRegistry.json';
import { parseFuelRegistry, filterFuelStations } from './fuelRegistry';

describe('cadastro ANP municipal', () => {
  it('valida 17 revendedores com nome, sem geometria ou preço presumido', () => {
    const registry = parseFuelRegistry(snapshot);
    expect(registry.items).toHaveLength(17);
    expect(registry.items.every(item => /\p{L}/u.test(item.name))).toBe(true);
    expect(JSON.stringify(registry.items)).not.toMatch(/"(lat|lng|price|cnpj|phone|email)"/);
  });
  it('bloqueia outro município, CNPJ como nome, duplicação e datas futuras', () => {
    const invalid = structuredClone(snapshot);
    invalid.items[0].municipality = 'BRASILIA';
    expect(() => parseFuelRegistry(invalid)).toThrow();
    invalid.items[0].municipality = 'PLANALTINA'; invalid.items[0].name = '12345678000199';
    expect(() => parseFuelRegistry(invalid)).toThrow();
    expect(() => parseFuelRegistry({ ...snapshot, items: [snapshot.items[0], snapshot.items[0]] })).toThrow();
    expect(() => parseFuelRegistry({ ...snapshot, retrievedAt: '2099-01-01T00:00:00Z' })).toThrow();
  });
  it('combina nome/endereço e bandeira sem confundir municípios', () => {
    const items = parseFuelRegistry(snapshot).items;
    expect(filterFuelStations(items, 'f1 itapua', 'BANDEIRA BRANCA')).toHaveLength(1);
    expect(filterFuelStations(items, 'f1 itapua', 'VIBRA')).toHaveLength(0);
  });
  it('bloqueia campos de contato, preços ou coordenadas não contratados', () => {
    expect(() => parseFuelRegistry({ ...snapshot, items: [{ ...snapshot.items[0], lat: -15.45 }] })).toThrow();
    expect(() => parseFuelRegistry({ ...snapshot, items: [{ ...snapshot.items[0], cnpj: '123' }] })).toThrow();
  });
});
