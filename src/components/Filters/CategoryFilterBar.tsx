import React from 'react';
import { CATEGORIES_LIST, PointCategory } from '../../types/index.ts';
import { CATEGORY_CONFIG } from '../../utils/categoryMeta.ts';
import { LayoutGrid } from 'lucide-react';

interface CategoryFilterBarProps {
  selectedCategories: PointCategory[];
  onToggleCategory: (cat: PointCategory) => void;
  onSelectAll: () => void;
  categoryCounts?: Record<string, number>;
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  selectedCategories,
  onToggleCategory,
  onSelectAll,
  categoryCounts = {},
}) => {
  const isAllSelected = selectedCategories.length === 0 || selectedCategories.length === CATEGORIES_LIST.length;

  return (
    <div
      role="group"
      aria-label="Filtro de categorias cívicas de Planaltina, Goiás"
      className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar"
    >
      {/* "Todos" Chip */}
      <button
        type="button"
        onClick={onSelectAll}
        className={`shrink-0 touch-target min-h-[44px] px-3.5 rounded-full font-sans text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
          isAllSelected
            ? 'bg-[#355E3B] text-white shadow'
            : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
        }`}
        aria-pressed={isAllSelected}
      >
        <LayoutGrid size={16} />
        <span>Todos</span>
      </button>

      {/* 9 Category Chips */}
      {CATEGORIES_LIST.map((category) => {
        const config = CATEGORY_CONFIG[category];
        const isSelected = selectedCategories.includes(category);
        const IconComponent = config.icon;
        const count = categoryCounts[category] ?? 0;

        return (
          <button
            key={category}
            type="button"
            onClick={() => onToggleCategory(category)}
            className={`shrink-0 touch-target min-h-[44px] px-3.5 rounded-full font-sans text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isSelected
                ? 'bg-[#355E3B] text-white shadow-sm'
                : 'bg-white text-neutral-800 hover:bg-neutral-100 border border-neutral-200'
            }`}
            aria-pressed={isSelected}
          >
            <span className={isSelected ? 'text-white' : config.color}>
              <IconComponent size={16} />
            </span>
            <span>{category}</span>
            {count > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
