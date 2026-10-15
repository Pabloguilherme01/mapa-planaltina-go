import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { rm } from 'node:fs/promises';
import { verifyPagesArtifact } from '../scripts/verify-pages-artifact.ts';

const tempRoots: string[] = [];

type ArtifactOptions = {
  rootAsset?: boolean;
  realPoint?: 'valid' | 'invalid';
  simulator?: boolean;
  missingPwa?: boolean;
};

async function makeArtifact(options?: ArtifactOptions) {
  const root = await mkdtemp(join(tmpdir(), 'planaltina-pages-'));
  tempRoots.push(root);
  await mkdir(join(root, 'fontes'), { recursive: true });
  await mkdir(join(root, 'data'), { recursive: true });
  await mkdir(join(root, 'assets'), { recursive: true });
  await mkdir(join(root, 'icons'), { recursive: true });

  const assetPrefix = options?.rootAsset ? '/assets/' : '/mapa-planaltina-go/assets/';
  const pwaHead = options?.missingPwa
    ? ''
    : '<link rel="manifest" href="/mapa-planaltina-go/manifest.webmanifest"><meta name="theme-color" content="#355E3B">';
  const html = `<!doctype html><head>${pwaHead}</head><script type="module" src="${assetPrefix}app.js"></script>`;
  await writeFile(join(root, 'index.html'), html);
  await writeFile(join(root, 'fontes', 'index.html'), html);
  await writeFile(join(root, '404.html'), html);
  await writeFile(join(root, '.nojekyll'), '');
  await writeFile(
    join(root, 'assets', 'app.js'),
    options?.simulator ? 'console.log("Estados da Interface (Stitch)")' : 'console.log("ok")'
  );

  const demoPoint = {
    id: 'demo-p1',
    isDemo: true,
    provenanceMeta: {
      provenance: 'demo',
      verificationStatus: 'synthetic_demo',
      sourceName: 'DEMO',
      license: 'Demonstração',
      retrievedAt: '2026-10-14T00:00:00.000Z',
    },
  };
  const realPoint = {
    id: 'cnes-2437651',
    isDemo: false,
    lat: -15.45,
    lng: -47.60,
    provenanceMeta:
      options?.realPoint === 'invalid'
        ? { provenance: 'official' }
        : {
            provenance: 'official',
            verificationStatus: 'verified',
            sourceName: 'SES-GO / CNES',
            sourceUrl: 'https://dadosabertos.go.gov.br/resource/cnes',
            license: 'Licença não informada no recurso',
            retrievedAt: '2026-10-14T23:30:00.000Z',
          },
  };
  const data = options?.realPoint ? [realPoint, demoPoint] : [demoPoint];

  await writeFile(
    join(root, 'data', 'points.json'),
    JSON.stringify({
      success: true,
      data,
      meta: {
        ibgeCode: '5217609',
        realCount: options?.realPoint ? 1 : 0,
        demoCount: 1,
      },
    })
  );
  await writeFile(join(root, 'data', 'sources.json'), JSON.stringify({ success: true, data: [] }));
  await writeFile(join(root, 'data', 'municipality.json'), JSON.stringify({ success: true, data: {} }));

  if (!options?.missingPwa) {
    await writeFile(
      join(root, 'manifest.webmanifest'),
      JSON.stringify({
        name: 'Mapa Planaltina GO',
        start_url: '/mapa-planaltina-go/',
        scope: '/mapa-planaltina-go/',
        display: 'standalone',
        icons: [
          {
            src: '/mapa-planaltina-go/icons/mapa-planaltina.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      })
    );
    await writeFile(
      join(root, 'sw.js'),
      "const BASE_PATH = '/mapa-planaltina-go/'; const PRECACHE_URLS = ['/mapa-planaltina-go/data/points.json'];"
    );
    await writeFile(
      join(root, 'icons', 'mapa-planaltina.svg'),
      '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
    );
  }

  return root;
}

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  );
});

describe('verificador do artefato GitHub Pages', () => {
  it('aceita artefato DEMO íntegro', async () => {
    await expect(verifyPagesArtifact(await makeArtifact())).resolves.toBeUndefined();
  });

  it('aceita ponto real somente quando a proveniência oficial é verificável', async () => {
    await expect(
      verifyPagesArtifact(await makeArtifact({ realPoint: 'valid' }))
    ).resolves.toBeUndefined();
  });

  it('rejeita ponto real sem metadados obrigatórios de proveniência', async () => {
    await expect(
      verifyPagesArtifact(await makeArtifact({ realPoint: 'invalid' }))
    ).rejects.toThrow(/proveniência|verifica/i);
  });

  it('rejeita referências de assets que ignoram o prefixo do projeto', async () => {
    await expect(verifyPagesArtifact(await makeArtifact({ rootAsset: true }))).rejects.toThrow(
      /base path/i
    );
  });

  it('rejeita simulador do Stitch no bundle de produção', async () => {
    await expect(verifyPagesArtifact(await makeArtifact({ simulator: true }))).rejects.toThrow(
      /Stitch/i
    );
  });

  it('rejeita publicação sem manifesto, service worker ou ícone instalável', async () => {
    await expect(verifyPagesArtifact(await makeArtifact({ missingPwa: true }))).rejects.toThrow(
      /PWA|manifest|service worker|ícone/i
    );
  });
});

it.each([
  ['latitude fora do intervalo', 'lat', 91],
  ['longitude fora do intervalo', 'lng', -181],
  ['URL sem host', 'sourceUrl', 'https://'],
  ['URL com credenciais', 'sourceUrl', 'https://user:password@example.org/data'],
  ['data inválida', 'retrievedAt', 'não é uma data'],
  ['fonte vazia', 'sourceName', '   '],
  ['licença vazia', 'license', '   '],
])('bloqueia ponto real com %s', async (_label, field, value) => {
  const root = await makeArtifact({ realPoint: 'valid' });
  const path = join(root, 'data', 'points.json');
  const payload = JSON.parse(await readFile(path, 'utf8'));
  const point = payload.data[0];
  if (field === 'lat' || field === 'lng') point[field] = value;
  else point.provenanceMeta[field] = value;
  await writeFile(path, JSON.stringify(payload));
  await expect(verifyPagesArtifact(root)).rejects.toThrow(/proveniência|verifica/i);
});

it.each(['realCount', 'demoCount'])('exige contagem explícita %s', async (field) => {
  const root = await makeArtifact({ realPoint: 'valid' });
  const path = join(root, 'data', 'points.json');
  const payload = JSON.parse(await readFile(path, 'utf8'));
  delete payload.meta[field];
  await writeFile(path, JSON.stringify(payload));
  await expect(verifyPagesArtifact(root)).rejects.toThrow(/Count/);
});

it.each(['duplicate', 'blank', 'missing'])('bloqueia identidade de ponto inválida: %s', async (mode) => {
  const root = await makeArtifact({ realPoint: 'valid' });
  const path = join(root, 'data', 'points.json');
  const payload = JSON.parse(await readFile(path, 'utf8'));
  if (mode === 'duplicate') payload.data[1].id = payload.data[0].id;
  if (mode === 'blank') payload.data[1].id = '   ';
  if (mode === 'missing') delete payload.data[1].id;
  await writeFile(path, JSON.stringify(payload));
  await expect(verifyPagesArtifact(root)).rejects.toThrow(/identidade|duplicad/i);
});