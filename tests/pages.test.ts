import { describe, it, expect } from 'vitest';
import { pageRoute, sitePath } from '../src/utils/routing.ts';
import { staticAssistant } from '../src/services/staticAssistant.ts';
import { pointsRepository } from '../server/repository/PointsRepository.ts';

describe('Publicação GitHub Pages', () => {
  it('resolve /fontes dentro do prefixo do repositório', () => {
    expect(pageRoute('/mapa-planaltina-go/fontes/')).toBe('/fontes');
    expect(sitePath('/fontes', '/mapa-planaltina-go/')).toBe('/mapa-planaltina-go/fontes/');
    expect(sitePath('/', '/mapa-planaltina-go/')).toBe('/mapa-planaltina-go/');
  });
  it('não apresenta pesquisa local como uma chamada Gemini', async () => {
    const result = staticAssistant('saude', await pointsRepository.list());
    expect(result.foundInCorpus).toBe(true);
    expect(result.modelUsed).toContain('Gemini indisponível');
    expect(result.evidenceIds).toHaveLength(3);
  });
  it('recusa local inexistente sem depender de servidor', async () => {
    const result = staticAssistant('estação espacial XYZ', await pointsRepository.list());
    expect(result.foundInCorpus).toBe(false);
    expect(result.evidenceIds).toHaveLength(0);
    expect(result.reply).toContain('Não consta nos dados carregados');
  });
});
