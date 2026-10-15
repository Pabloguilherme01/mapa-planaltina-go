import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { MapPoint, MUNICIPALITY_CODE, SourceInfo } from '../../src/types/index.ts';
import { CNES_FALLBACK_CAPTURED_AT, CNES_FALLBACK_POINTS } from '../data/cnesPlanaltinaFallback.ts';
import { SourceAdapter } from './SourceAdapter.ts';

export const CNES_MUNICIPALITY_CODE = '521760';
export const CNES_GOIAS_RESOURCE_ID = '7559175a-98ac-4719-bf30-5e6455ba57c5';
export const CNES_GOIAS_RESOURCE_URL =
  `https://dadosabertos.go.gov.br/dataset/cnes-cadastro-nacional-de-estabelecimentos-de-saude/resource/${CNES_GOIAS_RESOURCE_ID}`;
const CNES_DATASTORE_URL = 'https://dadosabertos.go.gov.br/api/3/action/datastore_search';
const CNES_LICENSE_NOTICE = 'Licença não informada no recurso do Portal de Dados Abertos de Goiás';

export interface CnesDatasetRecord {
  cnes?: string;
  razao_social?: string;
  nome_fantasia?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  url?: string;
  latitude?: string;
  longitude?: string;
  codigo_ibge?: string;
  uf?: string;
  municipio?: string;
  tipo_gestao?: string;
  natureza_juridica?: string;
  vinculo_sus?: string;
  tipo_estabelecimento?: string;
}

interface CkanDatastoreResponse {
  success?: boolean;
  result?: {
    records?: CnesDatasetRecord[];
    total?: number;
  };
}

type CnesDataMode = 'live' | 'snapshot_fallback';

function normalized(value: unknown): string {
  return String(value ?? '').trim();
}

function parseCoordinate(value: unknown, kind: 'lat' | 'lng'): number | null {
  const raw = normalized(value).replace(',', '.');
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed === 0) return null;
  if (kind === 'lat' && (parsed < -90 || parsed > 90)) return null;
  if (kind === 'lng' && (parsed < -180 || parsed > 180)) return null;
  return parsed;
}

function joinAddress(record: CnesDatasetRecord): string {
  const firstLine = [record.logradouro, record.numero, record.complemento]
    .map(normalized)
    .filter(Boolean)
    .join(', ');
  const secondLine = [record.bairro, record.cep ? `CEP ${normalized(record.cep)}` : '']
    .map(normalized)
    .filter(Boolean)
    .join(' — ');
  return [firstLine, secondLine].filter(Boolean).join(' • ');
}

export function buildCnesDatastoreUrl(limit = 200, offset = 0): string {
  const url = new URL(CNES_DATASTORE_URL);
  url.searchParams.set('resource_id', CNES_GOIAS_RESOURCE_ID);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('sort', 'cnes asc');
  url.searchParams.set('filters', JSON.stringify({ codigo_ibge: CNES_MUNICIPALITY_CODE }));
  return url.toString();
}

export function mapCnesRecordToPoint(
  record: CnesDatasetRecord,
  retrievedAt = new Date().toISOString()
): MapPoint | null {
  if (normalized(record.codigo_ibge) !== CNES_MUNICIPALITY_CODE) return null;
  if (normalized(record.uf).toUpperCase() !== 'GO') return null;
  if (normalized(record.municipio).toUpperCase() !== 'PLANALTINA') return null;

  const lat = parseCoordinate(record.latitude, 'lat');
  const lng = parseCoordinate(record.longitude, 'lng');
  if (lat === null || lng === null) return null;

  const rawCnes = normalized(record.cnes);
  if (!/^\d{1,7}$/.test(rawCnes) || /^0+$/.test(rawCnes)) return null;
  const cnes = rawCnes.padStart(7, '0');
  const name = normalized(record.nome_fantasia) || normalized(record.razao_social);
  if (!cnes || !name) return null;

  const type = normalized(record.tipo_estabelecimento);
  const sus = normalized(record.vinculo_sus);
  const descriptionParts = [
    type ? `Estabelecimento classificado no CNES como ${type}.` : 'Estabelecimento cadastrado no CNES.',
    sus ? `Vínculo SUS informado pela fonte: ${sus}.` : '',
  ].filter(Boolean);

  return {
    id: `cnes-${cnes}`,
    name,
    category: 'Saúde',
    description: descriptionParts.join(' '),
    lat,
    lng,
    zone: 'Não classificada',
    isDemo: false,
    demoDisclaimer: '',
    provenanceMeta: {
      provenance: 'official',
      sourceUrl: CNES_GOIAS_RESOURCE_URL,
      sourceName: 'SES-GO / CNES — Estabelecimentos de Saúde de Goiás',
      license: CNES_LICENSE_NOTICE,
      retrievedAt,
      verificationStatus: 'verified',
      disclaimer:
        'Registro publicado pela SES-GO com identificação CNES e coordenadas da fonte. Confirme situação de atendimento e alterações recentes antes do deslocamento.',
    },
    tags: [
      `CNES ${cnes}`,
      ...(type ? [type] : []),
      ...(sus ? [`Vínculo SUS: ${sus}`] : []),
    ],
    addressHint: joinAddress(record) || 'Endereço não informado pela fonte',
  };
}

