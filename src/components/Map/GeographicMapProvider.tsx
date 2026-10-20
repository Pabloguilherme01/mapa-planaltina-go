import type { LocalRoute } from '../../utils/roadGraph.ts';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers2, MapPinned, Navigation2, Route, Info } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { MUNICIPAL_BOUNDARY } from '../../data/municipalBoundary.ts';
import { MapPoint } from '../../types/index.ts';
import { CATEGORY_CONFIG } from '../../utils/categoryMeta.ts';
import { groupMapPoints } from '../../utils/markerBuckets.ts';

export function GeographicMapProvider({ points, selectedPoint, onSelectPoint, userLocation, routePreview, onClearRoute, routePickMode, onMapCoordinatePicked }: {
  points: MapPoint[]; selectedPoint: MapPoint | null; onSelectPoint: (point: MapPoint | null) => void;
  userLocation: { lat: number; lng: number } | null;
  routePreview: LocalRoute | null;
  onClearRoute: () => void;
  routePickMode: 'origin' | 'destination' | null;
  onMapCoordinatePicked: (position: {lat:number;lng:number}) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [streets, setStreets] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const instance = L.map(host.current, { zoomControl: false, attributionControl: false }).setView([-15.45293, -47.60913], 13);
    map.current = instance;
    const zoom = L.control.zoom({ position: 'topright' }).addTo(instance);
    zoom.getContainer()!.style.marginTop = '76px';
    L.control.scale({ metric: true, imperial: false, position: 'bottomleft' }).addTo(instance);
    L.control.attribution({ position: 'bottomright' }).addTo(instance);
    L.geoJSON(MUNICIPAL_BOUNDARY as GeoJSON.GeoJsonObject, {
      style: { color: '#355E3B', fillOpacity: 0.04, weight: 2 },
      attribution: 'Limite simplificado: IBGE',
    }).addTo(instance);
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(host.current);
    return () => { observer.disconnect(); instance.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    if (!map.current) return;
    const instance = map.current;
    const group = L.layerGroup().addTo(instance);
    const render = () => {
      group.clearLayers();
      const buckets = groupMapPoints(points, instance.getZoom(), (point) => {
        const pixel = instance.project([point.lat, point.lng]);
        return { x: pixel.x, y: pixel.y };
      });
      for (const bucket of buckets.values()) {
        if (bucket.length > 1) {
          const bounds = L.latLngBounds(bucket.map(point => L.latLng(point.lat, point.lng)));
          const title = `${bucket.length} locais — ampliar grupo`;
          const icon = L.divIcon({ className: 'municipal-cluster', iconSize: [40, 40], html: `<span style="display:grid;place-items:center;width:40px;height:40px;border:3px solid white;border-radius:50%;background:#27472c;color:white;font-weight:bold">${bucket.length}</span>` });
          const marker = L.marker(bounds.getCenter(), { icon, title, keyboard: true }).addTo(group);
          marker.getElement()?.setAttribute('aria-label', title);
          marker.on('click', () => instance.fitBounds(bounds, { maxZoom: Math.min(17, instance.getZoom() + 2), padding: [32, 32] }));
          continue;
        }
        const point = bucket[0];
      const real = !point.isDemo;
      const icon = L.divIcon({ className: 'municipal-marker', iconSize: [32, 32], iconAnchor: [16, 16],
        html: `<span style="display:block;border:3px solid white;border-radius:50%;width:28px;height:28px;background:${real ? CATEGORY_CONFIG[point.category].hexColor : '#b45309'};box-shadow:0 1px 5px #555"></span>` });
      const marker = L.marker([point.lat, point.lng], { icon, title: `${point.name} — ${point.provenanceMeta.verificationStatus === 'verified' ? 'verificado' : real ? 'colaborativo não verificado' : 'DEMO'}`, keyboard: true }).addTo(group);
      marker.on('click', () => onSelectPoint(point));
      marker.getElement()?.setAttribute('aria-label', `${point.name} — ${point.provenanceMeta.verificationStatus === 'verified' ? 'verificado' : real ? 'colaborativo não verificado' : 'DEMO'}`);
      }
    };
    render();
    instance.on('zoomend', render);
    return () => { instance.off('zoomend', render); group.remove(); };
  }, [points, onSelectPoint]);
  useEffect(() => { if (selectedPoint) map.current?.panTo([selectedPoint.lat, selectedPoint.lng]); }, [selectedPoint]);
  useEffect(() => {
    if (!map.current || !routePickMode) return;
    const instance = map.current;
    const picked = (event: L.LeafletMouseEvent) => {
      onMapCoordinatePicked({lat: Number(event.latlng.lat.toFixed(7)), lng: Number(event.latlng.lng.toFixed(7))});
    };
    instance.on('click', picked);
    return () => { instance.off('click', picked); };
  }, [routePickMode, onMapCoordinatePicked]);
  useEffect(() => {
    if (!userLocation || !map.current) return;
    const marker = L.circleMarker([userLocation.lat, userLocation.lng], { radius: 8, color: '#fff', fillColor: '#1d4ed8', fillOpacity: 1 }).addTo(map.current);
    marker.bindTooltip('Sua posição — fornecida pelo dispositivo');
    return () => { marker.remove(); };
  }, [userLocation]);
  useEffect(() => {
    if (!routePreview || !map.current || routePreview.coordinates.length < 2) return;
    const coordinates = routePreview.coordinates;
    const route = L.polyline(coordinates, { color: '#eea435', weight: 6, opacity: .95,
      lineCap: 'round', lineJoin: 'round' }).addTo(map.current);
    map.current.fitBounds(route.getBounds(), { padding: [60, 60], maxZoom: 16 });
    return () => { route.remove(); };
  }, [routePreview]);
  useEffect(() => {
    if (!streets || !map.current) return;
    const layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map.current);
    layer.on('tileerror', () => setTileError(true));
    return () => { layer.remove(); };
  }, [streets]);
  return <div className="relative h-full w-full">
    <div ref={host} className="h-full w-full bg-[#e9eee5]"
      style={{ zIndex: 0, cursor: routePickMode ? 'crosshair' : undefined }}
      aria-label="Mapa geográfico de Planaltina com limite IBGE" />
    {routePickMode && <div role="status" className="pointer-events-none absolute inset-x-4 top-16 z-20 mx-auto w-fit max-w-[85vw] rounded-2xl border border-[#355E3B]/30 bg-white/95 px-4 py-3 text-center text-sm font-extrabold text-[#355E3B] shadow-xl backdrop-blur">
      Toque em uma rua do mapa para marcar {routePickMode === 'origin' ? 'a origem' : 'o destino'} do percurso.
    </div>}
    <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-6rem)] flex-wrap gap-2" aria-label="Controles do mapa">
      <button type="button" className="touch-target inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white/95 px-3 py-2 text-xs font-bold text-[#355E3B] shadow-lg backdrop-blur"
        aria-pressed={streets} aria-label={streets ? 'Ruas online ativadas' : 'Ruas online desativadas'}
        onClick={() => { setTileError(false); setStreets(!streets); }}>
        <Layers2 size={16} /> Ruas <span className={streets ? 'text-emerald-700' : 'text-neutral-600'}>{streets ? 'ON' : 'OFF'}</span>
      </button>
      <button type="button" className="touch-target inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white/95 px-3 py-2 text-xs font-bold text-[#355E3B] shadow-lg backdrop-blur"
        aria-label="Ver município" onClick={() => map.current?.fitBounds(L.geoJSON(MUNICIPAL_BOUNDARY as GeoJSON.GeoJsonObject).getBounds(),{padding:[24,24]})}>
        <MapPinned size={16} /> <span className="hidden sm:inline">Município</span>
      </button>
      {userLocation && <button type="button" className="touch-target inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white/95 px-3 py-2 text-xs font-bold text-[#355E3B] shadow-lg"
        onClick={() => map.current?.setView([userLocation.lat,userLocation.lng],15)}>
        <Navigation2 size={16} /> <span className="hidden sm:inline">Minha posição</span>
      </button>}
      {tileError && <p role="status" className="rounded-xl bg-white/95 p-2 text-xs">Ruas online indisponíveis; os pontos e o limite municipal continuam visíveis.</p>}
    </div>
    {routePreview && <div className="absolute right-3 top-32 lg:top-auto lg:bottom-14 z-20 max-w-[min(310px,75vw)] rounded-2xl border border-neutral-300 bg-white/95 p-3 shadow-xl backdrop-blur"
       role="status" aria-label="Rota local calculada">
      <p className="flex items-center gap-2 text-sm font-extrabold text-[#355E3B]"><Route size={17}/> Percurso cartográfico</p>
      <p className="mt-1 text-xl font-black">{(routePreview.distanceMeters/1000).toFixed(1)} km <span className="text-xs font-medium">aproximadamente</span></p>
      {(routePreview.startAccessMeters > 20 || routePreview.endAccessMeters > 20) &&
        <p className="mt-1 text-xs text-orange-800">Trechos de acesso fora da malha: {routePreview.startAccessMeters} m no início e {routePreview.endAccessMeters} m no fim.</p>}
      <button type="button" className="touch-target mt-2 w-full rounded-lg bg-[#355E3B] px-3 py-2 text-xs font-bold text-white" onClick={onClearRoute}>Limpar percurso</button>
    </div>}
    <details className="absolute bottom-11 left-3 z-10 max-w-[min(345px,68vw)] rounded-xl border border-neutral-200 bg-white/95 text-[11px] shadow-md backdrop-blur">
      <summary className="touch-target flex cursor-pointer items-center gap-2 px-3 py-2 font-bold text-[#355E3B]"><Info size={15}/> Legenda e procedência</summary>
      <div className="border-t border-neutral-200 p-3 text-neutral-700">
        <p>Limite municipal: IBGE. Marcadores coloridos identificam categorias.</p>
        <p className="mt-1">Local colaborativo não equivale a estabelecimento verificado. Rotas são estimativas na rede OSM, sem trânsito ao vivo.</p>
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block underline">© OpenStreetMap contributors (ODbL)</a>
      </div>
    </details>
  </div>;
}
