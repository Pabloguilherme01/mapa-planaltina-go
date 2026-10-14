import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const EXPECTED_BASE = '/mapa-planaltina-go/';
const REQUIRED_FILES = [
  'index.html',
  'fontes/index.html',
  '404.html',
  '.nojekyll',
  'data/points.json',
  'data/sources.json',
  'data/municipality.json',
  'manifest.webmanifest',
  'sw.js',
  'icons/mapa-planaltina.svg',
] as const;

async function readRequired(root: string, relativePath: string) {
  try {
    return await readFile(join(root, relativePath), 'utf8');
  } catch (error) {
    throw new Error(`Artefato incompleto: ${relativePath} não foi gerado.`, { cause: error });
  }
}

export async function verifyPagesArtifact(root = 'dist'): Promise<void> {
  const contents = new Map<string, string>();
  for (const relativePath of REQUIRED_FILES) {
    contents.set(relativePath, await readRequired(root, relativePath));
  }

  for (const htmlPath of ['index.html', 'fontes/index.html', '404.html']) {
    const html = contents.get(htmlPath) ?? '';
    if (/(?:src|href)=["']\/assets\//i.test(html)) {
      throw new Error(`Base path inválido em ${htmlPath}: assets apontam para /assets/ em vez de ${EXPECTED_BASE}assets/.`);
    }
    if (!html.includes(`${EXPECTED_BASE}assets/`)) {
      throw new Error(`Base path ausente em ${htmlPath}: nenhum asset usa ${EXPECTED_BASE}assets/.`);
    }
    if (!html.includes(`${EXPECTED_BASE}manifest.webmanifest`)) {
      throw new Error(`PWA inválida em ${htmlPath}: link do manifesto não usa ${EXPECTED_BASE}.`);
    }
  }

  const points = JSON.parse(contents.get('data/points.json') ?? '{}') as {
    success?: boolean;
    data?: Array<{ isDemo?: boolean }>;
    meta?: { ibgeCode?: string };
  };
  if (points.success !== true || !Array.isArray(points.data)) {
    throw new Error('points.json inválido no artefato do Pages.');
  }
  if (points.meta?.ibgeCode !== '5217609') {
    throw new Error('points.json não identifica Planaltina, Goiás pelo IBGE 5217609.');
  }
  if (!points.data.every((point) => point.isDemo === true)) {
    throw new Error('Publicação bloqueada: existe ponto sem marcação DEMO no artefato estático.');
  }

  const sources = JSON.parse(contents.get('data/sources.json') ?? '{}') as { success?: boolean; data?: unknown[] };
  if (sources.success !== true || !Array.isArray(sources.data)) {
    throw new Error('sources.json inválido no artefato do Pages.');
  }
  JSON.parse(contents.get('data/municipality.json') ?? '{}');

  const manifest = JSON.parse(contents.get('manifest.webmanifest') ?? '{}') as {
    name?: string;
    start_url?: string;
    scope?: string;
    display?: string;
    icons?: Array<{ src?: string }>;
  };
  if (
    manifest.name !== 'Mapa Planaltina GO' ||
    manifest.start_url !== EXPECTED_BASE ||
    manifest.scope !== EXPECTED_BASE ||
    manifest.display !== 'standalone'
  ) {
    throw new Error('Manifesto PWA inválido ou fora do base path esperado.');
  }
  if (!manifest.icons?.some((icon) => icon.src === `${EXPECTED_BASE}icons/mapa-planaltina.svg`)) {
    throw new Error('Manifesto PWA não referencia o ícone instalável esperado.');
  }

  const serviceWorker = contents.get('sw.js') ?? '';
  if (!serviceWorker.includes(EXPECTED_BASE) || !serviceWorker.includes(`${EXPECTED_BASE}data/points.json`)) {
    throw new Error('Service worker inválido: shell e snapshot de pontos não estão no escopo offline esperado.');
  }
  if (!(contents.get('icons/mapa-planaltina.svg') ?? '').includes('<svg')) {
    throw new Error('Ícone PWA inválido.');
  }

  const assetNames = await readdir(join(root, 'assets'));
  const jsAssets = assetNames.filter((name) => name.endsWith('.js'));
  if (jsAssets.length === 0) {
    throw new Error('Artefato inválido: nenhum bundle JavaScript foi gerado.');
  }
  const bundleText = (await Promise.all(jsAssets.map((name) => readFile(join(root, 'assets', name), 'utf8')))).join('\n');
  if (bundleText.includes('Estados da Interface (Stitch)') || bundleText.includes('Simulação UI')) {
    throw new Error('Conteúdo de simulação Stitch encontrado no bundle de produção.');
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  verifyPagesArtifact(process.argv[2] ?? 'dist')
    .then(() => console.log('Artefato GitHub Pages verificado com sucesso.'))
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
