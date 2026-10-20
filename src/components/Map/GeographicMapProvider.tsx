import type { LocalRoute } from '../../utils/roadGraph.ts';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MUNICIPAL_BOUNDARY } from '../../data/municipalBoundary.ts';
import { MapPoint } from '../../types/index.ts';
import { CATEGORY_CONFIG } from '../../utils/categoryMeta.ts';
import { groupMapPoints } from '../../utils/markerBuckets.ts';

export function GeographicMapProvider({ points, selectedPoint, onSelectPoint, userLocation, routePreview, onClearRoute }: {
  points: MapPoint[]; selectedPoint: MapPoint | null; onSelectPoint: (point: MapPoint | null) => void;
  userLocation: { lat: number; lng: number } | null;
  routePreview: LocalRoute | null;
  onClearRoute: () => void;
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
    L.control.scale({ metric: true, imperial: false, position: 'bottomright' }).addTo(instance);
    const attribution = L.control.attribution({ position: 'topleft' }).addTo(instance);
    attribution.getContainer()!.style.marginTop = '116px';
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
      const marker = L.marker([point.lat, point.lng], { icon, title: `${point.name} — ${real ? 'REAL' : 'DEMO'}`, keyboard: true }).addTo(group);
      marker.on('click', () => onSelectPoint(point));
      marker.getElement()?.setAttribute('aria-label', `${point.name} — ${real ? 'REAL' : 'DEMO'}`);
      }
    };
    render();
    instance.on('zoomend', render);
    return () => { instance.off('zoomend', render); group.remove(); };
  }, [points, onSelectPoint]);
  useEffect(() => { if (selectedPoint) map.current?.panTo([selectedPoint.lat, selectedPoint.lng]); }, [selectedPoint]);
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
    <div ref={host} className="h-full w-full bg-[#e9eee5]" style={{ zIndex: 0 }} aria-label="Mapa geográfico de Planaltina com limite IBGE" />
    <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2 max-w-[65%]">
      <button className="touch-target rounded-xl bg-white px-3 py-2 text-xs font-bold shadow" aria-pressed={streets}
        onClick={() => { setTileError(false); setStreets(!streets); }}>Ruas online {streets ? 'ativadas' : 'desativadas'}</button>
      <button className="touch-target rounded-xl bg-white px-3 py-2 text-xs font-bold shadow"
        onClick={() => map.current?.fitBounds(L.geoJSON(MUNICIPAL_BOUNDARY as GeoJSON.GeoJsonObject).getBounds())}>Ver município</button>
      {routePreview && <button className="touch-target rounded-xl bg-[#355E3B] px-3 py-2 text-xs font-bold text-white shadow" onClick={onClearRoute}>Limpar percurso · {(routePreview.distanceMeters/1000).toFixed(1)} km aprox.</button>}
      {userLocation && <button className="touch-target rounded-xl bg-white px-3 py-2 text-xs font-bold shadow" onClick={() => map.current?.setView([userLocation.lat, userLocation.lng], 15)}>Minha posição</button>}
      {tileError && <p role="status" className="rounded bg-white p-2 text-xs">Ruas indisponíveis. Limite e pontos continuam disponíveis.</p>}
    </div>
    <p className="absolute bottom-8 left-2 z-10 max-w-[60%] rounded bg-white/95 p-2 text-[10px]">Limite IBGE simplificado • cores por categoria • <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">© OpenStreetMap contributors (ODbL)</a>. Dados comunitários não verificados; ruas online sem download offline.</p>
  </div>;
}
