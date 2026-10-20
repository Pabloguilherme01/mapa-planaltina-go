/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { MapPoint, PointCategory, ProvenanceType, CATEGORIES_LIST } from './types/index.ts';
import { fetchPoints } from './services/apiClient.ts';
import { Navbar, ActiveTab } from './components/Navigation/Navbar.tsx';
import { DesktopSidebar } from './components/Sidebar/DesktopSidebar.tsx';
import { MobileBottomSheet } from './components/BottomSheet/MobileBottomSheet.tsx';
import { MobileBottomNav } from './components/Navigation/MobileBottomNav.tsx';
import { MapContainer } from './components/Map/MapContainer.tsx';
import { OfflineBanner } from './components/Common/OfflineBanner.tsx';
import { filterCatalog, type CatalogSort, type VerificationFilter } from './utils/catalogFilters.ts';
import { decodeMapFilters, encodeMapFilters, countActiveFilters } from './utils/filterPermalink.ts';
import { parseThemeChoice, resolveTheme, themeStorageKey, type ThemeChoice } from './utils/themeMode.ts';
import { Loader2, Trees, X } from 'lucide-react';
import { pageRoute, sitePath } from './utils/routing.ts';
import { MobilityHub } from './components/MobilityHub.tsx';
import type { LocalRoute } from './utils/roadGraph.ts';

const SourcesPage = lazy(() =>
  import('./pages/SourcesPage.tsx').then((module) => ({ default: module.SourcesPage }))
);
const PointDetailsModal = lazy(() =>
  import('./components/Modals/PointDetailsModal.tsx').then((module) => ({
    default: module.PointDetailsModal,
  }))
);
const GeolocationConsentModal = lazy(() =>
  import('./components/Modals/GeolocationConsentModal.tsx').then((module) => ({
    default: module.GeolocationConsentModal,
  }))
);
const AssistantDrawer = lazy(() =>
  import('./components/Drawer/AssistantDrawer.tsx').then((module) => ({
    default: module.AssistantDrawer,
  }))
);

function LoadingSurface({ label }: { label: string }) {
  return (
    <div
      role="status"
      className="fixed inset-0 z-40 flex items-center justify-center gap-2 bg-[#F5F0E6]/85 text-sm font-semibold text-[#355E3B] backdrop-blur-sm"
    >
      <Loader2 size={18} className="animate-spin" />
      {label}
    </div>
  );
}

function readInitialFilters() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  return decodeMapFilters(params);
}

