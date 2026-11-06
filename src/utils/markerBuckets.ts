import type { MapPoint } from '../types/index.ts';

/** Agrupa em grade de 44px no zoom baixo, em O(n), sem cópias por inserção. */
export function groupMapPoints(
  points: readonly MapPoint[],
  zoom: number,
  project: (point: MapPoint) => { x: number; y: number }
): Map<string, MapPoint[]> {
  const buckets = new Map<string, MapPoint[]>();
  for (const point of points) {
    let key = point.id;
    if (zoom < 17) {
      const pixel = project(point);
      key = `${Math.floor(pixel.x / 44)}:${Math.floor(pixel.y / 44)}`;
    } else {
      // Mesmo no zoom alto, pins no mesmo local devem continuar acessíveis
      // por uma lista de seleção, em vez de ficarem uns sobre os outros.
      key = `coord:${point.lat.toFixed(7)}:${point.lng.toFixed(7)}`;
    }
    const bucket = buckets.get(key);
    if (bucket) bucket.push(point);
    else buckets.set(key, [point]);
  }
  return buckets;
}
