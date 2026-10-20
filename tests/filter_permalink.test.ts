import { describe, expect, it } from 'vitest';
import { decodeMapFilters, encodeMapFilters, countActiveFilters } from '../src/utils/filterPermalink.ts';

describe('Filtros premium compartilháveis', () => {
  it('guarda busca, categorias, procedência, qualidade, tipo, zona e ordenação em links seguros', () => {
    const params = encodeMapFilters({ search: 'escolas em Planaltina', categories: ['Educação','Comércio'],
      origin: 'community', verification: 'unverified', kind: 'Escola', zone: 'Urbana', sort: 'name' });
    const read = decodeMapFilters(params);
    expect(read).toMatchObject({ search: 'escolas em Planaltina', categories: ['Educação','Comércio'],
      origin: 'community', verification: 'unverified', kind: 'Escola', zone: 'Urbana', sort: 'name' });
    expect(params.toString()).not.toContain('undefined');
    expect(countActiveFilters(read)).toBe(7);
  });
  it('descarta valores desconhecidos, parâmetros gigantes e raio sem permissão do GPS', () => {
    const read = decodeMapFilters(new URLSearchParams('categories=__unknown__&origin=private&sort=nearest&radius=10&query='+('x'.repeat(300))));
    expect(read).toMatchObject({ categories: [], origin:'all', sort:'default', radiusKm:0, search:'' });
    const params=encodeMapFilters({ radiusKm:5, sort:'nearest', userLocation:{lat:-15.45,lng:-47.6} });
    expect(params.has('radius')).toBe(false);
    expect(params.has('lat')).toBe(false);
    expect(params.has('lng')).toBe(false);
  });
  it('preserva os parâmetros da rota externa e limpa apenas os seus filtros', () => {
    const encoded=encodeMapFilters({ search:'hospital', verification:'verified' },new URLSearchParams('utm_source=link&foo=bar'));
    expect(encoded.get('utm_source')).toBe('link');
    expect(decodeMapFilters(encoded).verification).toBe('verified');
    expect(encodeMapFilters({},encoded).get('q')).toBeNull();
    expect(encodeMapFilters({},encoded).get('utm_source')).toBe('link');
  });
});
