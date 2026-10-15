import { useState } from 'react';
import snapshot from '../../data/fuelRegistry.json';
import { ANP_SOURCE_URL, filterFuelStations, parseFuelRegistry } from '../../utils/fuelRegistry';

const registry = parseFuelRegistry(snapshot);
const brands = [...new Set(registry.items.map(item => item.brand).filter(Boolean))].sort();

export function FuelRegistrySection() {
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState('');
  const stations = filterFuelStations(registry.items, query, brand);
  return <section className="my-6 rounded-2xl border border-neutral-200 bg-white p-5" aria-labelledby="fuel-title">
    <h2 id="fuel-title" className="text-lg font-bold">Abastecimento — cadastro oficial ANP</h2>
    <p className="my-2 text-sm">{registry.items.length} revendedores identificados em Planaltina-GO. Esta base cadastral não fornece preços, horários ou coordenadas; os registros não viram pins nem destinos de navegação.</p>
    <p className="text-xs">Coleta: {new Date(registry.retrievedAt).toLocaleDateString('pt-BR')}. Dados abertos ANP; consulte as condições da fonte e confirme a operação antes de sair.</p>
    <a className="inline-flex min-h-11 items-center underline text-sm" href={ANP_SOURCE_URL} target="_blank" rel="noreferrer">Consultar fonte ANP</a>
    <label className="block text-sm font-bold">Buscar posto por nome ou bairro<input type="search" value={query} onChange={event => setQuery(event.target.value)} className="my-2 min-h-11 w-full rounded-lg border border-neutral-400 p-3 font-normal" /></label>
    <label className="block text-sm font-bold">Bandeira informada na ANP<select value={brand} onChange={event => setBrand(event.target.value)} className="my-2 min-h-11 w-full rounded-lg border border-neutral-400 bg-white p-3 font-normal"><option value="">Todas as bandeiras</option>{brands.map(item => <option key={item}>{item}</option>)}</select></label>
    {(query || brand) && <button type="button" className="my-2 min-h-11 rounded-lg border border-neutral-500 px-3 text-sm" onClick={() => { setQuery(''); setBrand(''); }}>Limpar filtros de postos</button>}
    <p role="status" className="text-xs">{stations.length === 1 ? '1 revendedor encontrado' : `${stations.length} revendedores encontrados`}</p>
    <ul tabIndex={0} aria-label="Resultados do cadastro ANP; use as setas para rolar" className="mt-3 max-h-96 divide-y divide-neutral-200 overflow-y-auto focus:outline-2 focus:outline-[#355E3B]">{stations.map(item => <li key={item.id} className="py-3 text-sm"><strong>{item.name}</strong><p>{item.address} — {item.district || 'Bairro não informado'}</p><p>{item.brand || 'Bandeira não informada'} • ANP {item.authorization}</p></li>)}</ul>
  </section>;
}
