type RecordValue = Record<string, unknown>;
const REQUIRED = ['fontes/', 'data/sources.json', 'manifest.webmanifest', 'sw.js'] as const;

function object(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function asExpectedPageUrl(snapshotUrl: string): URL {
  const parsed = new URL(snapshotUrl);
  if (parsed.protocol !== 'https:') throw new Error('Monitor público exige HTTPS.');
  if (!parsed.pathname.endsWith('/data/points.json') || parsed.search || parsed.hash) {
    throw new Error('URL pública deve terminar em /data/points.json.');
  }
  return new URL('../', parsed);
}

/**
 * Vigia os recursos que completam a experiência pública.
 * Um 200 com HTML de fallback não é considerado JSON válido.
 * Não consulta tiles, geolocalização, métricas pessoais ou serviços pagos.
 */
export async function verifyPublishedCompanionResources(
  snapshotUrl: string,
  fetcher: typeof fetch = fetch
): Promise<{ checked: string[] }> {
  const base = asExpectedPageUrl(snapshotUrl);
  const results = new Map<string, string>();
  for (const path of REQUIRED) {
    const url = new URL(path, base);
    if (url.origin !== base.origin) throw new Error('Monitor não permite origem externa.');
    const response = await fetcher(url.toString(), {
      signal: AbortSignal.timeout(15_000),
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!response.ok || (response.url && new URL(response.url).origin !== base.origin)) {
      throw new Error(`Recurso publicado indisponível: ${path} (HTTP ${response.status}).`);
    }
    results.set(path, await response.text());
  }

  const html = results.get('fontes/') ?? '';
  if (!/<title>Mapa Planaltina GO<\/title>/i.test(html)) {
    throw new Error('Página de fontes não corresponde ao produto publicado: fontes/.');
  }

  let sources: unknown;
  try { sources = JSON.parse(results.get('data/sources.json') ?? ''); }
  catch { throw new Error('data/sources.json contém JSON inválido.'); }
  if (!object(sources) || sources.success !== true || !Array.isArray(sources.data) ||
      sources.data.length === 0 || !object(sources.meta) ||
      sources.meta.municipalCode !== '5217609' ||
      sources.meta.totalSources !== sources.data.length) {
    throw new Error('data/sources.json não corresponde ao catálogo municipal.');
  }

  let manifest: unknown;
  try { manifest = JSON.parse(results.get('manifest.webmanifest') ?? ''); }
  catch { throw new Error('manifest.webmanifest contém JSON inválido.'); }
  const basePath = base.pathname;
  if (!object(manifest) || manifest.name !== 'Mapa Planaltina GO' ||
      manifest.display !== 'standalone' ||
      manifest.start_url !== basePath || manifest.scope !== basePath) {
    throw new Error('manifest.webmanifest não corresponde ao subdiretório publicado.');
  }

  const worker = results.get('sw.js') ?? '';
  if (!worker.includes(`${basePath}data/points.json`)) {
    throw new Error('sw.js não inclui o snapshot municipal publicado.');
  }

  return { checked: [...REQUIRED] };
}
