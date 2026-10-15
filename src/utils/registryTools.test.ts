import { describe, expect, it } from 'vitest';
import { filterSchools, schoolCsv } from './registryTools';
import { SCHOOL_REGISTRY } from '../data/schoolRegistry';

describe('consulta e exportação escolar', () => {
  it('combina palavras sem acentos, rede e zona', () => {
    const result = filterSchools(SCHOOL_REGISTRY.items, 'mario andrade', 'Estadual', 'Urbana');
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('52050807');
    expect(filterSchools(SCHOOL_REGISTRY.items, 'mario andrade', 'Privada', 'Urbana')).toHaveLength(0);
  });
  it('mantém referência e fonte em cada linha exportada', () => {
    const csv = schoolCsv(SCHOOL_REGISTRY.items.slice(0, 1));
    expect(csv).toContain('2024');
    expect(csv).toContain(SCHOOL_REGISTRY.sourceUrl);
    expect(csv).not.toMatch(/telefone|email/i);
  });
  it('protege planilhas de fórmulas e escapa campos CSV', () => {
    const item = { ...SCHOOL_REGISTRY.items[0], name: '=1+1', address: 'Rua "A"; 2\nCentro' };
    const csv = schoolCsv([item]);
    expect(csv).toContain('"\'=1+1"');
    expect(csv).toContain('"Rua ""A""; 2\nCentro"');
  });
});
