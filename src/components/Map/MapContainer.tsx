import React, { useState } from 'react';
import { MapPoint } from '../../types/index.ts';
import { DemoMapProvider } from './DemoMapProvider.tsx';
import { GoogleMapsProvider } from './GoogleMapsProvider.tsx';
import { Map as MapIcon, Globe } from 'lucide-react';

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
  // Always default to 'demo' as requested
  const [provider, setProvider] = useState<'demo' | 'google'>('demo');

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
          onClick={() => setProvider('google')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            provider === 'google'
              ? 'bg-[#355E3B] text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
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
