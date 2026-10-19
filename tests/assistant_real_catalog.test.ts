import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssistantService } from '../server/gemini/assistantService.ts';
import { pointsRepository } from '../server/repository/PointsRepository.ts';
import { CNES_FALLBACK_POINTS } from '../server/data/cnesPlanaltinaFallback.ts';

afterEach(() => vi.restoreAllMocks());

describe('assistente ao consumir catálogo real validado', () => {
  it('não classifica todos os estabelecimentos reais como demonstrativos', async () => {
    vi.spyOn(pointsRepository, 'getAllForCorpus').mockResolvedValue([CNES_FALLBACK_POINTS[0]]);
    const service = new AssistantService();
    (service as unknown as { ai: unknown }).ai = null;
    const result = await service.answer({ message: 'Existe Saúde no catálogo?' });
    expect(result.foundInCorpus).toBe(true);
    expect(result.evidenceIds).toEqual(['cnes-0112666']);
    expect(result.reply).toContain('REAL');
    expect(result.reply).not.toMatch(/pontos demonstrativos|catálogo ilustrativo/i);
    expect(result.isDemoNotice).toBe('');
  });
});
