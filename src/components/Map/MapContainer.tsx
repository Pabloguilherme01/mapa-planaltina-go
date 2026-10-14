import React, { useState } from 'react';
import { MapPoint } from '../../types/index.ts';
import { DemoMapProvider } from './DemoMapProvider.tsx';
import { GoogleMapsProvider } from './GoogleMapsProvider.tsx';
import { Map as MapIcon, Globe } from 'lucide-react';
import { hasGoogleMapsApiKey } from '../../utils/mapProvider.ts';

interface MapContainerProps {
  points: MapPoint[];
  selectedPoint: MapPoint | null;
  onSelectPoint: (point: MapPoint | null) => void;
  onOpenProvenanceLegend: () => void;
  onRequestGeolocation: () => void;
  userLocation: { lat: number; lng: number } | null;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  points,
  selectedPoint,
  onSelectPoint,
  onOpenProvenanceLegend,
  onRequestGeolocation,
  userLocation,
}) => {
  const [provider, setProvider] = useState<'demo' | 'google'>('demo');
  const googleMapsAvailable = hasGoogleMapsApiKey(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

  return (
    <div className="relative w-full h-full">
      {/* Provider Selector Switch */}
      <div className="absolute top-14 right-3 lg:top-3 lg:right-32 z-30 flex items-center bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-md border border-neutral-200">
        <button
          type="button"
          onClick={() => setProvider('demo')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            provider === 'demo'
              ? 'bg-[#355E3B] text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
          aria-pressed={provider === 'demo'}
        >
          <MapIcon size={14} />
          <span>Esquemático</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (googleMapsAvailable) setProvider('google');
          }}
          disabled={!googleMapsAvailable}
          aria-disabled={!googleMapsAvailable}
          aria-label={
            googleMapsAvailable
              ? 'Usar Google Maps'
              : 'Google Maps indisponível: chave de API não configurada'
          }
          title={
            googleMapsAvailable
              ? 'Usar Google Maps'
              : 'Google Maps indisponível neste ambiente'
          }
          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            provider === 'google'
              ? 'bg-[#355E3B] text-white shadow-sm'
              : googleMapsAvailable
                ? 'text-neutral-600 hover:text-neutral-900'
                : 'text-neutral-400 opacity-70 cursor-not-allowed'
          }`}
          aria-pressed={provider === 'google'}
        >
          <Globe size={14} />
          <span>Google Maps</span>
        </button>
      </div>

      {provider === 'demo' ? (
        <DemoMapProvider
          points={points}
          selectedPoint={selectedPoint}
          onSelectPoint={onSelectPoint}
          onOpenProvenanceLegend={onOpenProvenanceLegend}
          onRequestGeolocation={onRequestGeolocation}
          userLocation={userLocation}
        />
      ) : (
        <GoogleMapsProvider
          points={points}
          selectedPoint={selectedPoint}
          onSelectPoint={onSelectPoint}
          onSwitchToDemoMap={() => setProvider('demo')}
        />
      )}
    </div>
  );
};
