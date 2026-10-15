import { expect, it } from 'vitest';
import { inPlanaltina, inPolygon } from '../src/utils/territory.ts';
import { MUNICIPAL_BOUNDARY } from '../src/data/municipalBoundary.ts';

it('valida município e distingue UPA de Brasília', () => {
  expect(MUNICIPAL_BOUNDARY.features[0].properties.codarea).toBe('5217609');
  expect(inPlanaltina(-15.45293, -47.60913)).toBe(true);
  expect(inPlanaltina(-15.7939, -47.8828)).toBe(false);
  expect(inPlanaltina(NaN, -47)).toBe(false);
});
it('trata borda e buraco do polígono', () => {
  const rings = [[[0,0],[10,0],[10,10],[0,10],[0,0]], [[4,4],[6,4],[6,6],[4,6],[4,4]]];
  expect(inPolygon(0, 5, rings)).toBe(true);
  expect(inPolygon(2, 2, rings)).toBe(true);
  expect(inPolygon(5, 5, rings)).toBe(false);
  expect(inPolygon(11, 5, rings)).toBe(false);
});
