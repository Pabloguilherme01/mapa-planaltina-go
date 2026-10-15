import { useState } from 'react';
import { SCHOOL_REGISTRY } from '../../data/schoolRegistry.ts';
import { downloadText, filterSchools, schoolCsv } from '../../utils/registryTools';

export function SchoolRegistrySection() {
  const [query, setQuery] = useState('');
  const [network, setNetwork] = useState('');
  const [zone, setZone] = useState('');
  const schools = filterSchools(SCHOOL_REGISTRY.items, query, network, zone);
  return <section className="my-6 rounded-2xl border border-neutral-200 bg-white p-5" aria-labelledby="schools-title">
    <h2 id="schools-title" className="text-lg font-bold">Educação — cadastro oficial SEDUC</h2>
    <p className="my-2 text-sm">{SCHOOL_REGISTRY.items.length} escolas na referência {SCHOOL_REGISTRY.referenceYear}. O arquivo não fornece coordenadas: estes registros não são pins nem confirmação de funcionamento atual.</p>
    <p className="text-xs">Licença: {SCHOOL_REGISTRY.license}. Coleta: {new Date(SCHOOL_REGISTRY.retrievedAt).toLocaleDateString('pt-BR')}.</p>
    <a className="inline-flex min-h-11 items-center underline" href={SCHOOL_REGISTRY.sourceUrl} target="_blank" rel="noreferrer">Consultar fonte e arquivo original</a>
    <label className="block text-sm font-bold" htmlFor="school-search">Buscar escola por nome, código ou bairro</label>
    <input id="school-search" value={query} onChange={event => setQuery(event.target.value)} className="my-2 min-h-11 w-full rounded-lg border border-neutral-400 p-3" />
    <div className="my-2 grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-bold">Rede de ensino<select className="mt-1 min-h-11 w-full rounded-lg border border-neutral-400 bg-white p-2 font-normal" value={network} onChange={event => setNetwork(event.target.value)}><option value="">Todas as redes</option>{[...new Set(SCHOOL_REGISTRY.items.map(item => item.network))].sort().map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="text-sm font-bold">Zona da escola<select className="mt-1 min-h-11 w-full rounded-lg border border-neutral-400 bg-white p-2 font-normal" value={zone} onChange={event => setZone(event.target.value)}><option value="">Todas as zonas</option>{[...new Set(SCHOOL_REGISTRY.items.map(item => item.zone))].sort().map(value => <option key={value}>{value}</option>)}</select></label>
    </div>
    <div className="my-3 flex flex-wrap gap-2"><button type="button" className="min-h-11 rounded-lg border border-neutral-500 px-3 text-sm" onClick={() => { setQuery(''); setNetwork(''); setZone(''); }}>Limpar filtros escolares</button><button type="button" disabled={!schools.length} className="min-h-11 rounded-lg border border-neutral-500 px-3 text-sm disabled:opacity-50" onClick={() => downloadText('planaltina-escolas-filtradas.csv', schoolCsv(schools), 'text/csv;charset=utf-8')}>Baixar escolas filtradas (CSV)</button></div>
    <p role="status" className="text-xs">{schools.length === 1 ? '1 registro encontrado' : `${schools.length} registros encontrados`}</p>
    <ul tabIndex={0} aria-label="Resultados do cadastro escolar; use as setas para rolar" className="mt-3 max-h-96 overflow-y-auto divide-y divide-neutral-200 focus:outline-2 focus:outline-[#355E3B]">
      {schools.map(item => <li key={item.code} className="py-3 text-sm"><strong>{item.name}</strong><p>Código {item.code} • {item.network} • {item.zone}</p><p>{item.address} — {item.district}</p></li>)}
    </ul>
  </section>;
}
