import { describe, expect, it } from 'vitest';
import {
  buildServiceWorkerSource,
  buildWebManifest,
  injectPwaMetadata,
} from '../scripts/pagesPwa.ts';

const BASE = '/mapa-planaltina-go/';

describe('GitHub Pages PWA assets', () => {
  it('gera manifesto instalável respeitando o base path do projeto', () => {
    const manifest = buildWebManifest(BASE);

    expect(manifest.name).toBe('Mapa Planaltina GO');
    expect(manifest.short_name).toBe('Mapa Planaltina');
    expect(manifest.start_url).toBe(BASE);
    expect(manifest.scope).toBe(BASE);
    expect(manifest.display).toBe('standalone');
  });

  it('injeta metadados de instalação sem duplicar entradas existentes', () => {
    const html = '<html><head><title>Mapa</title></head><body></body></html>';
    const once = injectPwaMetadata(html, BASE);
    const twice = injectPwaMetadata(once, BASE);

    expect(once).toContain(`href="${BASE}manifest.webmanifest"`);
    expect(once).toContain('name="theme-color"');
    expect(twice.match(/manifest\.webmanifest/g)).toHaveLength(1);
  });

  it('gera service worker com precache do shell e dos snapshots locais', () => {
    const source = buildServiceWorkerSource({
      basePath: BASE,
      cacheName: 'mapa-planaltina-v1',
      assets: [
        'index.html',
        'fontes/index.html',
        'data/points.json',
        'data/sources.json',
        'data/municipality.json',
        'assets/app.js',
      ],
    });

    expect(source).toContain("const CACHE_NAME = 'mapa-planaltina-v1'");
    expect(source).toContain(`${BASE}data/points.json`);
    expect(source).toContain(`${BASE}fontes/index.html`);
    expect(source).toContain("request.mode === 'navigate'");
  });

  it('atualiza catálogo e fontes com rede disponível, preservando cache offline no PWA', () => {
    const source = buildServiceWorkerSource({ basePath: BASE, cacheName: 'mapa-planaltina-v1',
      assets: ['index.html', 'data/points.json', 'data/sources.json', 'data/road-graph.json'] });
    expect(source).toContain("const REFRESHABLE_DATA");
    expect(source).toContain(`${BASE}data/points.json`);
    expect(source).toContain(`${BASE}data/sources.json`);
    expect(source).toContain("await fetch(request, { signal: AbortSignal.timeout(6000) })");
    expect(source).toContain("catch (error)");
    expect(source).toContain("caches.match(request, { ignoreVary: true })");
  });
  it('usa timeout em redes intermitentes para não prender o mapa offline', () => {
    const sw = buildServiceWorkerSource({ basePath: BASE, cacheName: 'mapa-planaltina-v2',
      assets: ['data/points.json', 'assets/app.js'] });
    expect(sw).toContain('AbortSignal.timeout(4500)');
    expect(sw).toContain('AbortSignal.timeout(6000)');
    expect(sw).toContain('navigationFallback(request)');
    expect(sw).toContain('Response.error()');
  });
  it('preserva malha viária baixada no aparelho após atualização PWA quando ainda válida', () => {
    const sw=buildServiceWorkerSource({
      basePath: BASE, cacheName:'mapa-planaltina-new',
      assets:['index.html','data/points.json','assets/app.js'],
    });
    expect(sw).toContain('const GRAPH_URL');
    expect(sw).toContain('async function migrateOfflineRoadGraph');
    expect(sw).toContain("createdAt");
    expect(sw).toContain("21 * 24 * 60 * 60 * 1000");
    expect(sw).toContain("await migrateOfflineRoadGraph()");
    expect(sw).toContain("caches.delete(key)");
    expect(sw.indexOf('await migrateOfflineRoadGraph()')).toBeLessThan(sw.indexOf('caches.delete(key)'));
  });

  it('faz match do precache por URL mesmo quando a resposta varia por Origin', () => {
    const source = buildServiceWorkerSource({
      basePath: BASE,
      cacheName: 'mapa-planaltina-v1',
      assets: ['index.html', 'assets/app.js'],
    });

    expect(source).toContain('caches.match(request, { ignoreVary: true })');
    expect(source).toContain('caches.match(fallbackUrl, { ignoreVary: true })');
    expect(source).toContain(`caches.match('${BASE}', { ignoreVary: true })`);
  });
});
