import { expect, it } from 'vitest';
import { SCHOOL_REGISTRY } from '../src/data/schoolRegistry.ts';
it('preserva cadastro municipal sem contatos e sem inventar geometria', () => {
  expect(SCHOOL_REGISTRY.items.length).toBeGreaterThan(0);
  expect(SCHOOL_REGISTRY.items.every(item => item.municipality === 'Planaltina' && Number(item.year) === SCHOOL_REGISTRY.referenceYear)).toBe(true);
  expect(new Set(SCHOOL_REGISTRY.items.map(item => item.code)).size).toBe(SCHOOL_REGISTRY.items.length);
  expect(SCHOOL_REGISTRY.geometry).toBe('not_provided');
  expect(JSON.stringify(SCHOOL_REGISTRY)).not.toMatch(/telefone|email|latitude|longitude/i);
});
