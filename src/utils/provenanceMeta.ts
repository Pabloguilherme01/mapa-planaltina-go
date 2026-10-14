import { ProvenanceType, VerificationStatus } from '../types/index.ts';

export interface ProvenanceDisplayConfig {
  type: ProvenanceType;
  label: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  description: string;
  auditLevel: string;
}

export const PROVENANCE_CONFIG: Record<ProvenanceType, ProvenanceDisplayConfig> = {
  official: {
    type: 'official',
    label: 'Oficial',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    borderColor: 'border-emerald-300',
    description: 'Dados provenientes de órgãos públicos oficiais federais, estaduais (Goiás) ou municipais.',
    auditLevel: 'Base Institucional',
  },
  verified_open_data: {
    type: 'verified_open_data',
    label: 'Dado aberto verificado',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-900',
    borderColor: 'border-blue-300',
    description: 'Conjunto de dados abertos governamentais ou censitários com validação estrutural (ex: Censo IBGE 5217609).',
    auditLevel: 'Auditável',
  },
  community: {
    type: 'community',
    label: 'Comunidade',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-900',
    borderColor: 'border-orange-300',
    description: 'Registros colaborativos de munícipes e lideranças locais sujeitos a mediação.',
    auditLevel: 'Colaborativo',
  },
  demo: {
    type: 'demo',
    label: 'DEMO (Simulação)',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-950',
    borderColor: 'border-amber-400',
    description: 'Pontos sintéticos criados para prototipagem de interface e validação visual de Planaltina, Goiás. Sem valor cadastral ou de navegação.',
    auditLevel: 'Simulação Didática',
  },
};

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, { label: string; color: string }> = {
  verified: { label: 'Verificado', color: 'text-emerald-700' },
  unverified: { label: 'Não Verificado (DEMO)', color: 'text-amber-800' },
  pending: { label: 'Verificação Pendente', color: 'text-slate-600' },
  synthetic_demo: { label: 'Sintético DEMO', color: 'text-rose-700' },
};
