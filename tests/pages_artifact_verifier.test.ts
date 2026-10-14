import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { rm } from 'node:fs/promises';
import { verifyPagesArtifact } from '../scripts/verify-pages-artifact.ts';

const tempRoots: string[] = [];

async function makeArtifact(options?: { rootAsset?: boolean; nonDemo?: boolean; simulator?: boolean; missingPwa?: boolean }) {
  const root = await mkdtemp(join(tmpdir(), 'planaltina-pages-'));
  tempRoots.push(root);
  await mkdir(join(root, 'fontes'), { recursive: true });
  await mkdir(join(root, 'data'), { recursive: true });
  await mkdir(join(root, 'assets'), { recursive: true });
  await mkdir(join(root, 'icons'), { recursive: true });

  const assetPrefix = options?.rootAsset ? '/assets/' : '/mapa-planaltina-go/assets/';
  const pwaHead = options?.missingPwa ? '' : '<link rel="manifest" href="/mapa-planaltina-go/manifest.webmanifest"><meta name="theme-color" content="#355E3B">';
  const html = `<!doctype html><head>${pwaHead}</head><script type="module" src="${assetPrefix}app.js"></script>`;
  await writeFile(join(root, 'index.html'), html);
  await writeFile(join(root, 'fontes', 'index.html'), html);
  await writeFile(join(root, '404.html'), html);
  await writeFile(join(root, '.nojekyll'), '');
  await writeFile(join(root, 'assets', 'app.js'), options?.simulator ? 'console.log("Estados da Interface (Stitch)")' : 'console.log("ok")');
  await writeFile(join(root, 'data', 'points.json'), JSON.stringify({
    success: true,
    data: [{ id: 'p1', isDemo: !options?.nonDemo }],
    meta: { ibgeCode: '5217609' },
  }));
  await writeFile(join(root, 'data', 'sources.json'), JSON.stringify({ success: true, data: [] }));
  await writeFile(join(root, 'data', 'municipality.json'), JSON.stringify({ success: true, data: {} }));

  if (!options?.missingPwa) {
    await writeFile(join(root, 'manifest.webmanifest'), JSON.stringify({
      name: 'Mapa Planaltina GO',
      start_url: '/mapa-planaltina-go/',
      scope: '/mapa-planaltina-go/',
      display: 'standalone',
      icons: [{ src: '/mapa-planaltina-go/icons/mapa-planaltina.svg', sizes: 'any', type: 'image/svg+xml' }],
    }));
    await writeFile(join(root, 'sw.js'), "const BASE_PATH = '/mapa-planaltina-go/'; const PRECACHE_URLS = ['/mapa-planaltina-go/data/points.json'];");
    await writeFile(join(root, 'icons', 'mapa-planaltina.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  }

  return root;
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('verificador do artefato GitHub Pages', () => {
  it('aceita um artefato com base path correto, dados DEMO e PWA íntegra', async () => {
    await expect(verifyPagesArtifact(await makeArtifact())).resolves.toBeUndefined();
  });

  it('rejeita referências de assets que ignoram o prefixo do projeto', async () => {
    await expect(verifyPagesArtifact(await makeArtifact({ rootAsset: true }))).rejects.toThrow(/base path/i);
  });

  it('rejeita ponto publicado sem marcação DEMO', async () => {
    await expect(verifyPagesArtifact(await makeArtifact({ nonDemo: true }))).rejects.toThrow(/DEMO/i);
  });

  it('rejeita simulador do Stitch no bundle de produção', async () => {
    await expect(verifyPagesArtifact(await makeArtifact({ simulator: true }))).rejects.toThrow(/Stitch/i);
  });

  it('rejeita publicação sem manifesto, service worker ou ícone instalável', async () => {
    await expect(verifyPagesArtifact(await makeArtifact({ missingPwa: true }))).rejects.toThrow(/PWA|manifest|service worker|ícone/i);
  });
});
