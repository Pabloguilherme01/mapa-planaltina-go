import { describe, expect, it } from 'vitest';
import { createAssistantRateLimiter } from '../server/security/assistantRateLimiter.ts';
import { AssistantRequestSchema } from '../server/security/assistantRequest.ts';

describe('limites do assistente antes da habilitação da API', () => {
  it('limita requisições por endereço no intervalo e libera após vencimento', () => {
    let now = 0;
    const allow = createAssistantRateLimiter({ maxRequests: 2, windowMs: 60_000, maxClients: 10 }, () => now);
    expect(allow('127.0.0.1')).toBe(true);
    expect(allow('127.0.0.1')).toBe(true);
    expect(allow('127.0.0.1')).toBe(false);
    now = 60_001;
    expect(allow('127.0.0.1')).toBe(true);
  });

  it('recusa novos clientes quando capacidade chega ao limite e mantém os existentes', () => {
    let now = 0;
    const allow = createAssistantRateLimiter({ maxRequests: 2, windowMs: 60_000, maxClients: 1 }, () => now);
    expect(allow('client-a')).toBe(true);
    expect(allow('client-b')).toBe(false);
    expect(allow('client-a')).toBe(true);
    expect(allow('client-a')).toBe(false);
    now = 60_001;
    expect(allow('client-b')).toBe(true);
  });

  it('não admite chaves vazias ou valores inválidos', () => {
    const allow = createAssistantRateLimiter({ maxRequests: 2, windowMs: 60_000, maxClients: 10 });
    expect(allow('')).toBe(false);
    expect(allow('   ')).toBe(false);
  });

  it('valida texto e histórico com limites de quantidade e tamanho', () => {
    expect(AssistantRequestSchema.safeParse({ message: 'Onde há UBS?', history: [] }).success).toBe(true);
    expect(AssistantRequestSchema.safeParse({ message: '   ' }).success).toBe(false);
    expect(AssistantRequestSchema.safeParse({ message: 'x'.repeat(501) }).success).toBe(false);
    expect(AssistantRequestSchema.safeParse({ message: 'Consulta', history: Array.from({ length: 11 }, () => ({ role: 'user', content: 'texto' })) }).success).toBe(false);
    expect(AssistantRequestSchema.safeParse({ message: 'Consulta', history: [{ role: 'user', content: 'x'.repeat(1001) }] }).success).toBe(false);
  });
});
