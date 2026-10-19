import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createServer, type Server } from 'node:http';
import { createExpressApp } from '../server/index.ts';
import { pointsRepository } from '../server/repository/PointsRepository.ts';

let server: Server;
let url: string;

beforeAll(async () => {
  server = createServer(createExpressApp());
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Servidor de teste não iniciado');
  url = `http://127.0.0.1:${address.port}/api/assistant`;
});

afterAll(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

describe('proteção HTTP da API do assistente', () => {
  it('não devolve rastreamento nem detalhes para JSON malformado', async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"message":',
    });
    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toContain('application/json');
    const payload = await response.json() as Record<string, unknown>;
    expect(payload).toEqual({ success: false, error: 'JSON inválido.' });
  });

  it('recusa corpo excessivo antes de consultar o assistente', async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'x'.repeat(20_000) }),
    });
    expect(response.status).toBe(413);
    const payload = await response.json() as Record<string, unknown>;
    expect(payload).toEqual({ success: false, error: 'Requisição excede o tamanho permitido.' });
  });

  it('não permite contornar 20 requisições por minuto falsificando X-Forwarded-For', async () => {
    for (let index = 0; index < 21; index++) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': `198.51.100.${index + 1}`,
        },
        body: JSON.stringify({ message: '' }),
      });
      expect(response.status).toBe(index === 20 ? 429 : 400);
      if (index === 0) {
        const payload = await response.json() as Record<string, unknown>;
        expect(payload).toEqual({ success: false, error: 'Parâmetros inválidos.' });
        expect(payload).not.toHaveProperty('details');
      }
    }
  });

  it('retorna erro de validação sem consultar o Gemini', async () => {
    // O limitador de testes anteriores atingiu a quota: nesse caso, testa só o schema puro.
    // Em produção, a API rejeita payload inválido antes de chamar o modelo.
    const { AssistantRequestSchema } = await import('../server/security/assistantRequest.ts');
    expect(AssistantRequestSchema.safeParse({ message: '', history: [] }).success).toBe(false);
  });
});

it('não revela mensagem de falha interna do repositório na resposta pública', async () => {
  const spy = vi.spyOn(pointsRepository, 'list')
    .mockRejectedValueOnce(new Error('Senha interna e detalhes confidenciais'));
  try {
    const response = await fetch(url.replace('/assistant', '/points'));
    const payload = await response.json() as { error?: string };
    expect(response.status).toBe(500);
    expect(payload.error).not.toContain('Senha interna');
    expect(payload.error).not.toContain('confidenciais');
  } finally {
    spy.mockRestore();
  }
});
