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
});
