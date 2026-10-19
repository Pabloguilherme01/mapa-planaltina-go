import { describe, expect, it, vi, afterEach } from 'vitest';
import { AssistantService } from '../server/gemini/assistantService.ts';
import { pointsRepository } from '../server/repository/PointsRepository.ts';
import { CNES_FALLBACK_POINTS } from '../server/data/cnesPlanaltinaFallback.ts';

afterEach(() => vi.restoreAllMocks());

describe('prompt do assistente com catálogo territorial misto', () => {
  it('não apresenta uma unidade CNES real como se todo o catálogo fosse DEMO', async () => {
    vi.spyOn(pointsRepository, 'getAllForCorpus').mockResolvedValue([CNES_FALLBACK_POINTS[0]]);
    const service = new AssistantService();
    vi.spyOn(service, 'isConfigured').mockReturnValue(true);
    const generateContent = vi.fn(async (_args: unknown) => ({
      text: JSON.stringify({
        evidenceIds: ['cnes-0112666'],
        foundInCorpus: true,
        reply: 'Texto do modelo não publicado como fato',
      }),
    }));
    (service as unknown as { ai: unknown }).ai = { models: { generateContent } };

    const answer = await service.answer({ message: 'Há uma unidade de Saúde real?' });
    const request = generateContent.mock.calls[0]?.[0] as {
      config: { systemInstruction: string };
    };
    expect(request).toBeDefined();
    expect(request.config.systemInstruction).toMatch(/pontos REAIS verificados e pontos DEMO/);
    expect(request.config.systemInstruction).not.toMatch(/catálogo demonstrativo cadastrado/i);
    expect(request.config.systemInstruction).not.toMatch(/APENAS ESTES EXISTEM/);
    expect(request.config.systemInstruction).toMatch(/não é uma relação completa/i);
    expect(answer.evidenceIds).toEqual(['cnes-0112666']);
    expect(answer.reply).toContain('REAL verificado');
    expect(answer.isDemoNotice).toBe('');
    expect(answer.reply).not.toContain('Texto do modelo não publicado como fato');
  });
});
