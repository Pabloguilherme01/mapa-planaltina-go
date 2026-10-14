/// <reference types="google.maps" />
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { PLANALTINA_GEOJSON } from '../../data/planaltinaGeoJson.ts';
import { MapPoint } from '../../types/index.ts';
import { CATEGORY_CONFIG } from '../../utils/categoryMeta.ts';
import { hasGoogleMapsApiKey } from '../../utils/mapProvider.ts';
import {
  GOOGLE_MAPS_UNAVAILABLE_EVENT,
  installGoogleMapsQuotaConsoleBridge,
  signalGoogleMapsUnavailable,
} from '../../utils/googleMapsErrors.ts';
import { AlertCircle, ArrowLeft } from 'lucide-react';

interface GoogleMapsProviderProps {
  points: MapPoint[];
  selectedPoint: MapPoint | null;
  onSelectPoint: (point: MapPoint | null) => void;
  onSwitchToDemoMap: () => void;
}

function ClusteredPoint({ point, selected, onSelectPoint, register }: {
  point: MapPoint; selected: boolean;
  onSelectPoint: GoogleMapsProviderProps['onSelectPoint'];
  register: (id: string, marker: google.maps.marker.AdvancedMarkerElement | null) => void;
}) {
  const markerRef = useCallback((marker: google.maps.marker.AdvancedMarkerElement | null) => register(point.id, marker), [point.id, register]);
  return <AdvancedMarker ref={markerRef} position={{ lat: point.lat, lng: point.lng }} title={`${point.name} (${point.category})`} onClick={() => onSelectPoint(selected ? null : point)}>
    <Pin background={CATEGORY_CONFIG[point.category].hexColor} glyphColor="#FFFFFF" borderColor={selected ? '#121E14' : '#FFFFFF'} scale={selected ? 1.3 : 1} />
  </AdvancedMarker>;
}

function MapLayers({ points, selectedPoint, onSelectPoint }: Pick<GoogleMapsProviderProps, 'points' | 'selectedPoint' | 'onSelectPoint'>) {
  const map = useMap();
  const cluster = useRef<MarkerClusterer | null>(null);
  const [markers, setMarkers] = useState<Record<string, google.maps.marker.AdvancedMarkerElement>>({});
  const register = useCallback((id: string, marker: google.maps.marker.AdvancedMarkerElement | null) => {
    setMarkers((previous) => {
      if (previous[id] === marker || (!marker && !previous[id])) return previous;
      const next = { ...previous };
      if (marker) next[id] = marker; else delete next[id];
      return next;
    });
  }, []);
  useEffect(() => {
    if (!map) return;
    const instance = new MarkerClusterer({ map });
    cluster.current = instance;
    const features = map.data.addGeoJson(PLANALTINA_GEOJSON);
    map.data.setStyle({ strokeColor: '#BA623D', fillColor: '#E5B744', fillOpacity: 0.08, strokeWeight: 2, clickable: false });
    return () => { instance.setMap(null); cluster.current = null; features.forEach((feature) => map.data.remove(feature)); };
  }, [map]);
  useEffect(() => {
    const instance = cluster.current;
    if (!instance) return;
    instance.clearMarkers(true);
    instance.addMarkers(Object.values(markers), true);
    instance.render();
  }, [markers, map]);
  useEffect(() => {
    if (!map || !points.length) return;
    const bounds = new google.maps.LatLngBounds();
    points.forEach((point) => bounds.extend({ lat: point.lat, lng: point.lng }));
    map.fitBounds(bounds, 64);
  }, [map, points]);
  useEffect(() => { if (map && selectedPoint) map.panTo({ lat: selectedPoint.lat, lng: selectedPoint.lng }); }, [map, selectedPoint]);
  return <>{points.map((point) => <ClusteredPoint key={point.id} point={point} selected={selectedPoint?.id === point.id} onSelectPoint={onSelectPoint} register={register} />)}</>;
}

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({
  points,
  selectedPoint,
  onSelectPoint,
  onSwitchToDemoMap,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const googleMapsAvailable = hasGoogleMapsApiKey(apiKey);

  useEffect(() => {
    if (!googleMapsAvailable) return;

    const handleGoogleMapsUnavailable = () => onSwitchToDemoMap();
    window.addEventListener(GOOGLE_MAPS_UNAVAILABLE_EVENT, handleGoogleMapsUnavailable);
    const restoreConsole = installGoogleMapsQuotaConsoleBridge(console, signalGoogleMapsUnavailable);

    return () => {
      restoreConsole();
      window.removeEventListener(GOOGLE_MAPS_UNAVAILABLE_EVENT, handleGoogleMapsUnavailable);
    };
  }, [googleMapsAvailable, onSwitchToDemoMap]);

  // Initial DEMO viewport; not a verified municipal centroid.
  const defaultCenter = { lat: -15.4528, lng: -47.6142 };

  if (!googleMapsAvailable) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#F5F0E6] text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#BA623D]/10 text-[#BA623D] flex items-center justify-center mb-4">
          <AlertCircle size={36} />
        </div>
        <h3 className="text-xl font-bold text-[#121E14] mb-2 font-sans">
          Chave Google Maps Não Configurada
        </h3>
        <p className="max-w-md text-sm text-[#424941] mb-6 leading-relaxed font-sans">
          A chave de API <code>VITE_GOOGLE_MAPS_API_KEY</code> não foi fornecida nas variáveis de ambiente.
          O sistema opera por padrão com o <strong>DemoMapProvider nativo esquemático</strong> de Planaltina, Goiás.
        </p>
        <button
          type="button"
          onClick={onSwitchToDemoMap}
          className="touch-target px-6 py-3 rounded-xl bg-[#355E3B] text-white font-sans font-bold text-sm flex items-center gap-2 shadow-md hover:bg-[#27472c] active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
          <span>Voltar para o Mapa Esquemático DEMO</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <APIProvider apiKey={apiKey} language="pt-BR" region="BR">
        <Map
          style={{ width: '100%', height: '100%' }}
          defaultCenter={defaultCenter}
          defaultZoom={13}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          <MapLayers points={points} selectedPoint={selectedPoint} onSelectPoint={onSelectPoint} />
        </Map>
      </APIProvider>
      <div className="absolute bottom-3 left-3 bg-white px-3 py-2 text-xs text-[#121E14] rounded shadow">Camada GeoJSON DEMO — geometria sintética, sem limite municipal oficial.</div>
    </div>
  );
};
