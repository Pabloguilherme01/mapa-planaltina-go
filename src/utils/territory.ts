import { MUNICIPAL_BOUNDARY } from '../data/municipalBoundary.ts';

function inRing(x: number, y: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[j], [bx, by] = ring[i];
    const cross = (x - ax) * (by - ay) - (y - ay) * (bx - ax);
    if (Math.abs(cross) < 1e-10 && x >= Math.min(ax, bx) && x <= Math.max(ax, bx)
      && y >= Math.min(ay, by) && y <= Math.max(ay, by)) return true;
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}

export function inPolygon(lng: number, lat: number, rings: number[][][]): boolean {
  return Number.isFinite(lng) && Number.isFinite(lat) && rings.length > 0
    && inRing(lng, lat, rings[0]) && !rings.slice(1).some(ring => inRing(lng, lat, ring));
}

/** Triagem pela malha simplificada IBGE; não é levantamento cadastral de precisão. */
export function inPlanaltina(lat: number, lng: number): boolean {
  return MUNICIPAL_BOUNDARY.features.some(feature => inPolygon(lng, lat, feature.geometry.coordinates));
}
