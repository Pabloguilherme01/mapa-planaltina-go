import React, { useState } from 'react';
import { MapPoint, PointCategory, ProvenanceType } from '../../types/index.ts';
import { CategoryFilterBar } from '../Filters/CategoryFilterBar.tsx';
import { CATEGORY_CONFIG } from '../../utils/categoryMeta.ts';
import { PROVENANCE_CONFIG } from '../../utils/provenanceMeta.ts';
import {
  Search,
  X,
  SlidersHorizontal,
  Info,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

interface DesktopSidebarProps {
  points: MapPoint[];
  selectedPoint: MapPoint | null;
  onSelectPoint: (point: MapPoint | null) => void;
  onOpenPointDetails: (point: MapPoint) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategories: PointCategory[];
  onToggleCategory: (cat: PointCategory) => void;
  onSelectAllCategories: () => void;
  categoryCounts: Record<string, number>;
  selectedProvenance: ProvenanceType | 'all';
  onSelectProvenance: (prov: ProvenanceType | 'all') => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  points,
  selectedPoint,
  onSelectPoint,
  onOpenPointDetails,
  searchQuery,
  onSearchChange,
  selectedCategories,
  onToggleCategory,
  onSelectAllCategories,
  categoryCounts,
  selectedProvenance,
  onSelectProvenance,
  isLoading,
  isError,
  onRetry,
}) => {
  // Test preview state switch from Stitch prototype
  const [simulatedState, setSimulatedState] = useState<'normal' | 'skeleton' | 'empty' | 'error'>('normal');

  const activeLoading = isLoading || simulatedState === 'skeleton';
  const activeError = isError || simulatedState === 'error';
  const effectivePoints = simulatedState === 'empty' ? [] : points;

  return (
    <aside
      className="w-full lg:w-[420px] shrink-0 h-full flex flex-col bg-[#F5F0E6] shadow-xl z-20 overflow-hidden border-r border-[#355E3B]/10 font-sans"
      aria-label="Painel de busca e catálogo de pontos demonstrativos"
    >
      {/* Header & Search Bar */}
      <div className="p-4 bg-[#EAE3D2] flex flex-col gap-3 border-b border-[#355E3B]/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#355E3B] animate-pulse"></span>
            <span className="text-xs uppercase tracking-wider text-[#121E14] font-extrabold">
              Base Territorial Viva
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-white/70 text-[#424941] text-[11px] font-bold">
            Planaltina, Goiás • IBGE 5217609
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <label htmlFor="search-input" className="sr-only">
            Buscar locais, órgãos e serviços em Planaltina, Goiás
          </label>
          <div className="relative flex items-center bg-white rounded-xl shadow-sm border border-neutral-300 focus-within:border-[#BA623D] transition-colors">
            <Search size={18} className="text-neutral-400 ml-3 shrink-0" />
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar UBS, escola, bairro ou ponto..."
              className="w-full py-2.5 px-3 bg-transparent text-sm text-[#121E14] placeholder:text-neutral-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 mr-2"
                title="Limpar busca"
              >
                <X size={16} />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 text-[10px] mr-3 font-mono">
              Ctrl+K
            </kbd>
          </div>
        </div>

        {/* Category Filter Chips Bar */}
        <CategoryFilterBar
          selectedCategories={selectedCategories}
          onToggleCategory={onToggleCategory}
          onSelectAll={onSelectAllCategories}
          categoryCounts={categoryCounts}
        />

        {/* Provenance Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide shrink-0 mr-1 flex items-center gap-0.5">
            <ShieldCheck size={12} />
            Origem:
          </span>
          <button
            type="button"
            onClick={() => onSelectProvenance('all')}
            className={`touch-target px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
              selectedProvenance === 'all'
                ? 'bg-[#355E3B] text-white shadow-sm'
                : 'bg-white/80 text-neutral-700 hover:bg-white'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => onSelectProvenance('demo')}
            className={`touch-target px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
              selectedProvenance === 'demo'
                ? 'bg-[#E5B744] text-[#121E14] shadow-sm font-extrabold'
                : 'bg-white/80 text-neutral-700 hover:bg-white'
            }`}
          >
            DEMO
          </button>
          <button
            type="button"
            onClick={() => onSelectProvenance('verified_open_data')}
            className={`touch-target px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
              selectedProvenance === 'verified_open_data'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-white/80 text-neutral-700 hover:bg-white'
            }`}
          >
            Dado aberto verificado
          </button>
        </div>

        {/* UX States Simulator (Stitch Reference) */}
        <div className="p-2 rounded-lg bg-white/60 border border-neutral-200/80 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-neutral-700 font-bold flex items-center gap-1">
              <SlidersHorizontal size={12} />
              Estados da Interface (Stitch):
            </span>
            <span className="text-[#BA623D] font-semibold">Simulação UI</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {(['normal', 'skeleton', 'empty', 'error'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSimulatedState(st)}
                className={`py-1 px-1 rounded text-center text-[10px] font-bold uppercase transition-all ${
                  simulatedState === st
                    ? 'bg-[#355E3B] text-white shadow-sm'
                    : 'bg-white text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Header with Live Region */}
      <div className="px-4 py-2 bg-white/40 border-b border-neutral-200/60 flex items-center justify-between text-xs">
        <span
          aria-live="polite"
          className="font-bold text-neutral-800"
        >
          {activeLoading
            ? 'Carregando pontos...'
            : `${effectivePoints.length} pontos demonstrativos em Planaltina, Goiás`}
        </span>
        <span className="text-[11px] font-semibold text-[#BA623D]">
          Modo Demonstrativo
        </span>
      </div>

      {/* Scrollable Points List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {/* Loading State / Skeleton */}
        {activeLoading && (
          <div className="flex flex-col gap-3" aria-busy="true">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white shadow-sm animate-pulse flex flex-col gap-2 border border-neutral-200"
              >
                <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
                <div className="h-5 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                <div className="h-9 bg-neutral-200 rounded-xl mt-2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!activeLoading && activeError && (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center flex flex-col items-center gap-3">
            <AlertTriangle size={36} className="text-rose-600" />
            <h4 className="text-sm font-bold text-rose-900 font-sans">
              Erro ao carregar dados cartográficos
            </h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              Não foi possível sincronizar o catálogo de pontos de Planaltina, Goiás. Verifique sua conexão.
            </p>
            <button
              type="button"
              onClick={() => {
                setSimulatedState('normal');
                onRetry();
              }}
              className="touch-target px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-rose-800"
            >
              <RotateCcw size={14} />
              <span>Tentar novamente</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!activeLoading && !activeError && effectivePoints.length === 0 && (
          <div className="p-8 rounded-2xl bg-white border border-neutral-200 text-center flex flex-col items-center gap-3">
            <Info size={36} className="text-neutral-400" />
            <h4 className="text-sm font-bold text-[#121E14]">
              Nenhum ponto encontrado
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Não encontramos resultados para sua busca ou combinação de filtros no catálogo demonstrativo de Planaltina, Goiás.
            </p>
            <button
              type="button"
              onClick={() => {
                setSimulatedState('normal');
                onSearchChange('');
                onSelectAllCategories();
                onSelectProvenance('all');
              }}
              className="touch-target px-4 py-2 rounded-xl bg-[#355E3B] text-white text-xs font-bold shadow hover:bg-[#27472c]"
            >
              Limpar busca e filtros
            </button>
          </div>
        )}

        {/* Normal List */}
        {!activeLoading && !activeError && effectivePoints.map((point) => {
          const isSelected = selectedPoint?.id === point.id;
          const catConfig = CATEGORY_CONFIG[point.category];
          const provConfig = PROVENANCE_CONFIG[point.provenanceMeta.provenance];
          const IconComp = catConfig.icon;

          return (
            <article
              key={point.id}
              className={`p-4 rounded-2xl bg-white shadow-sm transition-all border ${
                isSelected
                  ? 'border-[#BA623D] ring-2 ring-[#BA623D]/20 shadow-md'
                  : 'border-neutral-200/80 hover:border-neutral-300 hover:shadow'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className={`p-2 rounded-xl ${catConfig.badgeBg} ${catConfig.color}`}>
                    <IconComp size={20} />
                  </span>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#BA623D] font-extrabold">
                      {point.category} • {point.zone}
                    </span>
                    <h3 className="text-sm font-bold text-[#121E14] leading-tight mt-0.5">
                      {point.name}
                    </h3>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF9E6] text-[#78350F] text-[10px] font-extrabold uppercase border border-[#E5B744]/40 shrink-0">
                  DEMO
                </span>
              </div>

              {/* Disclaimer Warning Box */}
              <div className="mt-2.5 p-2 rounded-xl bg-amber-50/80 border border-amber-200/60 flex items-start gap-1.5 text-xs text-[#78350F]">
                <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-700" />
                <p className="leading-tight text-[11px]">
                  Horários, telefone e endereço não verificados (dados fictícios para ilustração de Planaltina, Goiás).
                </p>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center justify-between text-xs pt-2 text-neutral-600">
                <span className="text-[11px] font-semibold text-neutral-500">
                  Proveniência: {provConfig.label}
                </span>

                <span className="flex items-center gap-1 font-bold text-[#355E3B] text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#355E3B]"></span>
                  Ponto DEMO
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onSelectPoint(point)}
                  className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl font-sans text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-[#355E3B] text-white shadow-sm'
                      : 'bg-neutral-100 text-[#121E14] hover:bg-neutral-200'
                  }`}
                >
                  {isSelected ? 'Centralizado no Mapa' : 'Ver no Mapa'}
                </button>

                <button
                  type="button"
                  onClick={() => onOpenPointDetails(point)}
                  className="touch-target px-3 py-2 rounded-xl bg-[#BA623D] text-white text-xs font-bold shadow-sm hover:bg-[#974724] active:scale-95 transition-all flex items-center justify-center gap-1"
                  title="Abrir ficha cadastral de procedência"
                >
                  <Info size={15} />
                  <span>Ficha</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-[#EAE3D2] border-t border-[#355E3B]/10 flex items-center justify-between text-[11px] text-neutral-600">
        <span>Planaltina, Goiás • Malha Conceitual</span>
        <span className="inline-flex items-center gap-1 font-bold text-[#355E3B]">
          <span className="w-2 h-2 rounded-full bg-[#355E3B]"></span>
          Base Carregada
        </span>
      </div>
    </aside>
  );
};
