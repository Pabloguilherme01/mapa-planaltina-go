import { describe, expect, it } from 'vitest';
import { censusPoints, CNEFE_SOURCE, isCensusPoint } from '../src/utils/censusCatalog.ts';
import { findDestinations, susStatus, visibleDestinations } from '../src/utils/destinationSearch.ts';
import { filterCatalog } from '../src/utils/catalogFilters.ts';
import snapshot from '../data/cnefe-2022-planaltina.json';

const sample = { municipality: '5217609', year: 2022, retrievedAt: '2026-11-01T12:00:00.000Z',
  rows: [['cnefe-2022-123-abcdef012345', 'Escola de exemplo', '4', -15.4542, -47.6029, 'Rua de exemplo, 1', 'BAIRRO EXEMPLO']] };
describe('estabelecimentos históricos CNEFE', () => {
  it('mantém referência histórica, procedência oficial e confirmação pendente', () => {
    const [point] = censusPoints(sample);
    expect(point.provenanceMeta).toMatchObject({ provenance: 'official', verificationStatus: 'pending', sourceUrl: CNEFE_SOURCE });
    expect(point.description).toContain('Censo 2022');
    expect(findDestinations([point], 'Escola', false)).toEqual([point]);
    expect(filterCatalog([point], { search: 'bairro exemplo' })).toEqual([point]);
    expect(filterCatalog([point], { verification: 'verified' })).toEqual([]);
    expect(susStatus(point)).toBe('unknown');
    expect(isCensusPoint({ ...point, provenanceMeta: { ...point.provenanceMeta, sourceUrl: 'https://example.com' } })).toBe(false);
  });
  it('rejeita domicílios, construção, geometrias ausentes e identidades duplicadas', () => {
    for (const species of ['1', '2', '7']) expect(() => censusPoints({ ...sample, rows: [[...sample.rows[0].slice(0, 2), species, ...sample.rows[0].slice(3)]] })).toThrow();
    expect(() => censusPoints({ ...sample, rows: [...sample.rows, ...sample.rows] })).toThrow();
    expect(() => censusPoints({ ...sample, rows: [[...sample.rows[0].slice(0, 3), 0, 0, '', '']] })).toThrow();
    expect(censusPoints({ ...sample, rows: [[...sample.rows[0].slice(0, 3), -23.55, -46.63, '', '']] })).toEqual([]);
  });
  it('valida o snapshot municipal completo com IDs únicos e sem afirmar atendimento atual', () => {
    const points = censusPoints(snapshot);
    expect(points.length).toBeGreaterThan(4000);
    expect(new Set(points.map(point => point.id)).size).toBe(points.length);
    expect(points.every(point => isCensusPoint(point))).toBe(true);
    expect(new Set(points.map(point => point.category))).toEqual(new Set(['Rural', 'Educação', 'Saúde', 'Comércio', 'Lazer']));
  });
  it('não normaliza tags de todos os locais quando a busca está vazia', () => {
    const [source] = censusPoints(sample);
    const point = {
      ...source,
      tags: new Proxy(source.tags, {
        get(target, property, receiver) {
          if (property === 'join') throw new Error('Tags não devem ser concatenadas sem termos');
          return Reflect.get(target, property, receiver);
        },
      }),
    };
    expect(findDestinations([point], '', false)).toEqual([point]);
    expect(findDestinations([point], '    ', false)).toEqual([point]);
  });

  it('limita opções no planejador e preserva destino escolhido fora da primeira página', () => {
    const points = censusPoints(snapshot);
    const selected = points.at(-1)!;
    const visible = visibleDestinations(points, selected.id);
    expect(visible).toHaveLength(101);
    expect(visible).toContain(selected);
    expect(visibleDestinations(points, points[0].id)).toHaveLength(100);
    expect(visibleDestinations([], selected.id)).toEqual([]);
  });
});
