import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { MUNICIPALITY_CODE, type MapPoint } from '../../src/types/index.ts';
import { isSnapshotDate } from '../../src/utils/snapshotDate.ts';
import { inPlanaltina } from '../../src/utils/territory.ts';

const provenance = z.object({
  provenance: z.enum(['official', 'verified_open_data', 'community', 'demo']),
  verificationStatus: z.enum(['verified', 'unverified', 'pending', 'synthetic_demo']),
  sourceName: z.string().trim().min(1),
  sourceUrl: z.string().optional(),
  retrievedAt: z.string().min(1),
  license: z.string().trim().min(1),
  disclaimer: z.string(),
});

const point = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  category: z.enum(['Saúde', 'Educação', 'Transporte', 'Segurança', 'Serviços Públicos', 'Comércio', 'Lazer', 'Meio Ambiente', 'Rural']),
  description: z.string(),
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
  zone: z.enum(['Urbana', 'Rural', 'Distrital', 'Não classificada']),
  isDemo: z.boolean(),
  demoDisclaimer: z.string(),
  provenanceMeta: provenance,
  tags: z.array(z.string()),
  addressHint: z.string().optional(),
});

const payloadSchema = z.object({
  success: z.literal(true),
  data: z.array(point).min(1).max(10_000),
  meta: z.object({
    ibgeCode: z.literal(MUNICIPALITY_CODE),
    realCount: z.number().int().min(1),
    demoCount: z.number().int().min(0),
  }),
});

/** Valida o contrato real+DEMO gerado no build antes de expor qualquer dado na API. */
export function parsePublishedCatalog(payload: unknown): {
  points: MapPoint[];
  realCount: number;
  demoCount: number;
} {
  const result = payloadSchema.safeParse(payload);
  if (!result.success) throw new Error('Snapshot municipal inválido: formato ou código incompatível.');

  const { data, meta } = result.data;
  const ids = new Set<string>();
  let realCount = 0;
  let demoCount = 0;
  for (const record of data) {
    if (ids.has(record.id)) throw new Error('Catálogo municipal contém identidade duplicada.');
    ids.add(record.id);
    if (!isSnapshotDate(record.provenanceMeta.retrievedAt)) {
      throw new Error('Catálogo municipal contém data de snapshot inválida.');
    }
    if (record.isDemo) {
      demoCount++;
      if (record.provenanceMeta.provenance !== 'demo' ||
          record.provenanceMeta.verificationStatus !== 'synthetic_demo' ||
          !record.demoDisclaimer.trim()) {
        throw new Error('Catálogo municipal contém DEMO sem procedência explícita.');
      }
      continue;
    }
    realCount++;
    const source = record.provenanceMeta;
    let validUrl = false;
    try {
      const url = new URL(source.sourceUrl ?? '');
      validUrl = url.protocol === 'https:' && Boolean(url.hostname)
        && !url.username && !url.password;
    } catch { validUrl = false; }
    if (!validUrl ||
        !['official', 'verified_open_data'].includes(source.provenance) ||
        source.verificationStatus !== 'verified' ||
        !inPlanaltina(record.lat, record.lng)) {
      throw new Error('Catálogo municipal contém registro real sem geometria ou procedência verificável.');
    }
  }
  if (realCount === 0 || realCount !== meta.realCount || demoCount !== meta.demoCount) {
    throw new Error('Contagens do catálogo municipal não correspondem ao snapshot.');
  }
  return { points: data as MapPoint[], realCount, demoCount };
}

/** Um arquivo inválido impede a inicialização da API; não cai silenciosamente em DEMO. */
export function loadPublishedCatalog(filePath: string): ReturnType<typeof parsePublishedCatalog> {
  if (!filePath.trim()) throw new Error('Caminho do catálogo municipal não foi informado.');
  let content: string;
  try { content = readFileSync(filePath, 'utf8'); }
  catch { throw new Error('Snapshot municipal configurado não pôde ser lido.'); }
  let payload: unknown;
  try { payload = JSON.parse(content); }
  catch { throw new Error('Snapshot municipal configurado contém JSON inválido.'); }
  return parsePublishedCatalog(payload);
}
