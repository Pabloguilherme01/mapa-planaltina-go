export interface AssistantRateLimitOptions {
  maxRequests: number;
  windowMs: number;
  maxClients: number;
}

/**
 * Limitador em memória para o servidor único opcional.
 * Quando a capacidade é atingida, novos clientes são recusados (fail closed).
 * Para múltiplas instâncias, trocar por limitador compartilhado na implantação.
 */
export function createAssistantRateLimiter(
  { maxRequests, windowMs, maxClients }: AssistantRateLimitOptions,
  now: () => number = Date.now
): (address: string) => boolean {
  if (![maxRequests, windowMs, maxClients].every(Number.isSafeInteger) ||
      maxRequests < 1 || windowMs < 1 || maxClients < 1) {
    throw new Error('Configuração inválida do limitador do assistente.');
  }
  const entries = new Map<string, { count: number; expiresAt: number }>();

  return (address: string) => {
    if (!address || !address.trim()) return false;
    const timestamp = now();
    const current = entries.get(address);
    if (current && timestamp < current.expiresAt) {
      if (current.count >= maxRequests) return false;
      current.count++;
      return true;
    }
    if (!current && entries.size >= maxClients) {
      for (const [key, entry] of entries) {
        if (timestamp >= entry.expiresAt) entries.delete(key);
      }
      if (entries.size >= maxClients) return false;
    }
    entries.set(address, { count: 1, expiresAt: timestamp + windowMs });
    return true;
  };
}
