import { useState } from 'react';
import { SCHOOL_REGISTRY } from '../../data/schoolRegistry.ts';

export function SchoolRegistrySection() {
  const [query, setQuery] = useState('');
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const schools = SCHOOL_REGISTRY.items.filter(item => normalize(`${item.code} ${item.name} ${item.district}`).includes(normalize(query)));
  return <section className="my-6 rounded-2xl border border-neutral-200 bg-white p-5" aria-labelledby="schools-title">
    <h2 id="schools-title" className="text-lg font-bold">Educação — cadastro oficial SEDUC</h2>
    <p className="my-2 text-sm">{SCHOOL_REGISTRY.items.length} escolas na referência {SCHOOL_REGISTRY.referenceYear}. O arquivo não fornece coordenadas: estes registros não são pins nem confirmação de funcionamento atual.</p>
    <p className="text-xs">Licença: {SCHOOL_REGISTRY.license}. Coleta: {new Date(SCHOOL_REGISTRY.retrievedAt).toLocaleDateString('pt-BR')}.</p>
    <a className="inline-flex min-h-11 items-center underline" href={SCHOOL_REGISTRY.sourceUrl} target="_blank" rel="noreferrer">Consultar fonte e arquivo original</a>
    <label className="block text-sm font-bold" htmlFor="school-search">Buscar escola por nome, código ou bairro</label>
    <input id="school-search" value={query} onChange={event => setQuery(event.target.value)} className="my-2 min-h-11 w-full rounded-lg border border-neutral-400 p-3" />
    <p role="status" className="text-xs">{schools.length} registros encontrados</p>
    <ul className="mt-3 max-h-96 overflow-y-auto divide-y divide-neutral-200">
      {schools.map(item => <li key={item.code} className="py-3 text-sm"><strong>{item.name}</strong><p>Código {item.code} • {item.network} • {item.zone}</p><p>{item.address} — {item.district}</p></li>)}
    </ul>
  </section>;
}
