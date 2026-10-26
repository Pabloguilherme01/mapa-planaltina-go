import type { MapPoint, PointCategory, ProvenanceType, VerificationStatus } from '../types/index.ts';
import { normalizeSearchText } from './text.ts';
export type MapCoordinates = { lat: number; lng: number };
export type CatalogSort = 'default' | 'name' | 'nearest';
export type VerificationFilter = 'all' | 'verified' | 'unverified';
export interface CatalogFilters {
  categories?: PointCategory[];
  origin?: ProvenanceType | 'all';
  verification?: VerificationFilter;
  kind?: string;
  zone?: string;
  search?: string;
  sort?: CatalogSort;
  radiusKm?: number;
  userLocation?: MapCoordinates | null;
}
export function distanceMeters(a: MapCoordinates, b: MapCoordinates): number {
  const rad = Math.PI / 180;
  const dy = (b.lat - a.lat) * rad;
  const dx = (b.lng - a.lng) * rad;
  const h = Math.sin(dy / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dx / 2) ** 2;
  return 12_742_000 * Math.asin(Math.min(1, Math.sqrt(h)));
}
export function filterCatalog(points: readonly MapPoint[], filters: CatalogFilters = {}): MapPoint[] {
  const terms = normalizeSearchText(filters.search || '').split(/\s+/).filter(Boolean);
  const origin = filters.userLocation && Number.isFinite(filters.userLocation.lat) && Number.isFinite(filters.userLocation.lng)
    ? filters.userLocation : null;
  const withinRadius = origin && filters.radiusKm && Number.isFinite(filters.radiusKm) && filters.radiusKm > 0
    ? filters.radiusKm * 1000 : null;
  const filtered = points.filter(point => {
    if (filters.categories?.length && !filters.categories.includes(point.category)) return false;
    if (filters.origin && filters.origin !== 'all' && point.provenanceMeta.provenance !== filters.origin) return false;
    if (filters.verification === 'verified' && point.provenanceMeta.verificationStatus !== 'verified') return false;
    if (filters.verification === 'unverified' &&
      !['unverified','pending'].includes(point.provenanceMeta.verificationStatus)) return false;
    if (filters.kind && !point.tags.includes(`Tipo: ${filters.kind}`)) return false;
    if (filters.zone && filters.zone !== point.zone) return false;
    if (withinRadius !== null && distanceMeters(origin!, point) > withinRadius) return false;
    if (!terms.length) return true;
    const haystack = normalizeSearchText([point.id, point.name, point.category, point.description,
      point.addressHint || '', point.zone, point.provenanceMeta.sourceName, ...point.tags].join(' '));
    return terms.every(term => haystack.includes(term));
  });
  if (filters.sort === 'name') return filtered.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  if (filters.sort === 'nearest' && origin) {
    return filtered.sort((a,b)=>distanceMeters(origin,a)-distanceMeters(origin,b)||a.name.localeCompare(b.name,'pt-BR'));
  }
  return filtered;
}
