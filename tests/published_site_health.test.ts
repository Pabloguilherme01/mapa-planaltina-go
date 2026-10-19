import { describe, expect, it, vi } from 'vitest';
import { verifyPublishedCompanionResources } from '../scripts/published-site-health.ts';

const base = 'https://pabloguilherme01.github.io/mapa-planaltina-go/';
const pointsUrl = base + 'data/points.json';
const paths = ['fontes/', 'data/sources.json', 'manifest.webmanifest', 'sw.js'];
const goodResponses: Record<string, string> = {
  'fontes/': '<!doctype html><html><head><title>Mapa Planaltina GO</title></head><body>Fontes</body></html>',
  'data/sources.json': JSON.stringify({
    success: true,
    data: [{ id: 'cnes', verified: true }],
    meta: { municipalCode: '5217609', totalSources: 1 },
  }),
  'manifest.webmanifest': JSON.stringify({
    start_url: '/mapa-planaltina-go/',
    scope: '/mapa-planaltina-go/',
    display: 'standalone',
    name: 'Mapa Planaltina GO',
  }),
  'sw.js': "const PRECACHE_URLS = ['/mapa-planaltina-go/data/points.json'];",
};
function fetcher(overrides: Record<string, Response> = {}) {
  return vi.fn(async (input: string | URL | Request) => {
    const full = typeof input === 'string' ? input : input.toString();
    const path = full.slice(base.length);
    return overrides[path] ?? new Response(goodResponses[path] ?? '', { status: 200 });
  });
}

describe('vigia independente da superfície publicada', () => {
  it('verifica fontes, PWA e service worker no mesmo domínio dos pontos', async () => {
    const fetchMock = fetcher();
    const result = await verifyPublishedCompanionResources(pointsUrl, fetchMock);
    expect(result.checked).toEqual(paths);
    expect(fetchMock.mock.calls).toHaveLength(4);
    for (const [url] of fetchMock.mock.calls) {
      expect(String(url).startsWith(base)).toBe(true);
    }
  });

  it('recusa redirecionamento para origem desconhecida ou endpoint sem HTTPS', async () => {
    await expect(verifyPublishedCompanionResources('http://example.org/data/points.json', fetcher()))
      .rejects.toThrow(/HTTPS/);
    await expect(verifyPublishedCompanionResources(base + 'outro.json', fetcher()))
      .rejects.toThrow(/points.json/);
  });

  it('falha quando a página de fontes retorna erro HTTP', async () => {
    const mock = fetcher({ 'fontes/': new Response('Not Found', { status: 404 }) });
    await expect(verifyPublishedCompanionResources(pointsUrl, mock)).rejects.toThrow(/fontes/);
  });

  it('falha quando fontes retorna HTML 200 em vez de JSON oficial', async () => {
    const mock = fetcher({ 'data/sources.json': new Response('<html>fallback</html>') });
    await expect(verifyPublishedCompanionResources(pointsUrl, mock)).rejects.toThrow(/sources.json/);
  });

  it('falha quando a fonte é de outro município ou não corresponde à contagem', async () => {
    const wrong = {
      success: true, data: [],
      meta: { municipalCode: '5300108', totalSources: 1 },
    };
    await expect(verifyPublishedCompanionResources(pointsUrl, fetcher({
      'data/sources.json': new Response(JSON.stringify(wrong)),
    }))).rejects.toThrow(/sources.json/);
  });

  it('falha se o manifesto aponta para fora do subdiretório do projeto', async () => {
    await expect(verifyPublishedCompanionResources(pointsUrl, fetcher({
      'manifest.webmanifest': new Response(JSON.stringify({
        ...JSON.parse(goodResponses['manifest.webmanifest']),
        start_url: '/',
      })),
    }))).rejects.toThrow(/manifest.webmanifest/);
  });

  it('falha quando service worker publicado não inclui o snapshot municipal', async () => {
    await expect(verifyPublishedCompanionResources(pointsUrl, fetcher({
      'sw.js': new Response("const PRECACHE_URLS = [];"),
    }))).rejects.toThrow(/sw.js/);
  });
});
