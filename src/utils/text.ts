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
