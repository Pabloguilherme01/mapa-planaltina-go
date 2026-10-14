import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { rm } from 'node:fs/promises';
import { verifyPagesArtifact } from '../scripts/verify-pages-artifact.ts';

const tempRoots: string[] = [];

async function makeArtifact(options?: { rootAsset?: boolean; nonDemo?: boolean; simulator?: boolean }) {
  const root = await mkdtemp(join(tmpdir(), 'planaltina-pages-'));
  tempRoots.push(root);
  await mkdir(join(root, 'fontes'), { recursive: true });
  await mkdir(join(root, 'data'), { recursive: true });
  await mkdir(join(root, 'assets'), { recursive: true });

  const assetPrefix = options?.rootAsset ? '/assets/' : '/mapa-planaltina-go/assets/';
  const html = `<!doctype html><script type="module" src="${assetPrefix}app.js"></script>`;
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
  return root;
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('verificador do artefato GitHub Pages', () => {
  it('aceita um artefato com base path correto e dados DEMO', async () => {
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
});
