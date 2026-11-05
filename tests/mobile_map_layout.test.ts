import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/index.css', 'utf8');
const geographic = readFileSync('src/components/Map/GeographicMapProvider.tsx', 'utf8');
const mobileNav = readFileSync('src/components/Navigation/MobileBottomNav.tsx', 'utf8');

describe('experiência mobile: mapa, catálogo e GPS', () => {
  it('não desperdiça 166 px dentro da lista expandida', () => {
    const rule = css.match(/\.catalog-expanded\s*\{([^}]+)\}/)?.[1] ?? '';
    expect(rule).toContain('height: min(72dvh, 720px)');
    expect(rule).not.toContain('padding-bottom: 166px');
    // O espaçamento sob o mapa recolhido permanece para não cobrir os pins.
    expect(css).toContain('.catalog-collapsed { height: 166px; }');
  });

  it('separa controles de zoom e botão de planejamento nas duas larguras', () => {
    expect(css).toMatch(/\.map-workspace \.leaflet-control-zoom\s*\{\s*margin-top:\s*184px\s*!important/);
    expect(css).toMatch(/@media \(max-width: 1023px\)[\s\S]*?\.map-workspace \.leaflet-control-zoom\s*\{\s*margin-top:\s*148px\s*!important/);
  });

  it('centraliza a posição apenas depois de GPS explicitamente autorizado', () => {
    expect(geographic).toContain('if (!userLocation || !map.current) return');
    expect(geographic).toContain('map.current.setView([userLocation.lat, userLocation.lng]');
    expect(geographic).toContain('animate: false');
  });

  it('não confunde o atalho de fontes com uma listagem de estabelecimentos', () => {
    expect(mobileNav).toContain("label: 'Fontes', icon: FileText");
    expect(mobileNav).not.toContain("label: 'Serviços', icon: FileText");
  });
});
