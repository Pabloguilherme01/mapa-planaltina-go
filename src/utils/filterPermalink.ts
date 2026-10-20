import { CATEGORIES_LIST, type PointCategory, type ProvenanceType } from '../types/index.ts';
import type { CatalogFilters } from './catalogFilters.ts';

export type SharedMapFilters = Pick<CatalogFilters, 'search' | 'categories' | 'origin' | 'verification' | 'kind' | 'zone' | 'sort'>;
const PARAMS = ['q','cat','origin','verified','type','zone','order'] as const;
function safeText(value: string | null, max = 100): string {
  return value && value.length <= max && !/[<>\u0000-\u001f]/.test(value) ? value.trim() : '';
}
/** Não serializar o GPS nem o raio: a URL pode ser compartilhada publicamente. */
export function decodeMapFilters(input: URLSearchParams): Required<SharedMapFilters> & { radiusKm: 0 } {
  const search = safeText(input.get('q'), 120);
  const categories = (input.get('cat') ?? '').split(',').filter(
    (v): v is PointCategory => CATEGORIES_LIST.includes(v as PointCategory)
  );
  const origin = input.get('origin');
  const validOrigins = ['official','verified_open_data','community','demo'];
  const verified = input.get('verified');
  const sort = input.get('order');
  return {
    search, categories: [...new Set(categories)],
    origin: validOrigins.includes(origin ?? '') ? origin as ProvenanceType : 'all',
    verification: verified === 'verified' || verified === 'unverified' ? verified : 'all',
    kind: safeText(input.get('type')), zone: safeText(input.get('zone')),
    sort: sort === 'name' ? 'name' : 'default',
    radiusKm: 0,
  };
}
export function encodeMapFilters(value: Partial<CatalogFilters> = {}, existing = new URLSearchParams()): URLSearchParams {
  const url = new URLSearchParams(existing);
  PARAMS.forEach(key => url.delete(key));
  if (value.search?.trim()) url.set('q',value.search.trim().slice(0,120));
  if (value.categories?.length) {
    const filtered=[...new Set(value.categories)].filter(v=>CATEGORIES_LIST.includes(v));
    if (filtered.length) url.set('cat',filtered.join(','));
  }
  if (value.origin && value.origin !== 'all') url.set('origin',value.origin);
  if (value.verification && value.verification !== 'all') url.set('verified',value.verification);
  if (value.kind) url.set('type',value.kind.slice(0,100));
  if (value.zone) url.set('zone',value.zone.slice(0,100));
  if (value.sort === 'name') url.set('order','name');
  return url;
}
export function countActiveFilters(value: SharedMapFilters): number {
  return Number(Boolean(value.search?.trim())) + Number(Boolean(value.categories?.length)) +
    Number(Boolean(value.origin && value.origin !== 'all')) +
    Number(Boolean(value.verification && value.verification !== 'all')) +
    Number(Boolean(value.kind)) + Number(Boolean(value.zone)) +
    Number(Boolean(value.sort && value.sort !== 'default'));
}
