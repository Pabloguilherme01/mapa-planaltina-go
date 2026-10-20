import { useMemo, useState } from 'react';
import { Building2, ExternalLink, Search, ShieldCheck } from 'lucide-react';
import { searchOfficialServices, type OfficialServiceGroup } from '../../data/officialServices.ts';

const groups: {id: OfficialServiceGroup; label: string}[] = [
  {id:'Cidadão',label:'Cidadão'}, {id:'Empresas',label:'Empresas e comércio'},
  {id:'Transparência',label:'Transparência'},
];
export function OfficialServicesSection() {
  const [group, setGroup] = useState<OfficialServiceGroup | undefined>(undefined);
  const [query, setQuery] = useState('');
  const services = useMemo(() => searchOfficialServices(query,group), [query,group]);
  return (
    <section id="servicos-municipais" aria-labelledby="municipal-services-title"
      className="my-6 rounded-2xl border border-[#355E3B]/20 bg-white p-4 shadow-sm sm:p-5">
      <header className="flex items-start gap-3">
        <span className="rounded-xl bg-emerald-100 p-2 text-[#355E3B]"><Building2 size={22}/></span>
        <div className="min-w-0">
          <h2 id="municipal-services-title" className="text-lg font-extrabold text-[#121E14]">
            Serviços digitais de Planaltina
          </h2>
          <p className="mt-1 text-xs text-neutral-700">
            Atalhos para a Prefeitura e sistemas indicados no portal oficial. Estes links abrem
            outros sites, podem exigir cadastro e dependem da disponibilidade de cada serviço.
          </p>
        </div>
      </header>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar serviços digitais">
        <button type="button" aria-pressed={!group} onClick={() => setGroup(undefined)}
          className={`touch-target rounded-xl border px-3 text-xs font-bold ${!group ? 'bg-[#355E3B] text-white' : 'border-neutral-300'}`}>Todos</button>
        {groups.map(option=><button type="button" key={option.id} aria-pressed={group===option.id}
          onClick={()=>setGroup(option.id)}
          className={`touch-target rounded-xl border px-3 text-xs font-bold ${group===option.id ? 'bg-[#355E3B] text-white' : 'border-neutral-300'}`}>{option.label}</button>)}
      </div>
      <label className="mt-3 flex min-h-11 items-center gap-2 rounded-xl border border-neutral-300 px-3">
        <Search size={16} aria-hidden="true"/>
        <span className="sr-only">Buscar serviços digitais municipais</span>
        <input type="search" value={query} onChange={event=>setQuery(event.target.value)}
          placeholder="Buscar IPTU, certidão, licitação..."
          className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
          aria-label="Buscar serviços digitais municipais"/>
      </label>
      <p className="my-2 text-xs text-neutral-600" role="status">{services.length} serviços encontrados</p>
      {services.length ? <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {services.map(service => <a key={service.id} href={service.url} target="_blank" rel="noopener noreferrer"
          className="group flex min-h-20 items-start gap-3 rounded-xl border border-neutral-200 bg-[#F5F0E6] p-3 hover:border-[#355E3B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#355E3B]">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#355E3B]" aria-hidden="true"/>
          <span className="min-w-0 flex-1">
            <strong className="block text-sm text-[#121E14]">{service.label}</strong>
            <span className="mt-1 block text-xs text-neutral-700">{service.description}</span>
            <span className="mt-1 block text-[11px] font-bold text-[#355E3B]">Acessar sistema externo</span>
          </span>
          <ExternalLink size={16} className="shrink-0 text-[#355E3B]" aria-hidden="true"/>
        </a>)}
      </div> : <p className="py-3 text-sm">Nenhum serviço encontrado. Experimente outro termo ou escolha Todos.</p>}
      <p className="mt-3 text-[11px] text-neutral-600">
        Fonte: <a href="https://planaltina.go.gov.br/" target="_blank" rel="noopener noreferrer" className="underline">Portal oficial da Prefeitura de Planaltina-GO</a>.
        A listagem é de acessos digitais, não um inventário completo de órgãos ou unidades físicas.
      </p>
    </section>
  );
}
