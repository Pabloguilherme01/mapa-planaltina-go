import { useMemo, useState } from 'react';
import { BookOpen, ExternalLink, MapPinOff } from 'lucide-react';
import type { PointCategory } from '../../types/index.ts';
import { searchDirectoryEntries } from '../../utils/unlocatedRegistry.ts';
import { sitePath } from '../../utils/routing.ts';

export function DirectoryResults({ search, categories }: { search: string; categories: PointCategory[] }) {
  const [showAll, setShowAll] = useState(false);
  const matches = useMemo(() => searchDirectoryEntries(search, categories), [search, categories]);
  if (!search.trim() || matches.length === 0) return null;
  const shown = matches.slice(0, showAll ? 24 : 5);
  return <section aria-label="Cadastros sem geolocalização"
    className="rounded-xl border border-[#355E3B]/30 bg-white/95 p-3 text-neutral-900 shadow-sm">
    <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-[#355E3B]">
      <BookOpen size={16} aria-hidden="true" /> Cadastros complementares ({matches.length})
    </h3>
    <p className="mb-2 text-xs text-neutral-700">
      Escolas SEDUC, postos ANP e comércio com endereço documental, mas sem coordenadas confirmadas.
      Não geramos pinos nem rotas para esses registros.
    </p>
    <ul className="space-y-2">
      {shown.map(item => <li key={item.id}
        className="rounded-xl border border-neutral-200 bg-[#F5F0E6] px-3 py-2">
        <p className="text-xs font-bold text-[#121E14]">{item.name}</p>
        <p className="mt-0.5 text-[11px] text-neutral-700">{item.address}{item.district ? ' · ' + item.district : ''}</p>
        <p className="mt-1 text-[11px] text-neutral-600">{item.reference}</p>
        <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
          className="mt-1 inline-flex min-h-11 items-center gap-1 text-xs font-bold text-[#355E3B] underline">
          <ExternalLink size={13} aria-hidden="true"/> Consultar fonte
        </a>
      </li>)}
    </ul>
    <div className="mt-2 flex flex-wrap gap-2">
      {matches.length > shown.length && <button className="touch-target rounded-lg border border-neutral-400 px-2 text-xs font-bold"
        type="button" onClick={() => setShowAll(true)}>Mostrar mais registros</button>}
      {matches.length > 24 && showAll && <p className="text-xs">Exibindo 24. Refine a pesquisa para localizar outros registros.</p>}
      <a className="touch-target inline-flex items-center gap-1 rounded-lg border border-neutral-400 px-2 text-xs font-bold"
        href={sitePath('/fontes', import.meta.env.BASE_URL)}>
        <MapPinOff size={14} /> Ver cadastros por fonte
      </a>
    </div>
  </section>;
}
