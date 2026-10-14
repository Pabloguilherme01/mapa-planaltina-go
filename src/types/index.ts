/**
 * Domain types for Mapa Planaltina GO (IBGE: 5217609)
 */

export const MUNICIPALITY_CODE = '5217609';
export const MUNICIPALITY_NAME = 'Planaltina';
export const MUNICIPALITY_UF = 'GO';

export const DEMO_DISCLAIMER_TEXT =
  'Modo demonstrativo — locais ilustrativos, não use para deslocamento.';

export const ORIGIN_DISCLAIMER_TEXT =
  'A indicação de origem ou repositório não implica verificação oficial de endereço, horário de atendimento ou condições de acesso.';

export type PointCategory =
  | 'Saúde'
  | 'Educação'
  | 'Transporte'
  | 'Segurança'
  | 'Serviços Públicos'
  | 'Comércio'
  | 'Lazer'
  | 'Meio Ambiente'
  | 'Rural';

export const CATEGORIES_LIST: PointCategory[] = [
  'Saúde',
  'Educação',
  'Transporte',
  'Segurança',
  'Serviços Públicos',
  'Comércio',
  'Lazer',
  'Meio Ambiente',
  'Rural',
];

export type ProvenanceType =
  | 'official'
  | 'verified_open_data'
  | 'community'
  | 'demo';

export type VerificationStatus =
  | 'verified'
  | 'unverified'
  | 'pending'
  | 'synthetic_demo';

export interface ProvenanceMetadata {
  provenance: ProvenanceType;
  sourceUrl?: string;
  sourceName: string;
  license: string;
  retrievedAt: string;
  verificationStatus: VerificationStatus;
  disclaimer: string;
}

export interface MapPoint {
  id: string;
  name: string;
  category: PointCategory;
  description: string;
  lat: number;
  lng: number;
  zone: 'Urbana' | 'Rural' | 'Distrital';
  isDemo: boolean;
  demoDisclaimer: string;
  provenanceMeta: ProvenanceMetadata;
  tags: string[];
  addressHint?: string;
}

export interface MunicipalityOfficialInfo {
  id: number;
  nome: string;
  microrregiao: {
    id: number;
    nome: string;
    mesorregiao: {
      id: number;
      nome: string;
      UF: {
        id: number;
        sigla: string;
        nome: string;
      };
    };
  };
  regiaoImediata?: {
    id: number;
    nome: string;
  };
  verified: boolean;
  officialSourceUrl: string;
  lastChecked: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  overviewNotes: string;
}

export type SourceConnectionStatus =
  | 'connected'
  | 'not_configured'
  | 'pending_integration'
  | 'error';

export interface SourceInfo {
  id: string;
  name: string;
  agency: string;
  municipalCode: string;
  url: string;
  status: SourceConnectionStatus;
  statusMessage: string;
  license: string;
  retrievedAt: string | null;
  checkedAt?: string | null;
  verified: boolean;
  notes: string;
}

export interface AssistantRequestPayload {
  message: string;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface AssistantResponsePayload {
  reply: string;
  evidenceIds: string[];
  foundInCorpus: boolean;
  isDemoNotice: string;
  modelUsed?: string;
  error?: string;
}
