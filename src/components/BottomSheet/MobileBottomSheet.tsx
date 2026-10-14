import React, { useState } from 'react';
import { MapPoint, PointCategory } from '../../types/index.ts';
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
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const realCount = points.filter((point) => !point.isDemo).length;

  return (
    <div
      id="bottomSheet"
      role="region"
      aria-label="Busca e lista do catálogo territorial"
      className={`lg:hidden fixed bottom-16 inset-x-0 z-30 bg-white rounded-t-3xl shadow-[0_-8px_24px_rgba(30,43,32,0.12)] border-t border-neutral-200 transition-all duration-300 ease-in-out px-3 pt-1.5 pb-2 flex flex-col ${
        isExpanded ? 'h-[75vh]' : 'h-[230px]'
      }`}
    >
      <button
        type="button"
        aria-label="Expandir ou recolher lista de pontos"
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
              Planaltina, Goiás • {realCount} reais verificados
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
        {points.length === 0 ? (
          <div className="p-4 bg-neutral-50 rounded-xl text-center text-xs text-neutral-500">
            Nenhum ponto encontrado com os filtros atuais.
          </div>
        ) : (
          points.map((point) => {
            const catConfig = CATEGORY_CONFIG[point.category];
            const IconComponent = catConfig.icon;
            const isSelected = selectedPoint?.id === point.id;
            const isReal = !point.isDemo;

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
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border inline-flex items-center gap-0.5 ${isReal ? 'bg-emerald-100 text-emerald-900 border-emerald-200' : 'bg-[#FFF9E6] text-[#78350F] border-[#E5B744]/40'}`}>
                    {isReal && <BadgeCheck size={9} />}
                    {isReal ? 'REAL' : 'DEMO'}
                  </span>
                </div>

                <div className={`rounded-lg p-1.5 flex items-start gap-1 ${isReal ? 'bg-emerald-50 text-emerald-950' : 'bg-[#FFF4DC] text-[#78350F]'}`}>
                  {isReal ? <BadgeCheck size={12} className="shrink-0 mt-0.5 text-emerald-700" /> : <AlertTriangle size={12} className="shrink-0 mt-0.5 text-amber-700" />}
                  <p className="text-[10px] leading-tight">
                    {isReal
                      ? 'Coordenadas da fonte. Confirme atendimento antes do deslocamento.'
                      : 'Ilustrativo. Não use para deslocamento em Planaltina, Goiás.'}
                  </p>
                </div>

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
      </div>
    </div>
  );
};
