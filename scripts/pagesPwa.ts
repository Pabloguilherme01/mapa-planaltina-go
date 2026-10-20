import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface PagesPwaOptions {
  basePath: string;
  cacheName: string;
  assets: string[];
}

export function normalizeBasePath(basePath: string): string {
  const raw = basePath.trim() || '/';
  const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, '/');
  return collapsed.endsWith('/') ? collapsed : `${collapsed}/`;
}

export function buildWebManifest(basePath: string) {
  const base = normalizeBasePath(basePath);

  return {
    name: 'Mapa Planaltina GO',
    short_name: 'Mapa Planaltina',
    description:
      'Mapa cívico de Planaltina, Goiás, com locais reais, fontes auditáveis e consulta offline do catálogo.',
    lang: 'pt-BR',
    start_url: base,
    scope: base,
    display: 'standalone',
    background_color: '#F5F0E6',
    theme_color: '#355E3B',
    icons: [
      {
        src: `${base}icons/mapa-planaltina.svg`,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  } as const;
}

export function injectPwaMetadata(html: string, basePath: string): string {
  const base = normalizeBasePath(basePath);
  const additions: string[] = [];

  if (!/<link\b[^>]*rel=["']manifest["'][^>]*>/i.test(html)) {
    additions.push(`    <link rel="manifest" href="${base}manifest.webmanifest" />`);
  }
  if (!/<meta\b[^>]*name=["']theme-color["'][^>]*>/i.test(html)) {
    additions.push('    <meta name="theme-color" content="#355E3B" />');
  }
  if (!/<meta\b[^>]*name=["']apple-mobile-web-app-capable["'][^>]*>/i.test(html)) {
    additions.push('    <meta name="apple-mobile-web-app-capable" content="yes" />');
  }

  if (additions.length === 0) return html;
  if (!html.includes('</head>')) {
    throw new Error('HTML inválido: </head> não encontrado para injetar metadados PWA.');
  }

  return html.replace('</head>', `${additions.join('\n')}\n  </head>`);
}

function toScopedUrl(basePath: string, asset: string): string {
  const cleanAsset = asset.replace(/^\/+/, '');
  return `${basePath}${cleanAsset}`;
}

function quoteSingle(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

export function buildServiceWorkerSource({
  basePath,
  cacheName,
  assets,
}: PagesPwaOptions): string {
  const base = normalizeBasePath(basePath);
  const precacheUrls = Array.from(
    new Set([
      base,
      `${base}fontes/`,
      ...assets.map((asset) => toScopedUrl(base, asset)),
    ])
  ).sort();

  return `const CACHE_NAME = ${quoteSingle(cacheName)};
const CACHE_PREFIX = 'mapa-planaltina-';
const BASE_PATH = ${quoteSingle(base)};
const REFRESHABLE_DATA = new Set([
  ${quoteSingle(base+'data/points.json')},
  ${quoteSingle(base+'data/sources.json')},
  ${quoteSingle(base+'data/municipality.json')},
  ${quoteSingle(base+'data/road-graph.json')},
]);
const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function cacheResponse(request, response) {
  if (!response || !response.ok) return response;
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  } catch (error) {
    // Falha de armazenamento ou cota offline não deve impedir o acesso online.
  }
  return response;
}

async function navigationFallback(request) {
  const url = new URL(request.url);
  const fallbackUrl = url.pathname.startsWith(BASE_PATH + 'fontes')
    ? BASE_PATH + 'fontes/'
    : BASE_PATH;
  return (await caches.match(fallbackUrl, { ignoreVary: true })) ||
    (await caches.match(${quoteSingle(base)}, { ignoreVary: true }));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE_PATH)) return;

  if (request.mode === 'navigate') {
    // Usar a página de rede; evitar gravar cada URL de pesquisa e seus filtros no cache.
    event.respondWith(
      fetch(request, { signal: AbortSignal.timeout(4500) })
        .catch(() => navigationFallback(request))
    );
    return;
  }

  if (REFRESHABLE_DATA.has(url.pathname)) {
    // Online-first: os cadastros e a malha podem ser atualizados diariamente;
    // offline: usar somente o último arquivo validado que o aparelho já possui.
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request, { signal: AbortSignal.timeout(6000) });
        if (fresh.ok) return cacheResponse(request, fresh);
        const cached = await caches.match(request, { ignoreVary: true });
        return cached || fresh;
      } catch (error) {
        return await caches.match(request, { ignoreVary: true }) || Response.error();
      }
    })());
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreVary: true }).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => cacheResponse(request, response));
    })
  );
});
`;
}

async function collectFiles(root: string, relativeDir = ''): Promise<string[]> {
  const directory = join(root, relativeDir);
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(root, relativePath)));
    } else if (entry.isFile() && relativePath !== 'sw.js') {
      files.push(relativePath);
    }
  }

  return files.sort();
}

async function createCacheName(root: string, assets: string[]): Promise<string> {
  const hash = createHash('sha256');
  for (const asset of assets) {
    hash.update(asset);
    hash.update(await readFile(join(root, asset)));
  }
  return `mapa-planaltina-${hash.digest('hex').slice(0, 12)}`;
}

export async function writePagesPwa(root = 'dist', basePath = '/mapa-planaltina-go/') {
  const base = normalizeBasePath(basePath);
  const manifest = buildWebManifest(base);
  await writeFile(join(root, 'manifest.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`);

  for (const htmlPath of ['index.html', 'fontes/index.html', '404.html']) {
    const fullPath = join(root, htmlPath);
    const html = await readFile(fullPath, 'utf8');
    await writeFile(fullPath, injectPwaMetadata(html, base));
  }

  const assets = await collectFiles(root);
  const cacheName = await createCacheName(root, assets);
  // Evita baixar uma malha municipal extensa no primeiro acesso.
  // Ao usar o roteamento, o service worker armazena o arquivo para visitas posteriores.
  const precacheAssets = assets.filter(asset => asset !== 'data/road-graph.json');
  const serviceWorker = buildServiceWorkerSource({ basePath: base, cacheName, assets: precacheAssets });
  await writeFile(join(root, 'sw.js'), serviceWorker);

  return { cacheName, assets };
}
