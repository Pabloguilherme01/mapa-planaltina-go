import { DEMO_DISCLAIMER_TEXT, MapPoint, AssistantResponsePayload } from '../types/index.ts';

export function staticAssistant(message: string, points: MapPoint[]): AssistantResponsePayload {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const query = normalize(message);
  const selected = points.filter((point) => query.includes(normalize(point.category))
    || query.includes(normalize(point.name))
    || point.tags.some((tag) => normalize(tag).split(' ').some((word) => word.length > 3 && query.includes(word)))).slice(0, 5);
  const notice = selected.length && selected.every(point => point.isDemo)
    ? DEMO_DISCLAIMER_TEXT
    : 'Consulta local ao snapshot publicado. Confira fonte e data de cada registro. DEMO é ilustrativo; dado real não confirma atendimento, acesso ou horário atual.';
  return {
    reply: selected.length
      ? `Busca local nos dados carregados de Planaltina, Goiás:\n\n${selected.map((point) => `• ${point.name} (${point.category}) — ${point.isDemo ? 'DEMO' : 'REAL'}; fonte: ${point.provenanceMeta.sourceName}; snapshot: ${point.provenanceMeta.retrievedAt}`).join('\n')}\n\n${notice}`
      : 'Não consta nos dados carregados de Planaltina, Goiás.',
    evidenceIds: selected.map((point) => point.id),
    foundInCorpus: selected.length > 0,
    isDemoNotice: notice,
    modelUsed: 'Gemini indisponível no GitHub Pages — busca local no catálogo',
  };
}
