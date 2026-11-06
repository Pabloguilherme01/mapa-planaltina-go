import type { MapPoint } from '../types';
import { isCensusPoint } from './censusCatalog.ts';
import { normalizeText, normalizeSearchText, matchesSearchTerms } from './text';

export function susStatus(point: MapPoint): 'yes' | 'no' | 'unknown' {
  if (point.isDemo || point.category !== 'Saúde' || !point.id.startsWith('cnes-') ||
      point.provenanceMeta.provenance !== 'official' || point.provenanceMeta.verificationStatus !== 'verified') return 'unknown';
  const values = point.tags.map(normalizeText);
  const yes = values.includes('vinculo sus: sim');
  const no = values.includes('vinculo sus: nao');
  return yes === no ? 'unknown' : yes ? 'yes' : 'no';
}

export function findDestinations(points: MapPoint[], query: string, susOnly: boolean): MapPoint[] {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  return points.filter(point => {
    if (point.isDemo || !(point.provenanceMeta.verificationStatus === 'verified' || isCensusPoint(point) ||
      (point.provenanceMeta.provenance === 'community' &&
       point.provenanceMeta.verificationStatus === 'unverified' &&
       /^osm-(node|way|relation)-[1-9]\d*$/.test(point.id))) || !/\p{L}/u.test(point.name) ||
        !Number.isFinite(point.lat) || !Number.isFinite(point.lng) || Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180 ||
        (point.lat === 0 && point.lng === 0) || (susOnly && susStatus(point) !== 'yes')) return false;
    const text = normalizeSearchText(`${point.name} ${point.addressHint ?? ''} ${point.id} ${point.tags.join(' ')}`);
    return matchesSearchTerms(text, terms);
  }).sort((a, b) => Number(b.provenanceMeta.verificationStatus === 'verified') - Number(a.provenanceMeta.verificationStatus === 'verified') ||
    a.name.localeCompare(b.name, 'pt-BR') || a.id.localeCompare(b.id));
}

/** Mantém a escolha visível sem montar milhares de opções no celular. */
export function visibleDestinations(points: readonly MapPoint[], selectedId: string, limit = 100): MapPoint[] {
  const visible = points.slice(0, limit);
  const selected = points.find(point => point.id === selectedId);
  if (selected && !visible.some(point => point.id === selectedId)) visible.push(selected);
  return visible;
}
