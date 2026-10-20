import { inPlanaltina } from '../src/utils/territory.ts';
import { isSnapshotDate } from '../src/utils/snapshotDate.ts';
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

interface ArtifactPoint {
  id?: string;
  isDemo?: boolean;
  lat?: number;
  lng?: number;
  provenanceMeta?: {
    provenance?: string;
    verificationStatus?: string;
    sourceName?: string;
    sourceUrl?: string;
    license?: string;
    retrievedAt?: string;
  };
}

async function readRequired(root: string, relativePath: string) {
  try {
    return await readFile(join(root, relativePath), 'utf8');
  } catch (error) {
    throw new Error(`Artefato incompleto: ${relativePath} não foi gerado.`, { cause: error });
  }
}

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value !== 0;
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isSourceUrl(value: unknown): boolean {
  if (!hasText(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function verifyRealPoint(point: ArtifactPoint): void {
  const provenance = point.provenanceMeta;
  const confirmed = provenance?.provenance === 'official' || provenance?.provenance === 'verified_open_data';
  const community = provenance?.provenance === 'community' &&
    (provenance.verificationStatus === 'unverified' || provenance.verificationStatus === 'pending') &&
    /^osm-(node|way|relation)-[1-9]\\d*$/.test(point.id ?? '') &&
    /^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/[1-9]\\d*$/.test(provenance.sourceUrl ?? '');
  const sourceAllowed = confirmed || community;

  if (
    !point.id ||
    !isFiniteCoordinate(point.lat) || Math.abs(point.lat) > 90 ||
    !isFiniteCoordinate(point.lng) || Math.abs(point.lng) > 180 ||
    !sourceAllowed ||
    (confirmed && provenance?.verificationStatus !== 'verified') ||
    !hasText(provenance.sourceName) ||
    !isSourceUrl(provenance.sourceUrl) ||
    !hasText(provenance.license) ||
    !isSnapshotDate(provenance.retrievedAt)
  ) {
    throw new Error(
      `Publicação bloqueada: ponto real ${point.id || '(sem id)'} sem proveniência verificável, coordenadas válidas ou metadados obrigatórios.`
    );
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
      throw new Error(
        `Base path inválido em ${htmlPath}: assets apontam para /assets/ em vez de ${EXPECTED_BASE}assets/.`
      );
    }
    if (!html.includes(`${EXPECTED_BASE}assets/`)) {
      throw new Error(
        `Base path ausente em ${htmlPath}: nenhum asset usa ${EXPECTED_BASE}assets/.`
      );
    }
    if (!html.includes(`${EXPECTED_BASE}manifest.webmanifest`)) {
      throw new Error(`PWA inválida em ${htmlPath}: link do manifesto não usa ${EXPECTED_BASE}.`);
    }
  }

  const points = JSON.parse(contents.get('data/points.json') ?? '{}') as {
    success?: boolean;
    data?: ArtifactPoint[];
    meta?: {
      ibgeCode?: string;
      realCount?: number;
      demoCount?: number;
    };
  };
  if (points.success !== true || !Array.isArray(points.data)) {
    throw new Error('points.json inválido no artefato do Pages.');
  }
  if (points.meta?.ibgeCode !== '5217609') {
    throw new Error('points.json não identifica Planaltina, Goiás pelo IBGE 5217609.');
  }

  const identities = new Set<string>();
  for (const point of points.data) {
    if (!hasText(point.id) || point.id !== point.id.trim() || identities.has(point.id)) {
      throw new Error('Publicação bloqueada: identidade ausente, inválida ou duplicada no catálogo.');
    }
    identities.add(point.id);
  }

  const realPoints = points.data.filter((point) => point.isDemo === false);
  const demoPoints = points.data.filter((point) => point.isDemo === true);
  const ambiguousPoints = points.data.filter(
    (point) => point.isDemo !== true && point.isDemo !== false
  );
  if (ambiguousPoints.length > 0) {
    throw new Error('Publicação bloqueada: existem pontos sem classificação explícita DEMO/real.');
  }
  realPoints.forEach(verifyRealPoint);
  if (realPoints.some(point => !inPlanaltina(point.lat!, point.lng!))) throw new Error('Publicação bloqueada: ponto real fora da malha municipal IBGE.');

  if (
    !Number.isInteger(points.meta?.realCount) ||
    points.meta.realCount !== realPoints.length
  ) {
    throw new Error('points.json inconsistente: realCount não corresponde aos pontos reais.');
  }
  if (
    !Number.isInteger(points.meta?.demoCount) ||
    points.meta.demoCount !== demoPoints.length
  ) {
    throw new Error('points.json inconsistente: demoCount não corresponde aos pontos DEMO.');
  }

  const sources = JSON.parse(contents.get('data/sources.json') ?? '{}') as {
    success?: boolean;
    data?: unknown[];
  };
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
  if (
    !manifest.icons?.some(
      (icon) => icon.src === `${EXPECTED_BASE}icons/mapa-planaltina.svg`
    )
  ) {
    throw new Error('Manifesto PWA não referencia o ícone instalável esperado.');
  }

  const serviceWorker = contents.get('sw.js') ?? '';
  if (
    !serviceWorker.includes(EXPECTED_BASE) ||
    !serviceWorker.includes(`${EXPECTED_BASE}data/points.json`)
  ) {
    throw new Error(
      'Service worker inválido: shell e snapshot de pontos não estão no escopo offline esperado.'
    );
  }
  if (!(contents.get('icons/mapa-planaltina.svg') ?? '').includes('<svg')) {
    throw new Error('Ícone PWA inválido.');
  }

  const assetNames = await readdir(join(root, 'assets'));
  const jsAssets = assetNames.filter((name) => name.endsWith('.js'));
  if (jsAssets.length === 0) {
    throw new Error('Artefato inválido: nenhum bundle JavaScript foi gerado.');
  }
  const bundleText = (
    await Promise.all(
      jsAssets.map((name) => readFile(join(root, 'assets', name), 'utf8'))
    )
  ).join('\n');
  if (
    bundleText.includes('Estados da Interface (Stitch)') ||
    bundleText.includes('Simulação UI')
  ) {
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
