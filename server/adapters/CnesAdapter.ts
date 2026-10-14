import { MapPoint, MUNICIPALITY_CODE, SourceInfo } from '../../src/types/index.ts';
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

export function buildCnesDatastoreUrl(limit = 200): string {
  const url = new URL(CNES_DATASTORE_URL);
  url.searchParams.set('resource_id', CNES_GOIAS_RESOURCE_ID);
  url.searchParams.set('limit', String(limit));
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

  const cnes = normalized(record.cnes);
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
 * Adaptador para o snapshot estadual do Cadastro Nacional de Estabelecimentos
 * de Saúde (CNES), publicado pela SES-GO no Portal de Dados Abertos de Goiás.
 */
export class CnesAdapter implements SourceAdapter {
  readonly id = 'cnes';
  readonly name = 'CNES - Estabelecimentos de Saúde de Goiás';
  readonly agency = 'Secretaria de Estado da Saúde de Goiás / CNES';
  readonly municipalCode = MUNICIPALITY_CODE;
  readonly url = CNES_GOIAS_RESOURCE_URL;
  readonly license = CNES_LICENSE_NOTICE;

  private cachedPoints: MapPoint[] | null = null;
  private lastRetrievedAt: string | null = null;

  async fetchPoints(): Promise<MapPoint[]> {
    if (this.cachedPoints) return [...this.cachedPoints];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const retrievedAt = new Date().toISOString();

    try {
      const response = await fetch(buildCnesDatastoreUrl(), {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`CNES/SES-GO respondeu HTTP ${response.status}`);
      }

      const payload = (await response.json()) as CkanDatastoreResponse;
      if (!payload.success || !Array.isArray(payload.result?.records)) {
        throw new Error('Resposta inválida do DataStore CNES/SES-GO');
      }

      const points = payload.result.records
        .map((record) => mapCnesRecordToPoint(record, retrievedAt))
        .filter((point): point is MapPoint => point !== null);

      if (points.length === 0) {
        throw new Error('Fonte CNES/SES-GO não retornou pontos georreferenciados de Planaltina');
      }

      this.cachedPoints = points;
      this.lastRetrievedAt = retrievedAt;
      return [...points];
    } finally {
      clearTimeout(timeout);
    }
  }

  async checkStatus(): Promise<SourceInfo> {
    try {
      const points = await this.fetchPoints();
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
        checkedAt: this.lastRetrievedAt,
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
        statusMessage: 'Não foi possível atualizar o snapshot CNES/SES-GO nesta execução.',
        license: this.license,
        retrievedAt: null,
        checkedAt: new Date().toISOString(),
        verified: false,
        notes: `A publicação deve preservar o último estado seguro ou bloquear a promoção de dados não verificados. Detalhe técnico: ${message}`,
      };
    }
  }
}
