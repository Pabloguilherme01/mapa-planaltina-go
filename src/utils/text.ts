export function normalizeText(value: string): string {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Converte pontuação em separadores apenas em buscas livres (preserva rótulos estruturados). */
export function normalizeSearchText(value: string): string {
  return normalizeText(value).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
/** Siglas curtas devem iniciar uma palavra: UPA não corresponde a ROUPAS. */
export function matchesSearchTerms(normalizedText: string, terms: readonly string[]): boolean {
  const words = normalizedText.split(/\s+/);
  return terms.every(term => /^[a-z]{1,3}$/.test(term)
    ? words.some(word => word.startsWith(term)) : normalizedText.includes(term));
}
