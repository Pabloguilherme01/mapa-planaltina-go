import { describe, it, expect, vi } from 'vitest';
import { assistantService, AssistantService } from '../server/gemini/assistantService.ts';
import { IbgeAdapter } from '../server/adapters/IbgeAdapter.ts';
import { DEMO_DISCLAIMER_TEXT } from '../src/types/index.ts';

describe('Assistente Cívico & Corpus Restrito', () => {
  it('never displays invented model prose even with a valid evidence ID', async () => {
    vi.spyOn(IbgeAdapter.prototype, 'getMunicipalityData').mockResolvedValue({
      id: 5217609, nome: 'Planaltina', microrregiao: { mesorregiao: { UF: { nome: 'Goiás' } } },
    } as never);
    const service = new AssistantService();
    vi.spyOn(service, 'isConfigured').mockReturnValue(true);
    (service as unknown as { ai: unknown }).ai = { models: { generateContent: async () => ({
      text: JSON.stringify({ reply: 'Hospital Inexistente atende 24 horas na Rua Inventada.', evidenceIds: ['demo-saude-01'], foundInCorpus: true }),
    }) } };
    const result = await service.answer({ message: 'Quais pontos de saúde estão carregados?' });
    expect(result.reply).not.toMatch(/Hospital Inexistente|24 horas|Rua Inventada/);
    vi.restoreAllMocks();
  });
  it('deve responder com dados do corpus para serviços existentes', async () => {
    const res = await assistantService.answer({
      message: 'Existe posto de saúde ou UBS no catálogo?',
    });

    expect(res).toBeDefined();
    expect(res.reply).toBeTruthy();
    expect(res.isDemoNotice).toBe(DEMO_DISCLAIMER_TEXT);
    expect(res.foundInCorpus).toBe(true);
    expect(res.evidenceIds.length).toBeGreaterThan(0);
  }, 15000);

  it('deve recusar locais ou serviços inexistentes no corpus', async () => {
    const res = await assistantService.answer({
      message: 'Onde fica a estação espacial internacional ou o shopping center espacial?',
    });

    expect(res).toBeDefined();
    expect(res.foundInCorpus).toBe(false);
    expect(res.evidenceIds).toHaveLength(0);
    expect(res.reply).toMatch(/Não encontramos|não consta/i);
  }, 15000);

  it('todos os evidenceIds retornados devem existir no catálogo real', async () => {
    const res = await assistantService.answer({
      message: 'Quais escolas e praças temos?',
    });

    if (res.evidenceIds.length > 0) {
      expect(res.evidenceIds.every((id) => id.startsWith('demo-'))).toBe(true);
    }
  }, 15000);
});
