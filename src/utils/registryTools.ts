import { SCHOOL_REGISTRY } from '../data/schoolRegistry';
import { normalizeText } from './text';

type School = typeof SCHOOL_REGISTRY.items[number];

export function filterSchools(items: School[], query: string, network = '', zone = ''): School[] {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  return items.filter(item => (!network || item.network === network) && (!zone || item.zone === zone) &&
    terms.every(term => normalizeText(`${item.code} ${item.name} ${item.address} ${item.district} ${item.network} ${item.zone}`).includes(term)));
}
