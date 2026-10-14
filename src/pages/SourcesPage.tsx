import React, { useEffect, useState } from 'react';
import { SourceInfo } from '../types/index.ts';
import { fetchSources } from '../services/apiClient.ts';
import { CommercialResearchSection } from '../components/Sources/CommercialResearchSection.tsx';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  HelpCircle,
  Info,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

interface SourcesPageProps {
  onBackToMap: () => void;
}

const provenanceCards = [
  {
    title: '1. Oficial',
    badge: 'Base Institucional',
    badgeClass: 'bg-emerald-100 text-emerald-900',
    titleClass: 'text-[#355E3B]',
    icon: Building2,
    description:
      'Registros oriundos de órgãos públicos do Estado de Goiás ou da Prefeitura de Planaltina, Goiás. Requer homologação técnica de vigência.',
  },
  {
    title: '2. Dado aberto verificado',
    badge: 'Auditável',
    badgeClass: 'bg-blue-100 text-blue-900',
    titleClass: 'text-blue-900',
    icon: FileCheck,
    description:
      'Bases públicas auditáveis validadas por código censitário oficial, como a API IBGE 5217609 para identificação do município.',
  },
  {
    title: '3. Comunidade',
    badge: 'Colaborativo',
    badgeClass: 'bg-orange-100 text-[#984E2E]',
    titleClass: 'text-[#984E2E]',
    icon: ExternalLink,
    description:
      'Feições e pesquisas colaborativas alimentadas por moradores e entidades da sociedade civil, sempre separadas de dados oficiais e sujeitas a curadoria.',
  },
  {
    title: '4. DEMO (Simulação Vigente)',
    badge: 'Simulação',
    badgeClass: 'bg-[#E5B744] text-[#121E14]',
    titleClass: 'text-[#78350F]',
    icon: AlertCircle,
    description:
      'Pontos sintéticos criados para homologação da ergonomia do mapa. Totalmente desprovidos de validade cadastral para deslocamento.',
  },
] as const;

export const SourcesPage: React.FC<SourcesPageProps> = ({ onBackToMap }) => {
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSources = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetchSources();
      setSources(resp.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao sincronizar fontes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#F5F0E6] text-[#121E14] font-sans pb-24 lg:pb-12 pt-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-3 mb-6">
        <button
          type="button"
          onClick={onBackToMap}
          className="touch-target w-fit px-4 py-2 rounded-xl bg-white text-[#355E3B] font-bold text-xs flex items-center gap-2 shadow-sm border border-neutral-200 hover:bg-neutral-50 active:scale-95 transition-all"
        >
          <ArrowLeft size={16} />
          <span>Voltar para o Mapa</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-emerald-100 text-[#355E3B]">
            <ShieldCheck size={28} />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#121E14] tracking-tight">
              Fontes & Transparência Territorial
            </h1>
            <p className="text-xs text-neutral-600 font-medium">
              Planaltina, Goiás • Código IBGE 5217609 • Rota /fontes
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#FFF4DC] border border-[#E5B744]/70 p-4 rounded-2xl mb-6 shadow-sm flex items-start gap-3 text-[#78350F]">
        <HelpCircle size={22} className="text-[#984E2E] shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-extrabold text-sm mb-1">Ressalva Institucional de Origem & Verificação:</p>
          <p className="mb-1">
            A indicação de repositório governamental ou listagem pública não implica verificação oficial de horários, telefones, condições de tráfego ou endereços físicos para deslocamento.
          </p>
          <p>
            Os pins do mapa continuam <strong>DEMO (simulação ilustrativa)</strong>. A nova pesquisa comercial aparece apenas nesta página de transparência até que exista geometria auditável e fonte adequada para publicação cartográfica.
          </p>
        </div>
      </div>

      <section aria-labelledby="provenance-title" className="mb-8">
        <h2 id="provenance-title" className="text-xs font-bold uppercase tracking-wider text-[#355E3B] mb-3">
          Classificação Metodológica dos 4 Níveis de Procedência
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {provenanceCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-sm font-bold flex items-center gap-2 ${card.titleClass}`}>
                    <Icon size={16} />
                    {card.title}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${card.badgeClass}`}>
                    {card.badge}
                  </span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">{card.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <CommercialResearchSection />

      <section aria-labelledby="adapter-status-title">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 id="adapter-status-title" className="text-xs font-bold uppercase tracking-wider text-[#355E3B]">
            Status Real dos Adaptadores de Dados (SourceAdapter)
          </h2>
          <button
            type="button"
            onClick={loadSources}
            className="touch-target text-xs text-[#355E3B] font-bold flex items-center gap-1.5 hover:underline"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Atualizar Conexões</span>
          </button>
        </div>

        {isLoading ? (
          <div role="status" className="p-8 bg-white rounded-2xl border border-neutral-200 text-center text-xs text-neutral-500 animate-pulse">
            Verificando adaptadores municipais...
          </div>
        ) : error ? (
          <div role="alert" className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-800">
            {error}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sources.map((src) => (
              <article key={src.id} className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm text-[#121E14]">{src.name}</h3>
                      {src.verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <CheckCircle2 size={12} /> Identificação Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-200 text-neutral-700 text-[10px] font-bold">
                          Não Configurado
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-500 font-medium">
                      {src.agency} • Código: {src.municipalCode}
                    </span>
                  </div>

                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="touch-target p-2 rounded-xl text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
                    title="Visitar link oficial"
                  >
                    <ExternalLink size={17} />
                  </a>
                </div>

                <p className="text-xs text-neutral-700 leading-relaxed">{src.statusMessage}</p>

                <div className="p-2.5 rounded-xl bg-[#F5F0E6] text-[11px] text-neutral-600 flex items-start gap-1.5">
                  <Info size={14} className="text-[#355E3B] shrink-0 mt-0.5" />
                  <span>{src.notes}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-neutral-500 font-medium border-t border-neutral-100">
                  <span>Licença: <strong className="text-neutral-700">{src.license}</strong></span>
                  <span aria-hidden="true">•</span>
                  <span>
                    Data da consulta:{' '}
                    {src.retrievedAt ? (
                      <strong className="text-neutral-700">{new Date(src.retrievedAt).toLocaleDateString('pt-BR')}</strong>
                    ) : (
                      <span className="italic text-neutral-400">Pendente (não configurado)</span>
                    )}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
