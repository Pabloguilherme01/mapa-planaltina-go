import { SCHOOL_REGISTRY } from '../data/schoolRegistry.ts';
import fuelData from '../data/fuelRegistry.json';
import { parseFuelRegistry, ANP_SOURCE_URL } from './fuelRegistry.ts';
import { COMMERCIAL_ANCHORS } from '../data/commercialResearch.ts';
import { normalizeText } from './text.ts';
import type { PointCategory } from '../types/index.ts';

export type DirectoryKind = 'school' | 'fuel' | 'commercial';
export interface DirectoryEntry {
  id: string;
  kind: DirectoryKind;
  name: string;
  address: string;
  district: string;
  category: PointCategory;
  reference: string;
  sourceUrl: string;
  locationStatus: 'unlocated';
}

const schools: DirectoryEntry[] = SCHOOL_REGISTRY.items.map(entry => ({
  id: `seduc-${entry.code}`,
  kind: 'school',
  name: entry.name,
  address: entry.address,
  district: entry.district,
  category: 'Educação',
  reference: `Cadastro SEDUC GO ${SCHOOL_REGISTRY.referenceYear} · Rede ${entry.network}`,
  sourceUrl: SCHOOL_REGISTRY.sourceUrl,
  locationStatus: 'unlocated',
}));

const stations: DirectoryEntry[] = parseFuelRegistry(fuelData).items.map(item => ({
  id: `anp-${item.id}`,
  kind: 'fuel',
  name: item.name,
  address: item.address,
  district: item.district,
  category: 'Comércio',
  reference: `Cadastro ANP · autorização ${item.authorization} · ${item.brand}`,
  sourceUrl: ANP_SOURCE_URL,
  locationStatus: 'unlocated',
}));

const commercial: DirectoryEntry[] = COMMERCIAL_ANCHORS.map(item => ({
  id: `commerce-${item.id}`,
  kind: 'commercial',
  name: item.name,
  address: item.address,
  district: '',
  category: 'Comércio',
  reference: item.evidenceStatus === 'verified_primary'
    ? 'Pesquisa comercial · página do estabelecimento'
    : 'Pesquisa comercial · listagem pública não oficial',
  sourceUrl: item.sourceUrl,
  locationStatus: 'unlocated',
}));

const ENTRIES: DirectoryEntry[] = [...schools, ...stations, ...commercial];
export function listDirectoryEntries(): DirectoryEntry[] {
  return ENTRIES.slice();
}
/** Fontes sem latitude/longitude nunca podem ser convertidas automaticamente em MapPoint. */
export function searchDirectoryEntries(query: string, categories: readonly PointCategory[] = []): DirectoryEntry[] {
  const text = normalizeText(query);
  const terms = text.split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return ENTRIES.filter(item => (!categories.length || categories.includes(item.category)) &&
    terms.every(term => normalizeText([item.name, item.address, item.district, item.reference].join(' ')).includes(term)));
}
