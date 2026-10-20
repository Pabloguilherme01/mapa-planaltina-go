import { FilterActions } from '../Filters/FilterActions.tsx';
import type { CatalogSort, VerificationFilter } from '../../utils/catalogFilters.ts';
import React, { useState, useEffect } from 'react';
const DirectoryResults = React.lazy(() => import('../Sources/DirectoryResults.tsx')
  .then(module => ({ default: module.DirectoryResults })));
import { MapPoint, PointCategory, ProvenanceType } from '../../types/index.ts';
import { CATEGORY_CONFIG } from '../../utils/categoryMeta.ts';
import { CategoryFilterBar } from '../Filters/CategoryFilterBar.tsx';
import {
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Eye,
  Search,
  X,
  Building,
  BadgeCheck,
} from 'lucide-react';

interface MobileBottomSheetProps {
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
  onSelectProvenance: (value: ProvenanceType | 'all') => void;
  kindOptions: string[];
  selectedKind: string;
  onSelectKind: (value: string) => void;
  zoneOptions: string[];
  selectedZone: string;
  onSelectZone: (value: string) => void;
  verification: VerificationFilter;
  onVerificationChange: (value: VerificationFilter) => void;
  sort: CatalogSort;
  onSortChange: (value: CatalogSort) => void;
  radiusKm: number;
  onRadiusChange: (value: number) => void;
  hasLocation: boolean;
  activeFilterCount: number;
  onClearAllFilters: () => void;
  onShareFilters: () => void;
  shareFeedback: string;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
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
  kindOptions, selectedKind, onSelectKind, zoneOptions, selectedZone, onSelectZone,
  verification, onVerificationChange, sort, onSortChange, radiusKm, onRadiusChange, hasLocation, activeFilterCount, onClearAllFilters, onShareFilters, shareFeedback,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [browseDirectory, setBrowseDirectory] = useState(false);
  const realCount = points.filter((point) => !point.isDemo).length;
  const [visibleLimit, setVisibleLimit] = useState(60);
  useEffect(() => setVisibleLimit(60), [searchQuery, selectedCategories, selectedProvenance, selectedKind, selectedZone, verification, sort, radiusKm]);

