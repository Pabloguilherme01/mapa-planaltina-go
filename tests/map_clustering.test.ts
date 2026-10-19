import { describe, expect, it } from 'vitest';
import type { MapPoint } from '../src/types/index.ts';
import { groupMapPoints } from '../src/utils/markerBuckets.ts';

const point = (id: string, lat: number, lng: number) => ({ id, lat, lng } as MapPoint);
const project = (item: MapPoint) => ({ x: item.lat, y: item.lng });

describe('agrupamento geográfico de marcadores', () => {
  it('preserva agrupamento pelo mesmo quadrante e ordem de inserção', () => {
    const values = [point('a', 0, 0), point('b', 43, 43), point('c', 44, 0), point('d', -1, -1)];
    const groups = [...groupMapPoints(values, 13, project).values()];
    expect(groups.map(bucket => bucket.map(item => item.id))).toEqual([
      ['a', 'b'], ['c'], ['d'],
    ]);
  });

  it('no zoom alto mantém um marcador por ID sem projetar pontos', () => {
    const values = [point('a', 0, 0), point('b', 43, 43)];
    const groups = groupMapPoints(values, 17, () => {
      throw new Error('projeção não deveria ser necessária no zoom alto');
    });
    expect([...groups.values()].map(bucket => bucket[0].id)).toEqual(['a', 'b']);
  });

  it('retorna vazio sem gerar marcadores artificiais', () => {
    expect(groupMapPoints([], 13, project).size).toBe(0);
  });
});
