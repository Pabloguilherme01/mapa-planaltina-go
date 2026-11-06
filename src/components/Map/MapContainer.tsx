import type { LocalRoute } from '../../utils/roadGraph.ts';
import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { MapPoint } from '../../types/index.ts';
import { Map as MapIcon, Globe, Loader2, Maximize2, Minimize2, Move } from 'lucide-react';
import { hasGoogleMapsApiKey } from '../../utils/mapProvider.ts';

const GoogleMapsProvider = lazy(() =>
  import('./GoogleMapsProvider.tsx').then((module) => ({ default: module.GoogleMapsProvider }))
);
const DemoMapProvider = lazy(() =>
  import('./DemoMapProvider.tsx').then(module => ({ default: module.DemoMapProvider }))
);
const GeographicMapProvider = lazy(() => import('./GeographicMapProvider.tsx').then(module => ({ default: module.GeographicMapProvider })));

interface MapContainerProps {
  points: MapPoint[];
  selectedPoint: MapPoint | null;
  onSelectPoint: (point: MapPoint | null) => void;
  onOpenPointDetails: (point: MapPoint) => void;
  onOpenProvenanceLegend: () => void;
  onRequestGeolocation: () => void;
  userLocation: { lat: number; lng: number } | null;
  routePreview: LocalRoute | null;
  onClearRoute: () => void;
  routePickMode: 'origin' | 'destination' | null;
  onMapCoordinatePicked: (position: {lat:number;lng:number}) => void;
  onCancelMapPick: () => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  points,
  selectedPoint,
  onSelectPoint,
  onOpenPointDetails,
  onOpenProvenanceLegend,
  onRequestGeolocation,
  userLocation,
  routePreview,
  onClearRoute,
  routePickMode,
  onMapCoordinatePicked,
  onCancelMapPick,
}) => {
  const [provider, setProvider] = useState<'geographic' | 'demo' | 'google'>('geographic');
  const allowSchematic = import.meta.env.DEV;
  const googleMapsAvailable = import.meta.env.DEV && hasGoogleMapsApiKey(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const expandButtonRef = useRef<HTMLButtonElement>(null);

  // Inspirado no Trajeto: ampliar a superfície sem desmontar o Leaflet
  // preserva câmera, zoom e a posição autorizada pelo cidadão.
  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    expandButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setExpanded(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(rootRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? []).filter(element => element.tabIndex >= 0 && element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        event.preventDefault();
        rootRef.current?.focus();
      } else if (event.shiftKey && (document.activeElement === first || !rootRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !rootRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      queueMicrotask(() => {
        if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
        if (expandButtonRef.current?.isConnected) expandButtonRef.current.focus({ preventScroll: true });
        else if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      });
    };
  }, [expanded]);

  const showDetails = (point: MapPoint) => {
    if (expanded) setExpanded(false);
    onOpenPointDetails(point);
  };
  const pickCoordinate = (position: {lat: number; lng: number}) => {
    if (expanded) setExpanded(false);
    onMapCoordinatePicked(position);
  };

  return (
    <div
      ref={rootRef}
      tabIndex={expanded ? -1 : undefined}
      role={expanded ? 'dialog' : undefined}
      aria-modal={expanded ? true : undefined}
      aria-label={expanded ? 'Mapa de Planaltina em tela cheia' : undefined}
      className={expanded
        ? 'planaltina-map-fullscreen fixed inset-0 z-[60] flex flex-col bg-white'
        : 'relative w-full h-full'}
    >
      <div className={expanded
        ? 'z-30 flex min-h-[60px] shrink-0 items-center justify-between gap-2 bg-[#152c24] px-3 py-2 text-white'
        : 'absolute right-3 top-3 z-30'}>
        {expanded && <div className="min-w-0">
          <p className="text-sm font-extrabold">Mapa de Planaltina</p>
          <p className="flex items-center gap-1 text-[11px] text-white/80"><Move size={12} aria-hidden="true"/> Arraste, aproxime e toque nos locais</p>
        </div>}
        <button
          ref={expandButtonRef}
          type="button"
          onClick={() => setExpanded(current => !current)}
          aria-label={expanded ? 'Sair do mapa em tela cheia' : 'Abrir mapa em tela cheia'}
          aria-expanded={expanded}
          className={expanded
            ? 'touch-target flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-white/30 bg-white px-3 text-xs font-extrabold text-[#152c24]'
            : 'touch-target flex min-h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white/95 px-3 text-xs font-extrabold text-[#355E3B] shadow-lg backdrop-blur'}
        >
          {expanded ? <Minimize2 size={17} aria-hidden="true"/> : <Maximize2 size={17} aria-hidden="true"/>}
          {expanded ? 'Fechar' : 'Tela cheia'}
        </button>
      </div>
      {/* Provider Selector Switch */}
      {import.meta.env.DEV && <label className="absolute top-16 right-3 z-30 lg:hidden rounded-xl bg-white p-1 shadow">
        <span className="sr-only">Tipo de mapa</span>
        <select className="min-h-11 max-w-36 text-xs font-bold" value={provider} onChange={event => setProvider(event.target.value as typeof provider)}>
          <option value="geographic">Geográfico</option>{allowSchematic && <option value="demo">Esquemático de teste</option>}{import.meta.env.DEV && <option value="google" disabled={!googleMapsAvailable}>Google Maps</option>}
        </select>
      </label>}
      {import.meta.env.DEV && <div className="absolute lg:top-3 lg:right-32 z-30 hidden lg:flex items-center bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-md border border-neutral-200">
        <button type="button" className="touch-target rounded-lg px-2 text-xs font-bold" aria-pressed={provider === 'geographic'} onClick={() => setProvider('geographic')}>Geográfico</button>
        {allowSchematic && <button
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
          <span>Esquemático de teste</span>
        </button>}

        {import.meta.env.DEV && (
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
        )}
      </div>}

      <div className={expanded ? 'relative min-h-0 flex-1' : 'h-full w-full'}>
      {provider === 'geographic' ? <Suspense fallback={<p role="status">Carregando cartografia…</p>}><GeographicMapProvider points={points} selectedPoint={selectedPoint} onSelectPoint={onSelectPoint} onOpenPointDetails={showDetails} userLocation={userLocation} routePreview={routePreview} onClearRoute={onClearRoute} routePickMode={routePickMode} onMapCoordinatePicked={pickCoordinate} onCancelMapPick={onCancelMapPick} /></Suspense> : provider === 'demo' ? (
        <Suspense fallback={<p role="status">Carregando mapa de teste…</p>}><DemoMapProvider
          points={points}
          selectedPoint={selectedPoint}
          onSelectPoint={onSelectPoint}
          onOpenProvenanceLegend={onOpenProvenanceLegend}
          onRequestGeolocation={onRequestGeolocation}
          userLocation={userLocation}
        /></Suspense>
      ) : (
        <Suspense
          fallback={
            <div
              role="status"
              className="w-full h-full flex items-center justify-center gap-2 bg-[#F5F0E6] text-sm font-semibold text-[#355E3B]"
            >
              <Loader2 size={18} className="animate-spin" />
              Carregando Google Maps…
            </div>
          }
        >
          <GoogleMapsProvider
            points={points}
            selectedPoint={selectedPoint}
            onSelectPoint={onSelectPoint}
            onSwitchToDemoMap={() => setProvider('geographic')}
          />
        </Suspense>
      )}
      </div>
    </div>
  );
};