  return (
    <div
      id="bottomSheet"
      role="region"
      aria-label="Busca e lista do catálogo territorial"
      className={`lg:hidden fixed bottom-16 inset-x-0 z-30 bg-white rounded-t-3xl shadow-[0_-8px_24px_rgba(30,43,32,0.12)] border-t border-neutral-200 transition-all duration-300 ease-in-out px-3 pt-1.5 pb-2 flex flex-col ${
        isExpanded ? 'h-[min(72dvh,720px)]' : 'h-[300px]'
      }`}
    >
      <button
        type="button"
        aria-label="Expandir ou recolher lista de pontos e filtros"
        aria-expanded={isExpanded}
        aria-controls="mobile-points-list"
        onClick={() => setIsExpanded(!isExpanded)}
        className="touch-target w-full h-7 -mt-1 flex flex-col items-center justify-center cursor-pointer active:opacity-60 shrink-0"
      >
        <span className="w-12 h-1.5 rounded-full bg-neutral-300" />
      </button>

      <div className="relative w-full mb-1.5 shrink-0">
        <label htmlFor="mobile-search-input" className="sr-only">
          Buscar pontos em Planaltina, Goiás
        </label>
        <div className="relative flex items-center bg-[#F5F0E6] rounded-xl border border-neutral-300 focus-within:border-[#355E3B] transition-colors">
          <Search size={16} className="text-neutral-500 ml-2.5 shrink-0" />
          <input
            id="mobile-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar pontos em Planaltina, Goiás..."
            className="w-full min-h-[44px] py-1.5 px-2 bg-transparent text-xs text-[#121E14] placeholder:text-neutral-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="touch-target p-1 text-neutral-400 hover:text-neutral-700 mr-2"
              title="Limpar busca"
              aria-label="Limpar busca"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-2 shrink-0">
        <CategoryFilterBar
          selectedCategories={selectedCategories}
          onToggleCategory={onToggleCategory}
          onSelectAll={onSelectAllCategories}
          categoryCounts={categoryCounts}
        />
      </div>
      <FilterActions count={activeFilterCount} resultCount={points.length}
          onClear={onClearAllFilters} onCopy={onShareFilters} feedback={shareFeedback} />
      {isExpanded && <div className="max-h-[36vh] overflow-y-auto rounded-xl border border-neutral-200 p-2 mb-2 shrink-0">
      <label className="mb-2 flex shrink-0 items-center gap-2 text-xs font-bold">Origem dos pontos
        <select value={selectedProvenance} onChange={event => onSelectProvenance(event.target.value as ProvenanceType | 'all')} className="min-h-11 min-w-0 flex-1 rounded-lg border border-neutral-400 bg-white px-2">
          <option value="all">Todas as origens</option><option value="official">Oficiais</option><option value="verified_open_data">Dados abertos verificados</option><option value="community">Comunidade</option><option value="demo">Somente DEMO</option>
        </select>
      </label>
      <section aria-label="Filtros avançados" className="mb-2 shrink-0 rounded-lg border border-neutral-200 p-1.5">
        <h3 className="mb-2 text-xs font-bold text-[#355E3B]">Filtros avançados · tipo, zona, confiança e raio</h3>
        <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] font-bold">Tipo
          <select aria-label="Tipo de estabelecimento" value={selectedKind} onChange={event => onSelectKind(event.target.value)} className="w-full min-h-11 border border-neutral-400 rounded-lg px-2 bg-white text-xs">
            <option value="">Todos os tipos</option>
            {kindOptions.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-[11px] font-bold">Zona
          <select aria-label="Zona do local" value={selectedZone} onChange={event => onSelectZone(event.target.value)} className="w-full min-h-11 border border-neutral-400 rounded-lg px-2 bg-white text-xs">
            <option value="">Todas as zonas</option>
            {zoneOptions.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        </div>
              <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-bold">Confiabilidade
            <select aria-label="Situação da verificação" value={verification}
              onChange={event => onVerificationChange(event.target.value as VerificationFilter)}
              className="mt-1 min-h-11 w-full rounded-lg border border-neutral-400 bg-white p-2 text-xs">
              <option value="all">Todos</option>
              <option value="verified">Oficialmente verificados</option>
              <option value="unverified">Colaborativos não verificados</option>
            </select>
          </label>
          <label className="text-xs font-bold">Ordenação
            <select aria-label="Ordenar resultados" value={sort}
              onChange={event => onSortChange(event.target.value as CatalogSort)}
              className="mt-1 min-h-11 w-full rounded-lg border border-neutral-400 bg-white p-2 text-xs">
              <option value="default">Padrão</option>
              <option value="name">Nome (A–Z)</option>
              <option value="nearest" disabled={!hasLocation}>Mais próximos de mim</option>
            </select>
          </label>
          <label className="col-span-2 text-xs font-bold">Raio de proximidade
            <select aria-label="Raio de proximidade" value={hasLocation ? radiusKm : 0}
              disabled={!hasLocation} onChange={event => onRadiusChange(Number(event.target.value))}
              className="mt-1 min-h-11 w-full rounded-lg border border-neutral-400 bg-white p-2 text-xs">
              <option value={0}>Toda Planaltina</option>
              <option value={1}>Até 1 km</option><option value={3}>Até 3 km</option>
              <option value={5}>Até 5 km</option><option value={10}>Até 10 km</option>
            </select>
          </label>
          {!hasLocation && <p className="col-span-2 text-[11px] text-neutral-600">Para ordenar por distância ou definir raio, use Perto de mim e permita o GPS.</p>}
        </div>
      </section>
      </div>}
              <button type="button" aria-pressed={browseDirectory}
          aria-label="Explorar cadastros e serviços sem localização"
          onClick={() => { setBrowseDirectory(current => !current); setIsExpanded(true); }}
          className="touch-target inline-flex items-center justify-center gap-2 rounded-xl border border-[#355E3B]/30 bg-white px-3 py-2 text-xs font-extrabold text-[#355E3B] shadow-sm">
          {browseDirectory ? 'Fechar catálogo complementar' : 'Explorar 101 cadastros e serviços'}
        </button>

      <div className="flex items-center justify-between mb-1.5 px-1 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-[#355E3B] flex items-center justify-center">
            <Building size={14} />
          </div>
          <div>
            <h2 id="mobile-results-heading" className="text-xs font-bold text-[#121E14] leading-tight">
              {points.length} pontos no catálogo
            </h2>
            <p className="text-[10px] text-neutral-500">
              Planaltina, Goiás • {realCount} locais reais mapeados
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="mobile-points-list"
          className="touch-target px-2.5 py-1 text-[#355E3B] text-xs font-bold flex items-center gap-1"
        >
          <span>{isExpanded ? 'Recolher' : 'Expandir lista'}</span>
          {isExpanded ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
        </button>
      </div>

      <div
        id="mobile-points-list"
        aria-labelledby="mobile-results-heading"
        className="overflow-y-auto flex flex-col gap-2 flex-1 pr-0.5"
      >
        {(searchQuery.trim() || browseDirectory) && <React.Suspense fallback={<p role="status" className="text-xs">Consultando cadastros e serviços…</p>}>
          <DirectoryResults search={searchQuery} categories={selectedCategories} browse={browseDirectory} />
        </React.Suspense>}
        {points.length === 0 ? (
          <div className="p-4 bg-neutral-50 rounded-xl text-center text-xs text-neutral-500">
            Nenhum ponto encontrado com os filtros atuais.
          </div>
        ) : (
          points.slice(0, visibleLimit).map((point) => {
            const catConfig = CATEGORY_CONFIG[point.category];
            const IconComponent = catConfig.icon;
            const isSelected = selectedPoint?.id === point.id;
            const isReal = !point.isDemo;
            const isVerified = point.provenanceMeta.verificationStatus === 'verified';

            return (
              <div
                key={point.id}
                className={`bg-[#F5F0E6] rounded-2xl p-2.5 flex flex-col gap-1.5 border transition-all ${
                  isSelected ? 'border-[#B05835] ring-1 ring-[#B05835]' : 'border-neutral-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-xl ${catConfig.badgeBg} ${catConfig.color} flex items-center justify-center shrink-0`}>
                      <IconComponent size={17} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-[#121E14] truncate">{point.name}</h3>
                      <p className="text-[10px] text-neutral-600">{point.category} • {point.zone}</p>
                    </div>
                  </div>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border inline-flex items-center gap-0.5 ${isVerified ? 'bg-emerald-100 text-emerald-900 border-emerald-200' : 'bg-orange-100 text-orange-900 border-orange-300'}`}>
                    {isVerified ? <BadgeCheck size={9} /> : <AlertTriangle size={9} />}
                    {isReal ? (point.provenanceMeta.verificationStatus === 'verified' ? 'REAL' : 'COLABORATIVO') : 'DEMO'}
                  </span>
                </div>

                {!isVerified && <div className="flex items-start gap-1 rounded-lg border border-orange-200 bg-orange-50 p-1.5 text-orange-900">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="text-[10px] leading-tight">
                    {isReal ? 'Cadastro comunitário não verificado. Confirme o local na fonte.' :
                      'Ilustrativo. Não use para deslocamento.'}
                  </p>
                </div>}

                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] text-neutral-500 font-semibold truncate max-w-[150px]">
                    {point.addressHint || 'Planaltina, Goiás'}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectPoint(point)}
                      className="touch-target px-2 py-1 rounded-lg bg-white text-[#121E14] text-[11px] font-bold border border-neutral-300 active:scale-95 transition-transform"
                    >
                      Focar
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenPointDetails(point)}
                      className="touch-target px-2 py-1 rounded-lg bg-[#B05835] text-white text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-transform"
                    >
                      <span>Ficha</span>
                      <Eye size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {points.length > visibleLimit && (
          <button type="button" onClick={() => setVisibleLimit(limit => limit + 60)}
            className="touch-target rounded-lg border border-[#355E3B]/30 bg-white p-3 text-xs font-bold text-[#355E3B]">
            Mostrar mais locais ({Math.min(visibleLimit, points.length)} de {points.length})
          </button>
        )}
      </div>
    </div>
  );
};
