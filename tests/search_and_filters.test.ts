import { describe, it, expect } from 'vitest';
import {
  pointsRepository,
  normalizeText,
} from '../server/repository/PointsRepository.ts';
import { CATEGORIES_LIST, PointCategory } from '../src/types/index.ts';

describe('Busca Sem Acentos & Filtros das 9 Categorias', () => {
  it('deve normalizar textos removendo acentos e maiúsculas', () => {
    expect(normalizeText('Saúde')).toBe('saude');
    expect(normalizeText('Educação')).toBe('educacao');
    expect(normalizeText('Praça')).toBe('praca');
    expect(normalizeText('Área Demonstrativa')).toBe('area demonstrativa');
    expect(normalizeText('PLANALTINA, GOIÁS')).toBe('planaltina, goias');
  });

  it('deve encontrar pontos de saúde buscando sem acentos ("saude")', async () => {
    const results = await pointsRepository.search('saude');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => normalizeText(p.name + p.description + p.category).includes('saude'))).toBe(true);
  });

  it('deve encontrar escolas buscando sem acentos ("educacao")', async () => {
    const results = await pointsRepository.search('educacao');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((p) => p.category === 'Educação')).toBe(true);
  });

  it('deve filtrar corretamente por cada uma das 9 categorias cívicas', async () => {
    expect(CATEGORIES_LIST).toHaveLength(9);

    for (const cat of CATEGORIES_LIST) {
      const list = await pointsRepository.list({ categories: [cat] });
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((p) => p.category === cat)).toBe(true);
    }
  });

  it('deve permitir filtro composto com múltiplas categorias', async () => {
    const categories: PointCategory[] = ['Saúde', 'Educação'];
    const results = await pointsRepository.list({ categories });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => categories.includes(p.category))).toBe(true);
  });

  it('deve retornar lista vazia para termos que não existem no catálogo', async () => {
    const results = await pointsRepository.search('palavra_inexistente_xyz_123');
    expect(results).toHaveLength(0);
  });
});
