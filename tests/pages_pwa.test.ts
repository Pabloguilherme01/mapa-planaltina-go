import { describe, expect, it } from 'vitest';
import { buildServiceWorkerSource, buildWebManifest } from '../scripts/pagesPwa.ts';

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
    expect(source).toContain('event.request.mode === \'navigate\'');
    expect(source).toContain(`caches.match('${BASE}')`);
  });
});
