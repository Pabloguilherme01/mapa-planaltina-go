import { appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { isSnapshotDate } from '../src/utils/snapshotDate.ts';
import { inPlanaltina } from '../src/utils/territory.ts';
import { verifyPublishedCompanionResources } from './published-site-health.ts';

export interface PublishedSnapshotHealth {
  status: 'healthy' | 'stale';
  realCount: number;
  oldestAgeDays: number;
  sourceMode: 'live' | 'snapshot_fallback';
}

type JsonRecord = Record<string, unknown>;

function record(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Auditoria independente: não promove fallback a coleta atual e ignora DEMO na idade. */
export function assessPublishedSnapshot(
  payload: unknown,
  now = new Date(),
  maxAgeDays = 30
): PublishedSnapshotHealth {
  if (!record(payload) || payload.success !== true || !Array.isArray(payload.data) || !record(payload.meta)) {
    throw new Error('Catálogo público inválido.');
  }
  if (payload.meta.ibgeCode !== '5217609') {
    throw new Error('Catálogo não pertence a Planaltina-GO (IBGE 5217609).');
  }
  const sourceMode = payload.meta.realSourceMode;
  if (sourceMode !== 'live' && sourceMode !== 'snapshot_fallback') {
    throw new Error('Modo de atualização CNES ausente ou não reconhecido.');
  }
  if (!Number.isFinite(maxAgeDays) || maxAgeDays < 0) {
    throw new Error('Limite de idade inválido.');
  }

  const seen = new Set<string>();
  let demoCount = 0;
  let realCount = 0;
  let oldest = 0;
  for (const value of payload.data) {
    if (!record(value) || typeof value.id !== 'string' || !value.id.trim() || seen.has(value.id)) {
      throw new Error('Identidade ausente ou duplicada no catálogo publicado.');
    }
    seen.add(value.id);
    if (value.isDemo === true) {
      demoCount++;
      continue;
    }
    if (value.isDemo !== false || !record(value.provenanceMeta)) {
      throw new Error('Ponto real sem classificação ou proveniência.');
    }
    if (
      typeof value.lat !== 'number' || !Number.isFinite(value.lat) || value.lat === 0 ||
      typeof value.lng !== 'number' || !Number.isFinite(value.lng) || value.lng === 0 ||
      !inPlanaltina(value.lat, value.lng)
    ) {
      throw new Error('Ponto real sem coordenadas válidas dentro da malha municipal de Planaltina-GO.');
    }
    const meta = value.provenanceMeta;
    if (
      !['official', 'verified_open_data'].includes(String(meta.provenance)) ||
      meta.verificationStatus !== 'verified' ||
      !isSnapshotDate(meta.retrievedAt, now.getTime())
    ) {
      throw new Error('Ponto real sem proveniência verificada ou data válida.');
    }
    realCount++;
    oldest = Math.max(oldest, now.getTime() - Date.parse(meta.retrievedAt));
  }
  if (
    realCount === 0 ||
    payload.meta.realCount !== realCount ||
    payload.meta.demoCount !== demoCount
  ) {
    throw new Error('Contagens reais/DEMO inconsistentes no catálogo.');
  }
  const oldestAgeDays = Math.floor(oldest / 86_400_000);
  return {
    status: oldestAgeDays >= maxAgeDays ? 'stale' : 'healthy',
    realCount,
    oldestAgeDays,
    sourceMode,
  };
}

async function main() {
  const url = process.argv[2] ?? 'https://pabloguilherme01.github.io/mapa-planaltina-go/data/points.json';
  if (new URL(url).protocol !== 'https:') throw new Error('Consulta externa exige HTTPS.');
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (!response.ok) throw new Error(`Catálogo indisponível (HTTP ${response.status}).`);
  const health = assessPublishedSnapshot(await response.json());
  const surface = await verifyPublishedCompanionResources(url);
  const summary = [
    '## Saúde do snapshot de Planaltina-GO',
    '',
    `- Estado: **${health.status}**`,
    `- Pontos reais: **${health.realCount}**`,
    `- Registro real mais antigo: **${health.oldestAgeDays} dias**`,
    `- Modo da fonte: **${health.sourceMode}**`,
    `- Recursos da experiência pública confirmados: **${surface.checked.join(', ')}**`,
    '',
    'Idade é calculada pela coleta dos registros reais, não pela hora do deploy.',
  ].join('\n');
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
  }
  if (health.status === 'stale') {
    console.error('::error::Snapshot real desatualizado; conferir a coleta CNES e o fallback preservado.');
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error: unknown) => {
    console.error('::error::Vigia do snapshot falhou:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