export default function App() {
  const [initialFilters] = useState(readInitialFilters);
  const [shareNotice, setShareNotice] = useState('');
  const [allPoints, setAllPoints] = useState<MapPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [routePreview, setRoutePreview] = useState<LocalRoute | null>(null);
  const [routePickMode, setRoutePickMode] = useState<'origin' | 'destination' | null>(null);
  const [mapOrigin, setMapOrigin] = useState<{lat:number;lng:number} | null>(null);
  const [mapDestination, setMapDestination] = useState<{lat:number;lng:number} | null>(null);
  const onMapCoordinatePicked = (position: {lat:number;lng:number}) => {
    if (routePickMode === 'origin') setMapOrigin(position);
    if (routePickMode === 'destination') setMapDestination(position);
    setRoutePickMode(null);
  };

  // Real URL routing: / and /fontes
  const [currentRoute, setCurrentRoute] = useState<string>(
    typeof window !== 'undefined' ? pageRoute(window.location.pathname) : '/'
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>(
    currentRoute === '/fontes' ? 'sources' : 'map'
  );

  const [searchQuery, setSearchQuery] = useState<string>(initialFilters.search);
  const [selectedCategories, setSelectedCategories] = useState<PointCategory[]>(initialFilters.categories);
  const [selectedProvenance, setSelectedProvenance] = useState<ProvenanceType | 'all'>(initialFilters.origin);
  const [selectedKind, setSelectedKind] = useState(initialFilters.kind);
  const [selectedZone, setSelectedZone] = useState(initialFilters.zone);
  const [verification, setVerification] = useState<VerificationFilter>(initialFilters.verification);
  const [sort, setSort] = useState<CatalogSort>(initialFilters.sort);
  const [radiusKm, setRadiusKm] = useState(0);
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>(() => {
    try { return parseThemeChoice(localStorage.getItem(themeStorageKey)); } catch { return 'system'; }
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Modals state
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isGeoConsentOpen, setIsGeoConsentOpen] = useState<boolean>(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);

  // Mobile notification banner dismissible state
  const [showWelcomeBanner, setShowWelcomeBanner] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);

  // Network and data states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const value = resolveTheme(themeChoice, media.matches);
      document.documentElement.dataset.theme = value;
      document.documentElement.style.colorScheme = value;
    };
    apply();
    media.addEventListener('change', apply);
    try { localStorage.setItem(themeStorageKey, themeChoice); } catch { /* navegação privada */ }
    return () => media.removeEventListener('change', apply);
  }, [themeChoice]);

  // Handle browser Back / Forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const path = pageRoute(window.location.pathname);
      setCurrentRoute(path);
      setActiveTab(path === '/fontes' ? 'sources' : 'map');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: '/' | '/fontes') => {
    window.history.pushState({}, '', sitePath(path, import.meta.env.BASE_URL));
    setCurrentRoute(path);
    setActiveTab(path === '/fontes' ? 'sources' : 'map');
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const resp = await fetchPoints();
      setAllPoints(resp.data);
    } catch (err) {
      console.error('Falha ao obter pontos:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compartilhar buscas sem nunca incluir coordenadas do usuário ou raio GPS na URL.
  useEffect(() => {
    if (currentRoute !== '/' || typeof window === 'undefined') return;
    const params = encodeMapFilters({
      search: searchQuery, categories: selectedCategories, origin: selectedProvenance,
      verification, kind: selectedKind, zone: selectedZone, sort,
    }, new URLSearchParams(window.location.search));
    const query = params.toString();
    window.history.replaceState(window.history.state, '', window.location.pathname +
      (query ? '?' + query : '') + window.location.hash);
  }, [currentRoute, searchQuery, selectedCategories, selectedProvenance, verification, selectedKind, selectedZone, sort]);

  const filterCount = countActiveFilters({
    search: searchQuery, categories: selectedCategories, origin: selectedProvenance,
    verification, kind: selectedKind, zone: selectedZone, sort,
  }) + Number(radiusKm > 0 && Boolean(userLocation));

  const clearAllFilters = () => {
    setSearchQuery(''); setSelectedCategories([]); setSelectedProvenance('all');
    setSelectedKind(''); setSelectedZone(''); setVerification('all');
    setSort('default'); setRadiusKm(0); setShareNotice('');
  };
  const shareMapFilters = async () => {
    const url = new URL(sitePath('/', import.meta.env.BASE_URL), window.location.origin);
    url.search = encodeMapFilters({
      search: searchQuery, categories: selectedCategories, origin: selectedProvenance,
      verification, kind: selectedKind, zone: selectedZone, sort,
    }).toString();
    try {
      await navigator.clipboard.writeText(url.href);
      setShareNotice('Link de filtros copiado. Sua posição não foi incluída.');
    } catch {
      setShareNotice('Cópia indisponível neste navegador. Utilize o endereço da página.');
    }
  };

  // Keyboard shortcut Ctrl+K or Cmd+K to focus the visible search field.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchId = window.matchMedia('(min-width: 1024px)').matches
          ? 'search-input'
          : 'mobile-search-input';
        document.getElementById(searchId)?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleCategory = (category: PointCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      }
      return [...prev, category];
    });
  };

  const handleSelectAllCategories = () => {
    setSelectedCategories([]);
  };

  const filteredPoints = useMemo(
    () => filterCatalog(allPoints, {
      categories: selectedCategories, origin: selectedProvenance,
      verification, kind: selectedKind, zone: selectedZone,
      search: searchQuery, sort, radiusKm, userLocation,
    }),
    [allPoints, selectedCategories, selectedProvenance, verification, selectedKind,
      selectedZone, searchQuery, sort, radiusKm, userLocation]
  );

  const kindOptions = useMemo(() =>
    [...new Set(allPoints.flatMap(point => point.tags.filter(tag => tag.startsWith('Tipo: ')).map(tag => tag.slice(6))))]
      .sort((a, b) => a.localeCompare(b, 'pt-BR')), [allPoints]);
  const zoneOptions = useMemo(() =>
    [...new Set(allPoints.map(point => point.zone))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [allPoints]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES_LIST.forEach((cat) => {
      counts[cat] = allPoints.filter((p) => p.category === cat).length;
    });
    return counts;
  }, [allPoints]);

  const handleSelectPoint = (point: MapPoint | null) => {
    setSelectedPoint(point);
  };

  const handleOpenPointDetails = (point: MapPoint) => {
    setSelectedPoint(point);
    setIsDetailsOpen(true);
  };

  const handleTabSelect = (tab: ActiveTab) => {
    if (tab === 'sources') {
      navigateTo('/fontes');
    } else {
      if (currentRoute === '/fontes') {
        navigateTo('/');
      }
      setActiveTab(tab);
      if (tab === 'assistant') setIsAssistantOpen(true);
    }
  };

  const handleSelectPointById = (id: string) => {
    const pt = allPoints.find((p) => p.id === id);
    if (pt) {
      if (currentRoute === '/fontes') navigateTo('/');
      setSelectedPoint(pt);
      setIsDetailsOpen(true);
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col font-sans overflow-hidden ${
        highContrast ? 'contrast-125 saturate-150 bg-neutral-900 text-white' : 'bg-[#F5F0E6] text-[#121E14]'
      }`}
    >
      <OfflineBanner />

      <Navbar
        realCount={allPoints.filter(point => !point.isDemo).length}
        demoCount={allPoints.filter(point => point.isDemo).length}
        activeTab={activeTab}
        onSelectTab={handleTabSelect}
        onRequestGeolocation={() => setIsGeoConsentOpen(true)}
        themeChoice={themeChoice}
        onThemeChange={setThemeChoice}
        highContrast={highContrast}
        onToggleHighContrast={() => setHighContrast(!highContrast)}
      />

      {currentRoute === '/fontes' ? (
        <Suspense fallback={<LoadingSurface label="Carregando fontes…" />}>
          <SourcesPage onBackToMap={() => navigateTo('/')} />
        </Suspense>
      ) : (
        <div className="flex-1 w-full pt-16 lg:pt-24 pb-16 lg:pb-0 flex overflow-hidden relative">
          <div className="hidden lg:flex h-[calc(100vh-6rem)]">
            <DesktopSidebar
              points={filteredPoints}
              selectedPoint={selectedPoint}
              onSelectPoint={handleSelectPoint}
              onOpenPointDetails={handleOpenPointDetails}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategories={selectedCategories}
              onToggleCategory={handleToggleCategory}
              onSelectAllCategories={handleSelectAllCategories}
              categoryCounts={categoryCounts}
              selectedProvenance={selectedProvenance}
              onSelectProvenance={setSelectedProvenance}
              kindOptions={kindOptions}
              selectedKind={selectedKind}
              onSelectKind={setSelectedKind}
              zoneOptions={zoneOptions}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              verification={verification}
              onVerificationChange={setVerification}
              sort={sort}
              onSortChange={setSort}
              radiusKm={radiusKm}
              onRadiusChange={setRadiusKm}
              hasLocation={Boolean(userLocation)}
              activeFilterCount={filterCount}
              onClearAllFilters={clearAllFilters}
              onShareFilters={shareMapFilters}
              shareFeedback={shareNotice}
              isLoading={isLoading}
              isError={isError}
              onRetry={loadData}
            />
          </div>

          <main
            className="flex-1 h-[calc(100vh-6rem)] relative overflow-hidden flex flex-col"
            role="main"
            aria-label="Área principal do mapa"
          >
            {showWelcomeBanner && (
              <div className="lg:hidden absolute top-2 inset-x-3 z-30 pointer-events-auto">
                <div className="bg-[#EAE3D2] rounded-2xl p-3 flex items-start gap-2.5 shadow-md border border-[#355E3B]/20">
                  <div className="w-8 h-8 rounded-xl bg-[#355E3B]/10 text-[#355E3B] flex items-center justify-center shrink-0">
                    <Trees size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#121E14]">
                      Território do Cerrado Goiano
                    </p>
                    <p className="text-[11px] text-[#424941] leading-tight">
                      Visualizador cadastral de Planaltina, Goiás. Locais reais geolocalizados em Planaltina-GO, com origem e qualidade de cada cadastro identificadas.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWelcomeBanner(false)}
                    className="touch-target w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-neutral-900 -mr-1 -mt-1"
                    aria-label="Fechar aviso"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            )}

            <div className="w-full h-full">
              <MapContainer
                points={filteredPoints}
                selectedPoint={selectedPoint}
                onSelectPoint={handleSelectPoint}
                onOpenProvenanceLegend={() => navigateTo('/fontes')}
                onRequestGeolocation={() => setIsGeoConsentOpen(true)}
                userLocation={userLocation}
                routePreview={routePreview}
                onClearRoute={() => setRoutePreview(null)}
                routePickMode={routePickMode}
                onMapCoordinatePicked={onMapCoordinatePicked}
                onCancelMapPick={() => setRoutePickMode(null)}
              />
            </div>

            <MobileBottomSheet
              selectedProvenance={selectedProvenance}
              onSelectProvenance={setSelectedProvenance}
              kindOptions={kindOptions}
              selectedKind={selectedKind}
              onSelectKind={setSelectedKind}
              zoneOptions={zoneOptions}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              verification={verification}
              onVerificationChange={setVerification}
              sort={sort}
              onSortChange={setSort}
              radiusKm={radiusKm}
              onRadiusChange={setRadiusKm}
              hasLocation={Boolean(userLocation)}
              activeFilterCount={filterCount}
              onClearAllFilters={clearAllFilters}
              onShareFilters={shareMapFilters}
              shareFeedback={shareNotice}
              points={filteredPoints}
              selectedPoint={selectedPoint}
              onSelectPoint={handleSelectPoint}
              onOpenPointDetails={handleOpenPointDetails}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategories={selectedCategories}
              onToggleCategory={handleToggleCategory}
              onSelectAllCategories={handleSelectAllCategories}
              categoryCounts={categoryCounts}
            />
            <MobilityHub points={allPoints} selectedPoint={selectedPoint}
              userLocation={userLocation} onRoutePreview={setRoutePreview}
              mapOrigin={mapOrigin} mapDestination={mapDestination}
              onRequestMapPick={setRoutePickMode} />
          </main>
        </div>
      )}

      <MobileBottomNav activeTab={activeTab} onSelectTab={handleTabSelect} />

      {isDetailsOpen && selectedPoint && (
        <Suspense fallback={<LoadingSurface label="Carregando ficha…" />}>
          <PointDetailsModal
            point={selectedPoint}
            onClose={() => setIsDetailsOpen(false)}
          />
        </Suspense>
      )}

      {isGeoConsentOpen && (
        <Suspense fallback={<LoadingSurface label="Carregando geolocalização…" />}>
          <GeolocationConsentModal
            isOpen={isGeoConsentOpen}
            onClose={() => setIsGeoConsentOpen(false)}
            onSuccessLocation={(coords) => {
              setUserLocation(coords);
            }}
          />
        </Suspense>
      )}

      {isAssistantOpen && (
        <Suspense fallback={<LoadingSurface label="Carregando assistente…" />}>
          <AssistantDrawer
            isOpen={isAssistantOpen}
            onClose={() => {
              setIsAssistantOpen(false);
              setActiveTab('map');
            }}
            onSelectPointById={handleSelectPointById}
            allPoints={allPoints}
          />
        </Suspense>
      )}
    </div>
  );
}
