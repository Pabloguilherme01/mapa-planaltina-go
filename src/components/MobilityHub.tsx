import { useEffect, useMemo, useRef, useState } from 'react';
import type { MapPoint } from '../types';
import { estimateFuelCost, readTrip, routeUrl, tripKey, type TravelMode, type ExternalMapsApp } from '../utils/mobility';
import { findDestinations, susStatus } from '../utils/destinationSearch';
import { favoritesKey, readFavorites, saveFavorite } from '../utils/favoriteTrips';
import { SavedDestinations } from './SavedDestinations';
import { planLocalRoute, validateRoadGraph, type RoadGraph, type LocalRoute } from '../utils/roadGraph.ts';

type Mode = 'automatico' | 'proxima' | 'repetir' | 'economia' | 'offline' | 'conducao';
const modes: [Mode, string][] = [['automatico', 'Automático'], ['proxima', 'Próxima viagem'], ['repetir', 'Repetir'], ['economia', 'Economia'], ['offline', 'Sem internet'], ['conducao', 'Condução']];

export function MobilityHub({ points, selectedPoint, userLocation, onRoutePreview }: {
  points: MapPoint[]; selectedPoint: MapPoint | null;
  userLocation: { lat: number; lng: number } | null;
  onRoutePreview: (route: LocalRoute) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<Mode>('automatico');
  const [destinationId, setDestinationId] = useState('');
  const [originId, setOriginId] = useState('');
  const [calculating, setCalculating] = useState(false);
  const graphCache = useRef<RoadGraph | null>(null);
  const [travel, setTravel] = useState<TravelMode>('driving');
  const [externalMap, setExternalMap] = useState<ExternalMapsApp>('google');
  const [online, setOnline] = useState(navigator.onLine);
  const [notice, setNotice] = useState('');
  const [km, setKm] = useState('');
  const [consumption, setConsumption] = useState('');
  const [price, setPrice] = useState('');
  const [query, setQuery] = useState('');
  const [susOnly, setSusOnly] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try { return readFavorites(localStorage.getItem(favoritesKey)); } catch { return []; }
  });
  const real = useMemo(() => findDestinations(points, '', false), [points]);
  const results = useMemo(() => findDestinations(real, query, susOnly), [real, query, susOnly]);
  const destination = real.find(point => point.id === destinationId);
  const origin = originId === '__gps__' ? userLocation : real.find(p => p.id === originId);
  const routeEnabled = Boolean(origin && destination && originId !== destinationId);
  const destinationSus = destination ? susStatus(destination) : 'unknown';
  const cost = estimateFuelCost(Number(km), Number(consumption), Number(price));
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === favoritesKey || event.key === null) {
        try { setFavorites(readFavorites(localStorage.getItem(favoritesKey))); } catch { setFavorites([]); }
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  function restore() {
    setQuery(''); setSusOnly(false); setDestinationId('');
    try {
      const saved = readTrip(localStorage.getItem(tripKey));
      if (saved && real.some(point => point.id === saved.id)) {
        setDestinationId(saved.id); setTravel(saved.mode); setNotice('Viagem restaurada; confira o destino antes de sair.');
      } else { setDestinationId(''); setNotice('Nenhuma viagem válida salva neste aparelho. Escolha um destino real.'); }
    } catch { setNotice('Armazenamento indisponível. O planejamento continua disponível nesta sessão.'); }
  }
  function choose(value: Mode) {
    setMode(value); setNotice('');
    if (value === 'repetir' || value === 'offline') restore();
    if (value === 'automatico') { if (!online) { setMode('offline'); restore(); } else setMode('proxima'); }
  }
  async function calculateOnDevice() {
    if (!origin || !destination || originId === destinationId || calculating) return;
    setCalculating(true); setNotice('Calculando percurso sobre a malha pública de ruas…');
    try {
      let graph = graphCache.current;
      if (!graph) {
        const response = await fetch(`${import.meta.env.BASE_URL}data/road-graph.json`);
        if (!response.ok) throw new Error('Malha viária indisponível nesta instalação.');
        const payload: unknown = await response.json();
        if (!validateRoadGraph(payload)) throw new Error('Malha viária inválida. Confira a próxima atualização.');
        graph = payload;
        graphCache.current = graph;
      }
      const result = planLocalRoute(graph, origin, destination, travel);
      if (!result) {
        setNotice('Não foi encontrada ligação viária confiável neste modo, ou a origem/destino está longe da rede. Use um aplicativo de navegação externa.');
        return;
      }
      onRoutePreview(result);
      setNotice(`Percurso aproximado de ${(result.distanceMeters / 1000).toFixed(1)} km no mapa.`);
      dialog.current?.close();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Não foi possível calcular o caminho local.');
    } finally {
      setCalculating(false);
    }
  }
  const inputStyle = 'w-full rounded-lg border border-neutral-400 bg-white p-3 text-neutral-900';
  return <>
    <button type="button" onClick={() => {
      setQuery(''); setSusOnly(false);
      if (selectedPoint && !selectedPoint.isDemo) setDestinationId(selectedPoint.id);
      dialog.current?.showModal();
    }} className="absolute right-3 top-28 z-30 rounded-xl bg-[#355E3B] px-4 py-3 font-bold text-white shadow-lg">Planejar viagem</button>
    <dialog ref={dialog} aria-labelledby="mobility-title" className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl bg-[#F5F0E6] p-5 text-[#121E14] shadow-xl backdrop:bg-black/60">
      <div className="flex items-center justify-between gap-3"><h2 id="mobility-title" className="text-xl font-bold">Mobilidade em Planaltina</h2><button type="button" onClick={() => dialog.current?.close()} className="rounded-lg border p-3" aria-label="Fechar planejador">Fechar</button></div>
      <p className="my-3 text-sm">Escolha um destino real mapeado, confira sua fonte e abra a navegação. Trânsito e itinerários de ônibus não são calculados aqui.</p>
      <label className="block">Modo de uso<select className={inputStyle} value={mode} onChange={event => choose(event.target.value as Mode)}>{modes.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <SavedDestinations favorites={favorites} points={real} onChoose={trip => {
        setQuery(''); setSusOnly(false); setDestinationId(trip.id); setTravel(trip.mode);
        setNotice('Destino salvo selecionado. Confira os dados antes de sair.');
      }} onRemove={id => {
        try {
          const next = readFavorites(localStorage.getItem(favoritesKey)).filter(item => item.id !== id);
          localStorage.setItem(favoritesKey, JSON.stringify(next)); setFavorites(next); setNotice('Destino removido dos favoritos deste aparelho.');
        } catch { setNotice('Não foi possível remover o favorito neste navegador.'); }
      }} />
      <label className="my-3 block">Buscar destino por nome ou endereço<input type="search" className={inputStyle} value={query} onChange={event => { setQuery(event.target.value); setDestinationId(''); }} /></label>
      <label className="my-2 flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={susOnly} onChange={event => { setSusOnly(event.target.checked); setDestinationId(''); }} />Somente vínculo SUS informado no CNES</label>
      <p aria-live="polite" className="text-xs">{results.length} destinos disponíveis{susOnly ? ' com vínculo SUS informado' : ''}</p>
      <label className="my-3 block">Destino real<select className={inputStyle} value={destinationId} onChange={event => setDestinationId(event.target.value)}><option value="">Escolha um local</option>{results.map(point => <option key={point.id} value={point.id}>{point.name}</option>)}</select></label>
      <label className="block">Deslocamento<select className={inputStyle} value={travel} onChange={event => {
        const next = event.target.value as TravelMode;
        setTravel(next);
        if (next !== 'driving' && externalMap === 'waze') setExternalMap('google');
      }}><option value="driving">Carro</option><option value="walking">A pé</option><option value="bicycling">Bicicleta</option></select></label>
      <fieldset className="my-3 rounded-xl border border-neutral-400 p-3">
        <legend className="font-bold">Rota pelas ruas de Planaltina · gratuita</legend>
        <label className="my-2 block text-sm">Ponto de partida
          <select className={inputStyle} aria-label="Ponto de partida" value={originId}
            onChange={event => setOriginId(event.target.value)}>
            <option value="">Escolha onde começa</option>
            {userLocation && <option value="__gps__">Minha posição (GPS autorizado)</option>}
            {real.map(point => <option key={point.id} value={point.id}>{point.name}</option>)}
          </select>
        </label>
        <button type="button" className="touch-target rounded-xl bg-[#355E3B] px-3 py-2 text-white font-bold disabled:opacity-50"
          disabled={!routeEnabled || calculating} onClick={calculateOnDevice}>
          {calculating ? 'Calculando…' : 'Traçar rota no mapa'}
        </button>
        <p className="mt-2 text-xs text-neutral-600">
          Rota aproximada calculada no navegador a partir da malha OpenStreetMap. Não possui tráfego ao vivo, alertas de segurança, bloqueios atualizados ou linhas e horários de ônibus. O GPS não é enviado ao serviço de rotas.
          Pontos sem ligação na malha não recebem trajeto inventado.
        </p>
      </fieldset>
      <label className="my-3 block">Aplicativo de mapas
        <select className={inputStyle} value={externalMap} onChange={event => setExternalMap(event.target.value as ExternalMapsApp)}>
          <option value="google">Google Maps (rotas)</option>
          <option value="waze" disabled={travel !== 'driving'}>Waze (somente carro)</option>
          <option value="apple">Apple Maps (rotas)</option>
          <option value="organic">Organic Maps (abrir ponto)</option>
        </select>
      </label>
      {destination && <div className="my-3 rounded-xl border border-neutral-400 p-3"><strong>{destination.name}</strong><p>{destination.addressHint}</p><p className="text-sm">{destination.provenanceMeta.sourceName} • {destination.lat}, {destination.lng}</p>
        <p className="mt-2 text-sm">Vínculo SUS: {destinationSus === 'yes' ? 'Sim' : destinationSus === 'no' ? 'Não' : 'Não informado'}. Coleta: {new Date(destination.provenanceMeta.retrievedAt).toLocaleDateString('pt-BR')}. {destination.provenanceMeta.verificationStatus !== 'verified' ? ' Cadastro comunitário sem verificação oficial; confirme o local.' : ' Confirme o atendimento antes de sair.'}</p>
        {online && mode !== 'offline' ? <a className="mt-3 inline-block rounded-lg bg-[#355E3B] p-3 font-bold text-white" href={routeUrl(destination, travel, externalMap)} target="_blank" rel="noopener noreferrer">{externalMap === 'organic' ? 'Abrir ponto no Organic Maps' : 'Abrir navegação externa'}</a> : <p className="mt-2 font-semibold">Consulta offline: endereço e coordenadas disponíveis. Navegação externa exige conexão.</p>}
      </div>}
      {mode === 'economia' && <fieldset className="my-3 space-y-2 rounded-xl border border-neutral-400 p-3"><legend className="font-bold">Estimativa de combustível</legend><p className="text-sm">Informe a distância do seu percurso e o preço observado. Não são dados de trânsito nem preços ao vivo.</p><label className="block">Distância (km)<input type="number" min="0" step="any" className={inputStyle} value={km} onChange={event => setKm(event.target.value)} /></label><label className="block">Consumo (km/l)<input type="number" min="0" step="any" className={inputStyle} value={consumption} onChange={event => setConsumption(event.target.value)} /></label><label className="block">Preço (R$/l)<input type="number" min="0" step="any" className={inputStyle} value={price} onChange={event => setPrice(event.target.value)} /></label><output aria-live="polite">{cost === null ? 'Preencha três valores positivos.' : `Estimativa: ${cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}</output></fieldset>}
      {mode === 'conducao' && <p className="my-3 rounded-lg bg-white p-3">Confira o destino com o veículo parado. Abra a navegação e siga as orientações do aplicativo escolhido.</p>}
      <div className="my-3 flex flex-wrap gap-2"><button type="button" disabled={!destination} className="rounded-lg border border-neutral-500 p-3 disabled:opacity-50" onClick={() => {
        if (!destination) return;
        const trip = { id: destination.id, mode: travel };
        try { localStorage.setItem(tripKey, JSON.stringify(trip)); } catch { setNotice('Não foi possível salvar neste navegador.'); return; }
        try {
          const next = saveFavorite(readFavorites(localStorage.getItem(favoritesKey)), trip);
          localStorage.setItem(favoritesKey, JSON.stringify(next)); setFavorites(next);
          setNotice('Viagem salva somente neste navegador, com até oito destinos favoritos. Sua localização não foi armazenada.');
        } catch { setNotice('Última viagem salva. Não foi possível atualizar os favoritos neste navegador.'); }
      }}>Salvar viagem neste aparelho</button><button type="button" className="rounded-lg border border-neutral-500 p-3" onClick={() => { try { localStorage.removeItem(tripKey); setNotice('Viagem salva apagada deste aparelho.'); } catch { setNotice('Armazenamento indisponível.'); } }}>Apagar viagem salva</button></div>
      <p role="status" className="text-sm">{notice}</p>
      <p className="mt-3 text-xs">Salvar é opcional. Sem internet, a consulta depende de uma visita anterior com o aplicativo carregado. Percursos locais são estimativas sobre a malha cartográfica; confirme as condições de circulação.</p>
    </dialog>
  </>;
}
