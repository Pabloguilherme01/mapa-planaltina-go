/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapPoint, PointCategory, ProvenanceType, CATEGORIES_LIST } from './types/index.ts';
import { fetchPoints } from './services/apiClient.ts';
import { Navbar, ActiveTab } from './components/Navigation/Navbar.tsx';
import { DesktopSidebar } from './components/Sidebar/DesktopSidebar.tsx';
import { MobileBottomSheet } from './components/BottomSheet/MobileBottomSheet.tsx';
import { MobileBottomNav } from './components/Navigation/MobileBottomNav.tsx';
import { MapContainer } from './components/Map/MapContainer.tsx';
import { PointDetailsModal } from './components/Modals/PointDetailsModal.tsx';
import { SourcesPage } from './pages/SourcesPage.tsx';
import { GeolocationConsentModal } from './components/Modals/GeolocationConsentModal.tsx';
import { AssistantDrawer } from './components/Drawer/AssistantDrawer.tsx';
import { OfflineBanner } from './components/Common/OfflineBanner.tsx';
import { normalizeText } from '../server/repository/PointsRepository.ts';
import { Trees, X } from 'lucide-react';
import { pageRoute, sitePath } from './utils/routing.ts';

export default function App() {
  const [allPoints, setAllPoints] = useState<MapPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  // Real URL routing: / and /fontes
  const [currentRoute, setCurrentRoute] = useState<string>(
    typeof window !== 'undefined' ? pageRoute(window.location.pathname) : '/'
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>(
    currentRoute === '/fontes' ? 'sources' : 'map'
  );

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<PointCategory[]>([]);
  const [selectedProvenance, setSelectedProvenance] = useState<ProvenanceType | 'all'>('all');
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

  // Keyboard shortcut Ctrl+K or Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchEl = document.getElementById('search-input');
        searchEl?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Category toggles
  const handleToggleCategory = (category: PointCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleSelectAllCategories = () => {
    setSelectedCategories([]);
  };

  // Instant Unaccented & Multi-attribute Filtering
  const filteredPoints = useMemo(() => {
    let result = [...allPoints];

    // Filter by categories if any selected
    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }

    // Filter by provenance if selected
    if (selectedProvenance !== 'all') {
      result = result.filter(
        (p) => p.provenanceMeta.provenance === selectedProvenance
      );
    }

    // Filter by search query without accents
    if (searchQuery.trim().length > 0) {
      const q = normalizeText(searchQuery);
      result = result.filter((p) => {
        const nameN = normalizeText(p.name);
        const descN = normalizeText(p.description);
        const catN = normalizeText(p.category);
        const tagsN = p.tags.map(normalizeText).join(' ');
        const addrN = normalizeText(p.addressHint || '');
        return (
          nameN.includes(q) ||
          descN.includes(q) ||
          catN.includes(q) ||
          tagsN.includes(q) ||
          addrN.includes(q)
        );
      });
    }

    return result;
  }, [allPoints, selectedCategories, selectedProvenance, searchQuery]);

  // Category counts
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
      className={`min-h-screen w-full flex flex-col font-sans select-none overflow-hidden ${
        highContrast ? 'contrast-125 saturate-150 bg-neutral-900 text-white' : 'bg-[#F5F0E6] text-[#121E14]'
      }`}
    >
      <OfflineBanner />

      {/* Main Top Navigation & DEMO Warning */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleTabSelect}
        onRequestGeolocation={() => setIsGeoConsentOpen(true)}
        highContrast={highContrast}
        onToggleHighContrast={() => setHighContrast(!highContrast)}
      />

      {/* If current route is /fontes, render real SourcesPage */}
      {currentRoute === '/fontes' ? (
        <SourcesPage onBackToMap={() => navigateTo('/')} />
      ) : (
        /* Protagonist Workspace: Sidebar Desktop + Map Protagonist + Mobile Bottom Sheet */
        <div className="flex-1 w-full pt-28 lg:pt-24 pb-16 lg:pb-0 flex overflow-hidden relative">
          {/* Desktop Sidebar (hidden on mobile) */}
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
              isLoading={isLoading}
              isError={isError}
              onRetry={loadData}
            />
          </div>

          {/* Map Container Area (Protagonist) */}
          <main
            className="flex-1 h-[calc(100vh-6rem)] relative overflow-hidden flex flex-col"
            role="main"
            aria-label="Área principal do mapa"
          >
            {/* Mobile Floating Welcome Card */}
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
                      Visualizador cadastral de Planaltina, Goiás. Registros ilustrativos com rigor cartográfico conceitual.
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

            {/* Core Interactive Map */}
            <div className="w-full h-full">
              <MapContainer
                points={filteredPoints}
                selectedPoint={selectedPoint}
                onSelectPoint={handleSelectPoint}
                onOpenProvenanceLegend={() => navigateTo('/fontes')}
                onRequestGeolocation={() => setIsGeoConsentOpen(true)}
                userLocation={userLocation}
              />
            </div>

            {/* Mobile Bottom Sheet (Always shows search & 9 categories) */}
            <MobileBottomSheet
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
          </main>
        </div>
      )}

      {/* Mobile Fixed Bottom Nav Tabs (Mapa, Assistente, Fontes) */}
      <MobileBottomNav activeTab={activeTab} onSelectTab={handleTabSelect} />

      {/* Modals & Drawers */}
      <PointDetailsModal
        point={selectedPoint && isDetailsOpen ? selectedPoint : null}
        onClose={() => setIsDetailsOpen(false)}
      />

      <GeolocationConsentModal
        isOpen={isGeoConsentOpen}
        onClose={() => setIsGeoConsentOpen(false)}
        onSuccessLocation={(coords) => {
          setUserLocation(coords);
        }}
      />

      <AssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => {
          setIsAssistantOpen(false);
          setActiveTab('map');
        }}
        onSelectPointById={handleSelectPointById}
        allPoints={allPoints}
      />
    </div>
  );
}
