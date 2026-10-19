import { describe, expect, it, afterEach } from 'vitest';
import { createServer, type Server } from 'node:http';
import { createExpressApp } from '../server/index.ts';

const OLD_ALLOWED = process.env.API_ALLOWED_ORIGIN;
afterEach(() => {
  if (OLD_ALLOWED === undefined) delete process.env.API_ALLOWED_ORIGIN;
  else process.env.API_ALLOWED_ORIGIN = OLD_ALLOWED;
});

async function withApi(allowed: string | undefined, callback: (url: string) => Promise<void>) {
  if (allowed === undefined) delete process.env.API_ALLOWED_ORIGIN;
  else process.env.API_ALLOWED_ORIGIN = allowed;
  const server: Server = createServer(createExpressApp());
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw Error('Endereço HTTP indisponível');
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
  }
}

describe('CORS restrito da API opcional', () => {
  it('permite exatamente a origem HTTPS explicitamente configurada', async () => {
    await withApi('https://pabloguilherme01.github.io', async url => {
      const res = await fetch(url + '/api/health', {
        headers: { Origin: 'https://pabloguilherme01.github.io' },
      });
      expect(res.status).toBe(200);
      expect(res.headers.get('access-control-allow-origin')).toBe('https://pabloguilherme01.github.io');
      expect(res.headers.get('vary')).toContain('Origin');
      expect(res.headers.get('access-control-allow-credentials')).toBeNull();
    });
  });

  it('não autoriza origem externa e recusa seu preflight', async () => {
    await withApi('https://pabloguilherme01.github.io', async url => {
      const res = await fetch(url + '/api/health', {
        headers: { Origin: 'https://example.org' },
      });
      expect(res.status).toBe(200);
      expect(res.headers.get('access-control-allow-origin')).toBeNull();
      const preflight = await fetch(url + '/api/assistant', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://example.org',
          'Access-Control-Request-Method': 'POST',
        },
      });
      expect(preflight.status).toBe(403);
      expect(preflight.headers.get('access-control-allow-origin')).toBeNull();
    });
  });

  it('aceita preflight POST do Pages, sem credenciais', async () => {
    await withApi('https://pabloguilherme01.github.io', async url => {
      const response = await fetch(url + '/api/assistant', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://pabloguilherme01.github.io',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type',
        },
      });
      expect(response.status).toBe(204);
      expect(response.headers.get('access-control-allow-methods')).toContain('POST');
      expect(response.headers.get('access-control-allow-headers')).toBe('Content-Type');
    });
  });

  it('não expõe API a navegadores de outras origens por padrão', async () => {
    await withApi(undefined, async url => {
      const response = await fetch(url + '/api/health', {
        headers: { Origin: 'https://pabloguilherme01.github.io' },
      });
      expect(response.headers.get('access-control-allow-origin')).toBeNull();
    });
  });

  it.each(['http://example.org', 'https://example.org/path', '*', 'https://*.example.org'])(
    'recusa configuração CORS insegura %s', configured => {
      process.env.API_ALLOWED_ORIGIN = configured;
      expect(() => createExpressApp()).toThrow(/API_ALLOWED_ORIGIN/);
    }
  );
});
