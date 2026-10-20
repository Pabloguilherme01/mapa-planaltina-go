import { describe, it, expect } from 'vitest';
import { filterCatalog } from '../src/utils/catalogFilters.ts';
import type { MapPoint } from '../src/types/index.ts';
const point = (id: string, name: string, category: MapPoint['category'], isVerified: boolean, lat = -15.4542): MapPoint => ({
  id, name, category, description: '', lat, lng: -47.6029, zone: 'Urbana', isDemo: false, demoDisclaimer: '',
  addressHint: 'Setor Norte', tags: ['Tipo: Mercado'],
  provenanceMeta: { provenance: isVerified ? 'official' : 'community', verificationStatus: isVerified ? 'verified' : 'unverified',
    sourceName: 'Base de teste', license: 'ODbL', retrievedAt: '2026-10-15T00:00:00Z', disclaimer: '' },
});
const items = [point('1','Mercado Central','Comércio',false), point('2','Posto de Saúde','Saúde',true,-15.456), point('3','Mercado Sul','Comércio',true,-15.48)];
describe('filtros territoriais avançados', () => {
  it('combina categorias, confiança, tipo e busca textual com acentos', () => {
    const result = filterCatalog(items, { categories: ['Saúde'], verification: 'verified', search: 'posto', origin: 'all', kind: '', zone: '' });
    expect(result.map(p=>p.id)).toEqual(['2']);
    expect(filterCatalog(items, { categories: [], search: 'mercado', verification: 'unverified', origin: 'community', kind: 'Mercado', zone: 'Urbana' }).map(p=>p.id)).toEqual(['1']);
  });
  it('ordena por distância e seleciona raio somente com consentimento GPS', () => {
    const origin = { lat: -15.4542, lng: -47.6029 };
    const near = filterCatalog(items, { radiusKm: 1, userLocation: origin, sort: 'nearest' });
    expect(near.map(x => x.id)).toEqual(['1','2']);
    expect(filterCatalog(items, { radiusKm: 1, userLocation: null })).toHaveLength(3);
  });
  it('busca por identificador e fonte, sem modificar a coleção original', () => {
    expect(filterCatalog(items, { search:'2' }).map(x=>x.id)).toEqual(['2']);
    expect(filterCatalog(items, { search:'base de teste', sort:'name' })).toHaveLength(3);
    expect(items.map(x=>x.id)).toEqual(['1','2','3']);
  });
});