/**
 * Adaptador para o Cadastro Nacional de Estabelecimentos de Saúde em Goiás.
 * Tenta primeiro o DataStore estadual. Se o órgão bloquear ou estiver fora,
 * preserva somente um snapshot versionado previamente validado, deixando esse
 * modo explícito no status da fonte e na procedência dos pontos.
 */
export class CnesAdapter implements SourceAdapter {
  readonly id = 'cnes';
  readonly name = 'CNES - Estabelecimentos de Saúde de Goiás';
  readonly agency = 'Secretaria de Estado da Saúde de Goiás / CNES';
  readonly municipalCode = MUNICIPALITY_CODE;
  readonly url = CNES_GOIAS_RESOURCE_URL;
  readonly license = CNES_LICENSE_NOTICE;

  constructor(private readonly snapshotPath?: string) {}

  private async restoredSnapshot(): Promise<MapPoint[] | null> {
    if (!this.snapshotPath) return null;
    try {
      const saved = JSON.parse(await readFile(this.snapshotPath, 'utf8'));
      if (saved.version !== 1 || typeof saved.retrievedAt !== 'string' ||
          !Number.isFinite(Date.parse(saved.retrievedAt)) || !Array.isArray(saved.records) ||
          saved.records.length === 0 || saved.records.length > 10_000) return null;
      const points = saved.records.map((record: CnesDatasetRecord) => {
        if (!record || Object.values(record).some(value => typeof value !== 'string')) return null;
        return mapCnesRecordToPoint(record, saved.retrievedAt);
      });
      if (points.some((point: MapPoint | null) => point === null)) return null;
      this.lastRetrievedAt = saved.retrievedAt;
      return points;
    } catch { return null; }
  }

  private async preserveSnapshot(records: CnesDatasetRecord[], retrievedAt: string): Promise<void> {
    if (!this.snapshotPath) return;
    const fields: (keyof CnesDatasetRecord)[] = ['cnes', 'razao_social', 'nome_fantasia',
      'logradouro', 'numero', 'complemento', 'bairro', 'cep', 'latitude', 'longitude',
      'codigo_ibge', 'uf', 'municipio', 'tipo_estabelecimento', 'vinculo_sus'];
    const safeRecords = records.filter(record => mapCnesRecordToPoint(record, retrievedAt))
      .map(record => Object.fromEntries(fields.map(key => [key, normalized(record[key])])));
    try {
      await mkdir(dirname(this.snapshotPath), { recursive: true });
      await writeFile(`${this.snapshotPath}.tmp`, JSON.stringify({ version: 1, retrievedAt, records: safeRecords }));
      await rename(`${this.snapshotPath}.tmp`, this.snapshotPath);
    } catch (error) {
      console.warn('Não foi possível persistir snapshot CNES; coleta live mantida.', error instanceof Error ? error.message : String(error));
    }
  }

  private cachedPoints: MapPoint[] | null = null;
  private lastRetrievedAt: string | null = null;
  private lastCheckedAt: string | null = null;
  private mode: CnesDataMode | null = null;
  private lastLiveError: string | null = null;

  get dataMode(): CnesDataMode | null {
    return this.mode;
  }

  get liveError(): string | null {
    return this.lastLiveError;
  }

