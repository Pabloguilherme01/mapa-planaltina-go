import React, { useEffect, useState } from 'react';
import { SourceInfo } from '../../types/index.ts';
import { fetchSources } from '../../services/apiClient.ts';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Building2,
  HelpCircle,
  FileCheck,
} from 'lucide-react';

interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SourcesModal: React.FC<SourcesModalProps> = ({ isOpen, onClose }) => {
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
    if (isOpen) {
      loadSources();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fontesTitulo"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 font-sans animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-white rounded-3xl p-5 md:p-7 shadow-2xl flex flex-col gap-5 max-h-[88vh] overflow-y-auto border border-neutral-200">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-100 text-[#355E3B]">
              <ShieldCheck size={24} />
            </span>
            <div>
              <h2 id="fontesTitulo" className="text-lg font-bold text-[#121E14]">
                Fontes e Transparência Territorial
              </h2>
              <p className="text-xs text-neutral-500">
                Planaltina, Goiás • Código IBGE 5217609
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Fechar janela de fontes"
            onClick={onClose}
            className="touch-target w-10 h-10 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Institutional Resguardo Notice (Stitch reference) */}
        <div className="bg-[#FFF4DC] border border-[#E5B744]/60 p-3.5 rounded-2xl flex items-start gap-2.5 text-[#78350F]">
          <HelpCircle size={20} className="text-[#BA623D] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-[#78350F] mb-0.5">
              Ressalva Institucional & Integridade de Dados:
            </p>
            <p>
              Oficial não implica auditado. Nesta versão, todos os pontos interativos do Mapa Planaltina GO são classificados como <strong>DEMO (simulação ilustrativa)</strong>. A indicação de fonte não garante precisão de horários, telefones ou endereços para deslocamento físico.
            </p>
          </div>
        </div>

        {/* 4 Provenance Levels (as required by prompt and Stitch reference) */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#355E3B]">
            Classificação Metodológica de Procedência
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Oficial */}
            <div className="p-3 rounded-xl bg-[#F5F0E6] border border-neutral-200 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#355E3B] flex items-center gap-1.5">
                  <Building2 size={15} />
                  1. Oficial
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                  Base Institucional
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-tight">
                Dados diretos de órgãos públicos do Estado de Goiás ou da Prefeitura de Planaltina, Goiás. Requer checagem de vigência normativa.
              </p>
            </div>

            {/* 2. Dado aberto verificado */}
            <div className="p-3 rounded-xl bg-[#F5F0E6] border border-neutral-200 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <FileCheck size={15} />
                  2. Dado aberto verificado
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold">
                  Auditável
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-tight">
                Bases públicas abertas validadas programmaticamente (ex: API Censo e Localidades IBGE 5217609 com id e UF checados).
              </p>
            </div>

            {/* 3. Comunidade */}
            <div className="p-3 rounded-xl bg-[#F5F0E6] border border-neutral-200 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#BA623D] flex items-center gap-1.5">
                  <ExternalLink size={15} />
                  3. Comunidade
                </span>
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-[#BA623D] text-[10px] font-bold">
                  Colaborativo
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-tight">
                Registros voluntários de cidadãos e lideranças do Cerrado. Aguardando validação técnica cívica.
              </p>
            </div>

            {/* 4. DEMO (Atual) */}
            <div className="p-3 rounded-xl bg-[#FFF9E6] border border-[#E5B744]/60 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#78350F] flex items-center gap-1.5">
                  <AlertCircle size={15} />
                  4. DEMO (Simulação Vigente)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#E5B744] text-[#121E14] text-[10px] font-extrabold uppercase">
                  Simulação
                </span>
              </div>
              <p className="text-[11px] text-neutral-700 leading-tight">
                Pontos criados exclusivamente para validação de interface e usabilidade. <strong>Sem validade cadastral para deslocamento.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Real Status of Adapters (Live Connection State) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#355E3B]">
              Estado Real dos Adaptadores (SourceAdapter)
            </h3>
            <button
              type="button"
              onClick={loadSources}
              className="text-xs text-[#355E3B] font-semibold flex items-center gap-1 hover:underline"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Atualizar</span>
            </button>
          </div>

          {isLoading ? (
            <div className="p-6 bg-neutral-50 rounded-2xl text-center text-xs text-neutral-500 animate-pulse">
              Consultando adaptadores de dados...
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 rounded-xl text-xs text-rose-800">
              {error}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {sources.map((src) => (
                <div
                  key={src.id}
                  className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#121E14] text-sm">{src.name}</span>
                        {src.verified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <CheckCircle2 size={12} />
                            Verificado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700 text-[10px] font-bold">
                            {src.status === 'not_configured'
                              ? 'Não Configurado'
                              : 'Pendente'}
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
                      className="touch-target p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200"
                      title="Visitar link oficial"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>

                  <p className="text-[11px] text-[#424941] leading-relaxed">
                    {src.statusMessage}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-neutral-500 font-medium border-t border-neutral-200/60">
                    <span>Licença: {src.license}</span>
                    <span>•</span>
                    <span>Última consulta: {src.retrievedAt ? new Date(src.retrievedAt).toLocaleDateString('pt-BR') : 'Não consultado'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="touch-target w-full min-h-[44px] py-2.5 rounded-xl bg-[#355E3B] text-white font-sans text-xs font-bold shadow hover:bg-[#27472c] active:scale-95 transition-all"
        >
          Fechar Painel de Fontes
        </button>
      </div>
    </div>
  );
};
