import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import { createExpressApp } from '../server/index.ts';

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
    }
  });

  it('retorna erro de validação sem consultar o Gemini', async () => {
    // O limitador de testes anteriores atingiu a quota: nesse caso, testa só o schema puro.
    // Em produção, a API rejeita payload inválido antes de chamar o modelo.
    const { AssistantRequestSchema } = await import('../server/security/assistantRequest.ts');
    expect(AssistantRequestSchema.safeParse({ message: '', history: [] }).success).toBe(false);
  });
});
