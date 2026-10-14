import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MapPoint,
  DEMO_DISCLAIMER_TEXT,
} from '../../types/index.ts';
import { CATEGORY_CONFIG } from '../../utils/categoryMeta.ts';
import {
  Plus,
  Minus,
  LocateFixed,
  ShieldCheck,
  Layers,
  Compass,
} from 'lucide-react';

interface DemoMapProviderProps {
  points: MapPoint[];
  selectedPoint: MapPoint | null;
  onSelectPoint: (point: MapPoint | null) => void;
  onOpenProvenanceLegend: () => void;
  onRequestGeolocation: () => void;
  userLocation: { lat: number; lng: number } | null;
}

export const DemoMapProvider: React.FC<DemoMapProviderProps> = ({
  points,
  selectedPoint,
  onSelectPoint,
  onOpenProvenanceLegend,
  onRequestGeolocation,
  userLocation,
}) => {
  // Map transform state (zoom & pan)
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showZones, setShowZones] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Planaltina, Goiás approximate center
  const CENTER_LAT = -15.4528;
  const CENTER_LNG = -47.6142;
  const LAT_SPAN = 0.08;
  const LNG_SPAN = 0.09;

  // Convert lat/lng to SVG canvas percentage coordinates (0 - 800 x 0 - 650)
  const projectCoordinates = (lat: number, lng: number) => {
    const x = ((lng - (CENTER_LNG - LNG_SPAN / 2)) / LNG_SPAN) * 800;
    const y = (((CENTER_LAT + LAT_SPAN / 2) - lat) / LAT_SPAN) * 650;
    return { x, y };
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 2.8));
    showToast('Zoom ampliado (modo esquemático)');
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.75));
    showToast('Zoom reduzido');
  };

  const handleResetCenter = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    showToast('Centralizado em Planaltina, Goiás');
  };

  // Center on selected point if changed
  useEffect(() => {
    if (selectedPoint) {
      const { x, y } = projectCoordinates(selectedPoint.lat, selectedPoint.lng);
      // center offset
      setPan({
        x: (400 - x) * zoom,
        y: (325 - y) * zoom,
      });
    }
  }, [selectedPoint]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Clusters representation: when zoom is low (< 0.9), cluster close points
  const displayedPoints = useMemo(() => {
    return points.map((p) => {
      const pos = projectCoordinates(p.lat, p.lng);
      return { ...p, svgX: pos.x, svgY: pos.y };
    });
  }, [points]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#EEFEEE] select-none cursor-grab active:cursor-grabbing focus:outline-none"
      tabIndex={0}
      role="region"
      aria-label="Mapa Interativo Esquemático de Planaltina, Goiás"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={(e) => {
        if (e.key === '+' || e.key === '=') handleZoomIn();
        if (e.key === '-' || e.key === '_') handleZoomOut();
        if (e.key === '0') handleResetCenter();
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-[#121E14] text-[#E5F5E4] px-4 py-2 rounded-full font-sans text-xs font-semibold shadow-lg transition-opacity duration-200">
          {toastMessage}
        </div>
      )}

      {/* Floating Provider & Mode Watermark */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1 pointer-events-none">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-[#355E3B]/20 text-[#121E14] text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-[#355E3B] animate-pulse"></span>
          <span>Provedor Esquemático DEMO • Planaltina, Goiás</span>
        </div>
        <div className="text-[11px] font-medium text-[#424941] bg-white/75 backdrop-blur-sm px-2.5 py-0.5 rounded-md w-fit">
          Código IBGE 5217609 • Leste Goiano
        </div>
      </div>

      {/* Floating Counter Badge in upper right */}
      <div className="absolute top-3 right-3 md:right-4 z-20 flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-[#4F3B00] text-[#FFDF9A] px-3 py-1.5 rounded-full shadow-md text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-[#EF9C4C] animate-ping"></span>
          <span>{points.length} DEMO</span>
        </div>
      </div>

      {/* Map SVG Canvas */}
      <svg
        className="w-full h-full"
        viewBox="0 0 800 650"
        preserveAspectRatio="xMidYMid slice"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        <defs>
          <radialGradient id="cerradoGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#E8F8E7" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#D7E7D6" stopOpacity="0.95" />
          </radialGradient>

          <linearGradient id="terracotaWash" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFDBCE" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#E2F2E1" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="reservaCerrado" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#DDECDB" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#CCE3CA" stopOpacity="0.9" />
          </linearGradient>

          <pattern id="gridSurvey" width="36" height="36" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#727970" fillOpacity="0.18" />
          </pattern>
        </defs>

        {/* Base Landscape */}
        <rect width="100%" height="100%" fill="url(#cerradoGrad)" />
        <rect width="100%" height="100%" fill="url(#gridSurvey)" />

        {/* Municipality Outer Boundary (Schematic Planaltina-GO perimeter) */}
        <polygon
          points="80,90 280,50 620,70 740,240 690,520 440,610 180,570 60,360"
          fill="none"
          stroke="#355E3B"
          strokeWidth="2.5"
          strokeDasharray="6 4"
          strokeOpacity="0.45"
        />

        {/* River Course - Schematic Rio Maranhão / Hydrography */}
        <path
          d="M 40 40 Q 180 120 320 90 T 560 140 T 780 110"
          fill="none"
          stroke="#82C5E8"
          strokeWidth="7"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />
        <path
          d="M 40 40 Q 180 120 320 90 T 560 140 T 780 110"
          fill="none"
          stroke="#EBF7FC"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <text x="590" y="130" fill="#206385" fontSize="11" fontWeight="700" opacity="0.8">
          Bacia do Rio Maranhão (esquemático)
        </text>

        {/* Primary Arterial Road Corridors */}
        {/* GO-118 highway axis */}
        <path
          d="M 120 0 C 180 180 260 340 380 650"
          fill="none"
          stroke="#C1C9BE"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 120 0 C 180 180 260 340 380 650"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <text x="195" y="190" fill="#424941" fontSize="10" fontWeight="700" transform="rotate(45, 195, 190)">
          Eixo Viário Regional GO-118
        </text>

        {/* East-West Urban Collector */}
        <path
          d="M 0 350 C 220 330 460 360 800 340"
          fill="none"
          stroke="#C1C9BE"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 0 350 C 220 330 460 360 800 340"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Secondary Grid Lines */}
        <path
          d="M 280 220 L 520 220 L 520 440 L 280 440 Z"
          fill="none"
          stroke="#CAD6C7"
          strokeWidth="2"
        />
        <line x1="360" y1="220" x2="360" y2="440" stroke="#CAD6C7" strokeWidth="1.5" />
        <line x1="440" y1="220" x2="440" y2="440" stroke="#CAD6C7" strokeWidth="1.5" />
        <line x1="280" y1="290" x2="520" y2="290" stroke="#CAD6C7" strokeWidth="1.5" />
        <line x1="280" y1="370" x2="520" y2="370" stroke="#CAD6C7" strokeWidth="1.5" />

        {/* Demonstrative Zones (Stitch Reference) */}
        {showZones && (
          <g className="transition-opacity duration-300">
            {/* Zone 01: Noroeste Terracota */}
            <polygon
              points="140,160 270,140 290,260 170,280"
              fill="url(#terracotaWash)"
              stroke="#BA623D"
              strokeWidth="2"
              strokeDasharray="5 5"
              strokeOpacity="0.75"
            />
            <text x="155" y="185" fill="#772F0E" fontSize="12" fontWeight="800">
              Área Demonstrativa 01
            </text>
            <text x="155" y="202" fill="#772F0E" fontSize="10" opacity="0.85">
              Zona Didática Central • Planaltina, Goiás
            </text>

            {/* Zone 02: Leste Reserva */}
            <path
              d="M 490,140 Q 600,110 680,180 Q 720,290 610,320 Q 510,290 480,210 Z"
              fill="url(#reservaCerrado)"
              stroke="#355E3B"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeOpacity="0.8"
            />
            <text x="535" y="195" fill="#1D4626" fontSize="12" fontWeight="800">
              Área Demonstrativa 02
            </text>
            <text x="535" y="212" fill="#1D4626" fontSize="10" opacity="0.85">
              Reserva Cívica e Hídrica Fictícia
            </text>

            {/* Zone 03: Sul Cadastral */}
            <polygon
              points="240,430 460,445 420,565 210,540"
              fill="#E8F8E7"
              stroke="#727970"
              strokeWidth="2"
              strokeDasharray="5 4"
              strokeOpacity="0.65"
            />
            <text x="255" y="470" fill="#355E3B" fontSize="12" fontWeight="800">
              Área Demonstrativa 03
            </text>
            <text x="255" y="487" fill="#424941" fontSize="10" opacity="0.85">
              Polígono Cadastral Simulado
            </text>
          </g>
        )}

        {/* User Geolocation Pulse (if consented and available) */}
        {userLocation && (
          <g>
            {(() => {
              const uPos = projectCoordinates(userLocation.lat, userLocation.lng);
              return (
                <>
                  <circle
                    cx={uPos.x}
                    cy={uPos.y}
                    r="24"
                    fill="#BA623D"
                    fillOpacity="0.2"
                    className="animate-ping"
                  />
                  <circle cx={uPos.x} cy={uPos.y} r="10" fill="#BA623D" stroke="#FFFFFF" strokeWidth="3" />
                  <text
                    x={uPos.x}
                    y={uPos.y + 24}
                    textAnchor="middle"
                    fill="#121E14"
                    fontSize="11"
                    fontWeight="700"
                  >
                    Você está aqui (aparelho)
                  </text>
                </>
              );
            })()}
          </g>
        )}

        {/* Interactive Points / Pins */}
        {displayedPoints.map((point) => {
          const isSelected = selectedPoint?.id === point.id;
          const config = CATEGORY_CONFIG[point.category];
          const IconComponent = config.icon;

          return (
            <g
              key={point.id}
              className="cursor-pointer group"
              transform={`translate(${point.svgX}, ${point.svgY})`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPoint(isSelected ? null : point);
              }}
              tabIndex={0}
              role="button"
              aria-label={`Ponto demonstrativo: ${point.name}, Categoria: ${point.category}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPoint(isSelected ? null : point);
                }
              }}
            >
              {/* Pulse effect if selected */}
              {isSelected && (
                <circle
                  cx="0"
                  cy="-18"
                  r="28"
                  fill={config.hexColor}
                  fillOpacity="0.3"
                  className="animate-ping"
                />
              )}

              {/* DEMO Tag top pill */}
              <g transform="translate(0, -44)">
                <rect
                  x="-22"
                  y="-8"
                  width="44"
                  height="16"
                  rx="8"
                  fill="#FFF9E6"
                  stroke="#E5B744"
                  strokeWidth="1.5"
                />
                <circle cx="-13" cy="0" r="3" fill="#BA623D" />
                <text
                  x="2"
                  y="3.5"
                  textAnchor="middle"
                  fill="#78350F"
                  fontSize="9"
                  fontWeight="800"
                  letterSpacing="0.05em"
                >
                  DEMO
                </text>
              </g>

              {/* Pin Base Circle */}
              <circle
                cx="0"
                cy="-18"
                r={isSelected ? 20 : 16}
                fill={config.hexColor}
                stroke="#FFFFFF"
                strokeWidth={isSelected ? 3.5 : 2.5}
                filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.25))"
                className="transition-all duration-150 group-hover:scale-110"
              />

              {/* SVG Icon center representation */}
              <circle cx="0" cy="-18" r="7" fill="#FFFFFF" fillOpacity="0.9" />
              <circle cx="0" cy="-18" r="4" fill={config.hexColor} />

              {/* Bottom Label on hover or selection */}
              <g
                transform="translate(0, 10)"
                className={`${
                  isSelected
                    ? 'opacity-100'
                    : 'opacity-90 group-hover:opacity-100 group-hover:scale-105'
                } transition-all duration-150`}
              >
                <rect
                  x="-65"
                  y="0"
                  width="130"
                  height="22"
                  rx="6"
                  fill="#FFFFFF"
                  fillOpacity="0.96"
                  stroke={isSelected ? config.hexColor : '#CAD6C7'}
                  strokeWidth={isSelected ? 1.8 : 1}
                  filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.12))"
                />
                <text
                  x="0"
                  y="14"
                  textAnchor="middle"
                  fill="#121E14"
                  fontSize="10"
                  fontWeight="700"
                >
                  {point.name.length > 20
                    ? point.name.slice(0, 18) + '...'
                    : point.name}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Floating Map Controls (min 44px touch targets) */}
      <div className="absolute bottom-4 right-3 md:right-5 z-30 flex flex-col gap-2">
        <button
          aria-label="Aumentar Zoom do Mapa"
          className="touch-target w-11 h-11 rounded-xl bg-white text-[#121E14] shadow-md hover:bg-neutral-50 active:scale-95 flex items-center justify-center transition-all border border-neutral-200"
          type="button"
          onClick={handleZoomIn}
        >
          <Plus size={20} />
        </button>

        <button
          aria-label="Diminuir Zoom do Mapa"
          className="touch-target w-11 h-11 rounded-xl bg-white text-[#121E14] shadow-md hover:bg-neutral-50 active:scale-95 flex items-center justify-center transition-all border border-neutral-200"
          type="button"
          onClick={handleZoomOut}
        >
          <Minus size={20} />
        </button>

        <button
          aria-label="Recentralizar em Planaltina, Goiás"
          title="Recentralizar em Planaltina, Goiás"
          className="touch-target w-11 h-11 rounded-xl bg-white text-[#355E3B] shadow-md hover:bg-emerald-50 active:scale-95 flex items-center justify-center transition-all border border-[#355E3B]/30"
          type="button"
          onClick={handleResetCenter}
        >
          <Compass size={20} />
        </button>

        <button
          aria-label="Localização atual (no dispositivo)"
          title="Perto de mim (aparelho)"
          className="touch-target w-11 h-11 rounded-xl bg-[#BA623D] text-white shadow-md hover:bg-[#974724] active:scale-95 flex items-center justify-center transition-all"
          type="button"
          onClick={onRequestGeolocation}
        >
          <LocateFixed size={20} />
        </button>

        <button
          aria-label="Alternar visualização de zonas didáticas"
          title="Alternar camadas"
          className={`touch-target w-11 h-11 rounded-xl shadow-md flex items-center justify-center transition-all ${
            showZones
              ? 'bg-[#355E3B] text-white'
              : 'bg-white text-neutral-600 hover:bg-neutral-50'
          }`}
          type="button"
          onClick={() => {
            setShowZones(!showZones);
            showToast(showZones ? 'Áreas didáticas ocultadas' : 'Áreas didáticas exibidas');
          }}
        >
          <Layers size={19} />
        </button>

        <button
          aria-label="Ver Legenda de Procedência dos Dados"
          title="Legenda de Procedência"
          className="touch-target w-11 h-11 rounded-xl bg-[#E5B744] text-[#121E14] shadow-md hover:bg-amber-400 active:scale-95 flex items-center justify-center transition-all font-bold"
          type="button"
          onClick={onOpenProvenanceLegend}
        >
          <ShieldCheck size={20} />
        </button>
      </div>

      {/* Floating Bottom Projection Pill */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm border border-neutral-200/60 hidden sm:flex items-center gap-2">
        <span className="text-[11px] font-semibold text-[#424941]">
          Projeção Cartográfica Fictícia • Planaltina, Goiás
        </span>
        <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-mono">
          SRID 4326
        </span>
      </div>
    </div>
  );
};
