import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ExternalLink, Landmark, MapPinOff } from 'lucide-react';
import type { PointCategory } from '../../types/index.ts';
import { browseCatalogResources, findCatalogResources } from '../../utils/catalogDiscovery.ts';
import { sitePath } from '../../utils/routing.ts';

export function DirectoryResults({ search, categories, browse = false }: {
  search: string; categories: PointCategory[]; browse?: boolean;
}) {
  const [visible, setVisible] = useState(8);
  const [group, setGroup] = useState<'all' | 'school' | 'fuel' | 'commercial' | 'digital'>('all');
  const matches = useMemo(() => search.trim()
    ? findCatalogResources(search, categories)
    : browse ? browseCatalogResources(categories) : [], [search, categories, browse]);
  useEffect(() => { setVisible(8); setGroup('all'); }, [search, categories, browse]);
  if ((!search.trim() && !browse) || matches.length === 0) return null;
  const categoriesCount = {
    all: matches.length,
    school: matches.filter(x => x.type === 'directory' && x.kind === 'school').length,
    fuel: matches.filter(x => x.type === 'directory' && x.kind === 'fuel').length,
    commercial: matches.filter(x => x.type === 'directory' && x.kind === 'commercial').length,
    digital: matches.filter(x => x.type === 'digital').length,
  };
  const listed = matches.filter(x => group === 'all' ||
    (group === 'digital' ? x.type === 'digital' : x.type === 'directory' && x.kind === group));
  const shown = listed.slice(0, visible);
  const digitalCount = matches.filter(x => x.type === 'digital').length;
  const documentaryCount = matches.length - digitalCount;
  return <section aria-label="Cadastros sem geolocalização"
    className="rounded-2xl border border-[#355E3B]/30 bg-white/95 p-3 text-neutral-900 shadow-sm">
    <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-[#355E3B]">
      <BookOpen size={16} aria-hidden="true" /> Catálogo complementar ({matches.length})
    </h3>
    <p className="mb-2 text-xs text-neutral-700">
      {documentaryCount} cadastros documentais sem coordenadas confirmadas e {digitalCount} serviços digitais.
      Não geramos pinos nem rotas para esses registros.
    </p>
    <div role="group" aria-label="Filtrar catálogo complementar"
      className="mb-2 flex flex-wrap gap-1.5">
      {([
        ['all', 'Todos'],
        ['school', 'Escolas'],
        ['fuel', 'Postos'],
        ['commercial', 'Comércio'],
        ['digital', 'Serviços digitais'],
      ] as const).map(([id, label]) => (
        <button key={id} type="button" aria-pressed={group === id}
          onClick={() => { setGroup(id); setVisible(8); }}
          className={`touch-target rounded-lg border px-2 text-[11px] font-bold
            ${group === id ? 'bg-[#355E3B] text-white' : 'border-neutral-300 text-[#355E3B]'}`}>
          {label} ({categoriesCount[id]})
        </button>
      ))}
    </div>
    <ul className="space-y-2">
      {listed.length === 0 && <li className="text-xs text-neutral-600">Nenhum registro nesta categoria. Experimente Todos.</li>}
      {shown.map(item => <li key={item.id}
        className="rounded-xl border border-neutral-200 bg-[#F5F0E6] px-3 py-2">
        <div className="flex items-start gap-2">
          {item.type === 'digital'
            ? <Landmark size={16} className="mt-0.5 shrink-0 text-[#355E3B]" aria-hidden="true"/>
            : <MapPinOff size={16} className="mt-0.5 shrink-0 text-orange-800" aria-hidden="true"/>}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#121E14]">{item.name}</p>
            <p className="mt-0.5 text-[11px] text-neutral-700">
              {item.type === 'directory'
                ? `${item.address}${item.district ? ' · ' + item.district : ''}`
                : item.description}
            </p>
            <p className="mt-1 text-[11px] text-neutral-600">{item.reference}</p>
            <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="mt-1 inline-flex min-h-11 items-center gap-1 text-xs font-bold text-[#355E3B] underline">
              <ExternalLink size={13} aria-hidden="true"/>
              {item.type === 'digital' ? 'Abrir serviço oficial' : 'Consultar fonte'}
            </a>
          </div>
        </div>
      </li>)}
    </ul>
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {listed.length > shown.length && <button className="touch-target rounded-lg border border-neutral-400 px-3 text-xs font-bold"
        type="button" onClick={() => setVisible(v => Math.min(v + 8, listed.length))}>
          Mostrar mais registros
        </button>}
      <span className="text-[11px] text-neutral-600" role="status">Mostrando {shown.length} de {listed.length}</span>
      <a className="touch-target inline-flex items-center gap-1 rounded-lg border border-neutral-400 px-2 text-xs font-bold"
        href={sitePath('/fontes', import.meta.env.BASE_URL)}>
        <MapPinOff size={14} /> Ver cadastros por fonte
      </a>
    </div>
  </section>;
}
