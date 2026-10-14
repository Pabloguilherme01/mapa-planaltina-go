import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('contratos de refinamento da interface', () => {
  it('não bloqueia seleção de texto no shell principal', () => {
    expect(read('src/App.tsx')).not.toContain('select-none');
  });

  it('mantém o simulador de estados do Stitch somente em desenvolvimento', () => {
    const source = read('src/components/Sidebar/DesktopSidebar.tsx');
    expect(source).toContain('import.meta.env.DEV');
    expect(source).toContain('showStateSimulator');
  });

  it('expõe relações e rótulos acessíveis no bottom sheet móvel', () => {
    const source = read('src/components/BottomSheet/MobileBottomSheet.tsx');
    expect(source).toContain('htmlFor="mobile-search-input"');
    expect(source).toContain('id="mobile-search-input"');
    expect(source).toContain('aria-expanded={isExpanded}');
    expect(source).toContain('aria-controls="mobile-points-list"');
    expect(source).toContain('id="mobile-points-list"');
    expect(source).toContain('aria-label="Limpar busca"');
  });

  it('registra service worker somente em produção e dentro do base path do Pages', () => {
    const source = read('src/main.tsx');
    expect(source).toContain('import.meta.env.PROD');
    expect(source).toContain('import.meta.env.BASE_URL');
    expect(source).toContain("'serviceWorker' in navigator");
    expect(source).toContain('.register(`${import.meta.env.BASE_URL}sw.js`');
  });

  it('só promete cache offline quando há service worker controlando a página', () => {
    const source = read('src/components/Common/OfflineBanner.tsx');
    expect(source).toContain('navigator.serviceWorker?.controller');
    expect(source).toContain('controllerchange');
    expect(source).toContain('snapshots locais');
  });

  it('mantém Google Maps fora do bundle inicial e carrega o provider sob demanda', () => {
    const source = read('src/components/Map/MapContainer.tsx');
    expect(source).not.toContain("import { GoogleMapsProvider } from './GoogleMapsProvider.tsx'");
    expect(source).toContain("import('./GoogleMapsProvider.tsx')");
    expect(source).toContain('lazy(');
    expect(source).toContain('<Suspense');
  });

  it('carrega rotas e superfícies secundárias sob demanda no App', () => {
    const source = read('src/App.tsx');
    expect(source).toContain("import('./pages/SourcesPage.tsx')");
    expect(source).toContain("import('./components/Modals/PointDetailsModal.tsx')");
    expect(source).toContain("import('./components/Modals/GeolocationConsentModal.tsx')");
    expect(source).toContain("import('./components/Drawer/AssistantDrawer.tsx')");
    expect(source).toContain('<Suspense');
  });

  it('usa gerenciamento compartilhado de foco nos diálogos de consentimento e assistente', () => {
    const geo = read('src/components/Modals/GeolocationConsentModal.tsx');
    const assistant = read('src/components/Drawer/AssistantDrawer.tsx');
    expect(geo).toContain('useDialogFocus');
    expect(assistant).toContain('useDialogFocus');
  });
});
