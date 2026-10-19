import { describe, expect, it } from 'vitest';
import { PointsQuerySchema } from '../server/security/pointQuery.ts';

describe('parâmetros públicos GET /api/points', () => {
  it('aceita filtros do frontend e paginação inteira limitada', () => {
    const parsed = PointsQuerySchema.parse({
      q: '  ubs ', categories: ['Saúde', 'Educação'],
      provenance: 'official', zone: 'Não classificada',
      limit: '50', offset: '0',
    });
    expect(parsed).toEqual({
      q: 'ubs', categories: ['Saúde', 'Educação'], provenance: ['official'],
      zone: 'Não classificada', limit: 50, offset: 0,
    });
  });

  it('adota uma janela máxima razoável quando a paginação não é solicitada', () => {
    const result = PointsQuerySchema.parse({});
    expect(result.limit).toBe(200);
    expect(result.offset).toBe(0);
  });

  it.each([
    ['limite negativo', { limit: '-1' }],
    ['limite acima do máximo', { limit: '201' }],
    ['limite não numérico', { limit: '15abc' }],
    ['limite fracionário', { limit: '2.5' }],
    ['deslocamento negativo', { offset: '-1' }],
    ['deslocamento excessivo', { offset: '10001' }],
    ['categoria desconhecida', { categories: 'Categoria inexistente' }],
    ['proveniência inexistente', { provenance: 'falsa' }],
    ['zona inválida', { zone: 'Central' }],
    ['muitos filtros', { categories: Array.from({ length: 11 }, () => 'Saúde') }],
    ['busca enorme', { q: 'x'.repeat(201) }],
  ])('rejeita %s', (_label, input) => {
    expect(PointsQuerySchema.safeParse(input).success).toBe(false);
  });
});
