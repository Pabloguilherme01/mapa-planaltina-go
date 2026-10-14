import React, { useEffect, useState } from 'react';
import { SourceInfo } from '../types/index.ts';
import { fetchSources } from '../services/apiClient.ts';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Building2,
  FileCheck,
  HelpCircle,
  Clock,
  Info,
} from 'lucide-react';

interface SourcesPageProps {
  onBackToMap: () => void;
}

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
      {/* Navigation & Header */}
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

      {/* Institutional Warning Banner */}
      <div className="bg-[#FFF4DC] border border-[#E5B744]/70 p-4 rounded-2xl mb-6 shadow-sm flex items-start gap-3 text-[#78350F]">
        <HelpCircle size={22} className="text-[#BA623D] shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-extrabold text-[#78350F] text-sm mb-1">
            Ressalva Institucional de Origem & Verificação:
          </p>
          <p className="mb-1">
            A indicação de repositório governamental não implica verificação oficial de horários, telefones, condições de tráfego ou endereços físicos para deslocamento.
          </p>
          <p>
            Todos os pontos de serviços desta versão são <strong>DEMO (simulação ilustrativa)</strong>. A consulta ao IBGE serve <strong>exclusivamente à identificação municipal</strong>, sem cadastrar pontos ou malha oficial. No GitHub Pages, o resultado corresponde à data de consulta registrada na publicação; não representa uma conexão contínua.
          </p>
        </div>
      </div>

      {/* 4 Provenance Levels */}
      <div className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#355E3B] mb-3">
          Classificação Metodológica dos 4 Níveis de Procedência
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 1. Oficial */}
          <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#355E3B] flex items-center gap-2">
                <Building2 size={16} />
                1. Oficial
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-extrabold uppercase">
                Base Institucional
              </span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Registros oriundos de órgãos públicos do Estado de Goiás ou da Prefeitura de Planaltina, Goiás. Requer homologação técnica de vigência.
            </p>
          </div>

          {/* 2. Dado aberto verificado */}
          <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-blue-900 flex items-center gap-2">
                <FileCheck size={16} />
                2. Dado aberto verificado
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-extrabold uppercase">
                Auditável
              </span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Bases públicas auditáveis validadas por código censitário oficial (ex: API IBGE 5217609 validada para Planaltina, Goiás).
            </p>
          </div>

          {/* 3. Comunidade */}
          <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#BA623D] flex items-center gap-2">
                <ExternalLink size={16} />
                3. Comunidade
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#BA623D] text-[10px] font-extrabold uppercase">
                Colaborativo
              </span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Feições colaborativas alimentadas por moradores e entidades da sociedade civil, pendentes de curadoria municipal.
            </p>
          </div>

          {/* 4. DEMO (Atual) */}
          <div className="p-4 rounded-2xl bg-[#FFF9E6] border border-[#E5B744]/70 shadow-sm flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#78350F] flex items-center gap-2">
                <AlertCircle size={16} />
                4. DEMO (Simulação Vigente)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#E5B744] text-[#121E14] text-[10px] font-extrabold uppercase">
                Simulação
              </span>
            </div>
            <p className="text-xs text-neutral-700 leading-relaxed">
              Pontos sintéticos criados para homologação da ergonomia do mapa. <strong>Totalmente desprovidos de validade cadastral para deslocamento.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Real Adapter Status Inspection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#355E3B]">
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
          <div className="p-8 bg-white rounded-2xl border border-neutral-200 text-center text-xs text-neutral-500 animate-pulse">
            Verificando adaptadores municipais...
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-800">
            {error}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sources.map((src) => (
              <div
                key={src.id}
                className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[#121E14]">{src.name}</h3>
                      {src.verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <CheckCircle2 size={12} />
                          Identificação Ativa
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

                <p className="text-xs text-neutral-700 leading-relaxed">
                  {src.statusMessage}
                </p>

                <div className="p-2.5 rounded-xl bg-[#F5F0E6] text-[11px] text-neutral-600 flex items-start gap-1.5">
                  <Info size={14} className="text-[#355E3B] shrink-0 mt-0.5" />
                  <span>{src.notes}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-neutral-500 font-medium border-t border-neutral-100">
                  <span>Licença: <strong className="text-neutral-700">{src.license}</strong></span>
                  <span>•</span>
                  <span>
                    Data da consulta:{' '}
                    {src.retrievedAt ? (
                      <strong className="text-neutral-700">
                        {new Date(src.retrievedAt).toLocaleDateString('pt-BR')}
                      </strong>
                    ) : (
                      <span className="italic text-neutral-400">Pendente (não configurado)</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
