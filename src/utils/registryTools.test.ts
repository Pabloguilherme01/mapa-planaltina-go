import { describe, expect, it } from 'vitest';
import { filterSchools } from './registryTools';
import { SCHOOL_REGISTRY } from '../data/schoolRegistry';

describe('consulta escolar', () => {
  it('combina palavras sem acentos, rede e zona', () => {
    const result = filterSchools(SCHOOL_REGISTRY.items, 'mario andrade', 'Estadual', 'Urbana');
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('52050807');
    expect(filterSchools(SCHOOL_REGISTRY.items, 'mario andrade', 'Privada', 'Urbana')).toHaveLength(0);
  });
});
