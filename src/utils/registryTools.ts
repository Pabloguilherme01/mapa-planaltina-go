import { SCHOOL_REGISTRY } from '../data/schoolRegistry';
import { normalizeText } from './text';

type School = typeof SCHOOL_REGISTRY.items[number];

export function filterSchools(items: School[], query: string, network = '', zone = ''): School[] {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  return items.filter(item => (!network || item.network === network) && (!zone || item.zone === zone) &&
    terms.every(term => normalizeText(`${item.code} ${item.name} ${item.address} ${item.district} ${item.network} ${item.zone}`).includes(term)));
}

/**
 * Divergência de regional é uma pendência de reconciliação, NÃO prova que
 * a escola seja de outro município; a fonte SEDUC já informa Planaltina.
 */
export function summarizeSchoolRegionals(items: School[]): {
  total: number;
  regionalReviewCount: number;
  reviewCodes: string[];
} {
  const reviewCodes = items
    .filter(item => item.regional.trim() !== 'CRE Planaltina')
    .map(item => item.code);
  return { total: items.length, regionalReviewCount: reviewCodes.length, reviewCodes };
}
