import { describe, expect, it } from 'vitest';
import { SCHOOL_REGISTRY } from '../src/data/schoolRegistry.ts';
import { summarizeSchoolRegionals } from '../src/utils/registryTools.ts';

describe('transparência da regional do cadastro SEDUC', () => {
  it('aponta divergência cadastral de regional sem excluir registros do município', () => {
    const result = summarizeSchoolRegionals(SCHOOL_REGISTRY.items);
    expect(result.total).toBe(63);
    expect(result.regionalReviewCount).toBe(26);
    expect(result.reviewCodes).toContain('52074072');
    expect(result.reviewCodes).not.toContain('52050793');
    expect(SCHOOL_REGISTRY.geometry).toBe('not_provided');
  });

  it('não interpreta CRE diferente como município distinto ou coordenada verificada', () => {
    const school = SCHOOL_REGISTRY.items.find(x => x.code === '52074072');
    expect(school?.municipality).toBe('Planaltina');
    expect(school?.regional).toBe('CRE Goiânia');
    expect(SCHOOL_REGISTRY.geometry).toBe('not_provided');
  });

  it('admite a lista vazia sem afirmar geometrias', () => {
    expect(summarizeSchoolRegionals([])).toEqual({
      total: 0, regionalReviewCount: 0, reviewCodes: [],
    });
  });
});
