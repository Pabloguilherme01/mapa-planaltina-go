import {
  AssistantRequestPayload,
  AssistantResponsePayload,
  MapPoint,
  MunicipalityOfficialInfo,
  PointCategory,
  ProvenanceType,
  SourceInfo,
} from '../types/index.ts';
import { staticAssistant } from './staticAssistant.ts';
import { resolveApiRouting } from './apiRoutingConfig.ts';

const { apiBase, staticMode } = resolveApiRouting(
  import.meta.env.VITE_STATIC_MODE,
  import.meta.env.VITE_API_BASE_URL
);
const endpoint = (name: string) => staticMode
  ? `${import.meta.env.BASE_URL}data/${name}.json`
  : `${apiBase}/api/${name}`;

export interface PointsResponse {
  success: boolean;
  data: MapPoint[];
  meta: {
    total: number;
    count: number;
    municipality: string;
    ibgeCode: string;
    mode: string;
    disclaimer: string;
  };
}

export interface SourcesResponse {
  success: boolean;
  data: SourceInfo[];
  meta: {
    municipalCode: string;
    verifiedCount: number;
    totalSources: number;
    policyNotice: string;
  };
}

export interface MunicipalityResponse {
  success: boolean;
  data: MunicipalityOfficialInfo;
}

export interface AssistantApiResponse {
  success: boolean;
  data: AssistantResponsePayload;
  error?: string;
}

export async function fetchMunicipality(): Promise<MunicipalityOfficialInfo> {
  const res = await fetch(endpoint('municipality'));
  if (!res.ok) {
    throw new Error(`Falha ao obter dados do município (HTTP ${res.status})`);
  }
  const json: MunicipalityResponse = await res.json();
  if (!json.success || !json.data) {
    throw new Error('Resposta inválida do serviço municipal.');
  }
  return json.data;
}

export async function fetchPoints(params?: {
  query?: string;
  categories?: PointCategory[];
  provenance?: ProvenanceType[];
  zone?: string;
}): Promise<PointsResponse> {
  const url = new URL(endpoint('points'), window.location.origin);
  if (params?.query) {
    url.searchParams.set('q', params.query);
  }
  if (params?.categories && params.categories.length > 0) {
    params.categories.forEach((cat) => url.searchParams.append('categories', cat));
  }
  if (params?.provenance && params.provenance.length > 0) {
    params.provenance.forEach((prov) => url.searchParams.append('provenance', prov));
  }
  if (params?.zone) {
    url.searchParams.set('zone', params.zone);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Falha ao listar pontos do mapa (HTTP ${res.status})`);
  }
  const json: PointsResponse = await res.json();
  if (!json.success || !json.data) {
    throw new Error('Falha ao processar catálogo de pontos.');
  }
  if (staticMode && params) {
    const normalized = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    json.data = json.data.filter((point) =>
      (!params.categories?.length || params.categories.includes(point.category))
      && (!params.provenance?.length || params.provenance.includes(point.provenanceMeta.provenance))
      && (!params.zone || params.zone === point.zone)
      && (!params.query || normalized([point.name, point.description, point.category, ...point.tags, point.addressHint || ''].join(' ')).includes(normalized(params.query))));
    json.meta = { ...json.meta, count: json.data.length, total: json.data.length };
  }
  return json;
}

export async function fetchSources(): Promise<SourcesResponse> {
  const res = await fetch(endpoint('sources'));
  if (!res.ok) {
    throw new Error(`Falha ao consultar fontes de dados (HTTP ${res.status})`);
  }
  const json: SourcesResponse = await res.json();
  if (!json.success || !json.data) {
    throw new Error('Falha ao processar fontes.');
  }
  return json;
}

export async function askAssistant(
  payload: AssistantRequestPayload
): Promise<AssistantResponsePayload> {
  if (staticMode) return staticAssistant(payload.message, (await fetchPoints()).data);
  const res = await fetch(endpoint('assistant'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error('Muitas perguntas em pouco tempo. Por favor, aguarde alguns segundos.');
    }
    const errJson = await res.json().catch(() => null);
    throw new Error(errJson?.error || `Erro no assistente (HTTP ${res.status})`);
  }

  const json: AssistantApiResponse = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || 'Erro inesperado na resposta do assistente.');
  }
  return json.data;
}
