import type { PointCategory } from '../types/index.ts';
import { listDirectoryEntries, searchDirectoryEntries, type DirectoryKind } from './unlocatedRegistry.ts';
import { OFFICIAL_SERVICES, searchOfficialServices } from '../data/officialServices.ts';

export type CatalogResource =
  | { id: string; type: 'directory'; kind: DirectoryKind; name: string;
      address: string; district: string; reference: string; sourceUrl: string; category: PointCategory }
  | { id: string; type: 'digital'; name: string; description: string;
      reference: string; sourceUrl: string; category: PointCategory };

const digital = OFFICIAL_SERVICES.map(service => ({
  id: `official-${service.id}`, type: 'digital' as const,
  name: service.label, description: service.description,
  category: (service.group === 'Empresas' ? 'Comércio' : 'Serviços Públicos') as PointCategory,
  reference: service.source, sourceUrl: service.url,
}));
const documented = listDirectoryEntries().map(entry => ({ ...entry, type: 'directory' as const }));

export function browseCatalogResources(categories: readonly PointCategory[] = []): CatalogResource[] {
  const all: CatalogResource[] = [...documented, ...digital];
  return categories.length ? all.filter(entry => categories.includes(entry.category)) : all;
}
export function findCatalogResources(query: string, categories: readonly PointCategory[] = []): CatalogResource[] {
  if (!query.trim()) return [];
  const categoryMatches = browseCatalogResources(categories);
  const validIds = new Set(categoryMatches.map(item => item.id));
  const entries = searchDirectoryEntries(query, categories).map(entry => ({ ...entry, type: 'directory' as const }));
  const official = searchOfficialServices(query).map(entry => ({
    id: `official-${entry.id}`, type: 'digital' as const, name: entry.label,
    description: entry.description, reference: entry.source, sourceUrl: entry.url,
    category: (entry.group === 'Empresas' ? 'Comércio' : 'Serviços Públicos') as PointCategory,
  }));
  return [...entries, ...official].filter(item => validIds.has(item.id));
}
