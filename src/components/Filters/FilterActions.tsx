import { RotateCcw, Share2, SlidersHorizontal } from 'lucide-react';

export function FilterActions({ count, resultCount, onClear, onCopy, feedback }: {
  count: number; resultCount: number;
  onClear: () => void; onCopy: () => void; feedback?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#355E3B]/20 bg-white/70 p-2 text-xs"
      aria-label="Resumo dos filtros">
      <span className="inline-flex items-center gap-1 font-bold text-[#355E3B]">
        <SlidersHorizontal size={14} aria-hidden="true" />
        {resultCount} locais
        {count > 0 && <span className="rounded-full bg-[#355E3B] px-1.5 py-0.5 text-[10px] text-white">{count} filtro{count === 1 ? '' : 's'}</span>}
      </span>
      <span className="flex-1" />
      {count > 0 && <button type="button" onClick={onClear}
        className="touch-target inline-flex items-center gap-1 rounded-lg border border-neutral-300 px-2 py-1 font-bold"
        aria-label="Limpar todos os filtros">
        <RotateCcw size={14} /> Limpar
      </button>}
      <button type="button" onClick={onCopy}
        className="touch-target inline-flex items-center gap-1 rounded-lg border border-neutral-300 px-2 py-1 font-bold"
        aria-label="Compartilhar filtros do mapa">
        <Share2 size={14} /> Compartilhar
      </button>
      {feedback && <span role="status" className="w-full text-[11px] text-[#355E3B]">{feedback}</span>}
    </div>
  );
}