  private async fetchLivePoints(): Promise<MapPoint[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const retrievedAt = new Date().toISOString();

    try {
      const records: CnesDatasetRecord[] = [];
      let total: number | null = null;
      // Bound the whole collection with one timeout and a finite row budget.
      do {
        const response = await fetch(buildCnesDatastoreUrl(200, records.length), {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(`CNES/SES-GO respondeu HTTP ${response.status}`);
        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.toLowerCase().includes('json')) {
          throw new Error(`CNES/SES-GO retornou conteúdo inesperado (${contentType || 'sem content-type'})`);
        }
        const payload = (await response.json()) as CkanDatastoreResponse;
        const page = payload.result?.records;
        const pageTotal = payload.result?.total;
        if (!payload.success || !Array.isArray(page) || !Number.isInteger(pageTotal) || pageTotal! < 0 || pageTotal! > 10_000) {
          throw new Error('Resposta inválida do DataStore CNES/SES-GO');
        }
        if (total !== null && total !== pageTotal) {
          throw new Error('Total CNES mudou durante a coleta; snapshot parcial descartado');
        }
        total = pageTotal!;
        if (page.length === 0 && records.length < total) {
          throw new Error('Paginação CNES incompleta; snapshot parcial descartado');
        }
        records.push(...page);
        if (records.length > total) throw new Error('Contagem CNES inconsistente');
      } while (records.length < total);

      const points = records
        .map((record) => mapCnesRecordToPoint(record, retrievedAt))
        .filter((point): point is MapPoint => point !== null);
      if (points.length === 0) {
        throw new Error('Fonte CNES/SES-GO não retornou pontos georreferenciados de Planaltina');
      }

      await this.preserveSnapshot(records, retrievedAt);
      this.mode = 'live';
      this.lastRetrievedAt = retrievedAt;
      this.lastLiveError = null;
      return points;
    } finally {
      clearTimeout(timeout);
    }
  }

  async fetchPoints(): Promise<MapPoint[]> {
    if (this.cachedPoints) return [...this.cachedPoints];

    this.lastCheckedAt = new Date().toISOString();
    try {
      this.cachedPoints = await this.fetchLivePoints();
      return [...this.cachedPoints];
    } catch (error: unknown) {
      this.lastLiveError = error instanceof Error ? error.message : String(error);
      const restored = await this.restoredSnapshot();
      if (restored) {
        this.mode = 'snapshot_fallback';
        this.cachedPoints = restored;
        return [...restored];
      }
      if (CNES_FALLBACK_POINTS.length === 0) throw error;

      this.mode = 'snapshot_fallback';
      this.lastRetrievedAt = CNES_FALLBACK_CAPTURED_AT;
      this.cachedPoints = CNES_FALLBACK_POINTS.map((point) => ({
        ...point,
        provenanceMeta: { ...point.provenanceMeta },
        tags: [...point.tags],
      }));
      return [...this.cachedPoints];
    }
  }

  async checkStatus(): Promise<SourceInfo> {
    try {
      const points = await this.fetchPoints();
      if (this.mode === 'snapshot_fallback') {
        return {
          id: this.id,
          name: this.name,
          agency: this.agency,
          municipalCode: this.municipalCode,
          url: this.url,
          status: 'snapshot_fallback',
          statusMessage: `${points.length} ponto de saúde real preservado no último snapshot verificado; a atualização ao vivo não respondeu nesta execução.`,
          license: points[0]?.provenanceMeta.license ?? this.license,
          retrievedAt: this.lastRetrievedAt,
          checkedAt: this.lastCheckedAt,
          verified: true,
          notes: `Fallback explícito: nenhum dado vazio substituiu o snapshot conhecido. Erro da atualização ao vivo: ${this.lastLiveError ?? 'não informado'}.`,
        };
      }

      return {
        id: this.id,
        name: this.name,
        agency: this.agency,
        municipalCode: this.municipalCode,
        url: this.url,
        status: 'connected',
        statusMessage: `${points.length} estabelecimentos de saúde georreferenciados carregados para Planaltina, Goiás.`,
        license: this.license,
        retrievedAt: this.lastRetrievedAt,
        checkedAt: this.lastCheckedAt ?? this.lastRetrievedAt,
        verified: true,
        notes:
          'Snapshot oficial estadual filtrado pelo código CNES/IBGE 521760. Telefones e e-mails da fonte não são replicados no mapa; registros sem coordenadas válidas são excluídos.',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        id: this.id,
        name: this.name,
        agency: this.agency,
        municipalCode: this.municipalCode,
        url: this.url,
        status: 'error',
        statusMessage: 'Não foi possível atualizar nem recuperar um snapshot CNES verificado.',
        license: this.license,
        retrievedAt: null,
        checkedAt: new Date().toISOString(),
        verified: false,
        notes: `Publicação bloqueada para esta fonte. Detalhe técnico: ${message}`,
      };
    }
  }
}
