import React from 'react';
import {
  Wrench,
  Tag,
  LocateFixed,
  Contrast,
  Bot,
  FileText,
  Map as MapIcon,
  HelpCircle,
} from 'lucide-react';

export type ActiveTab = 'map' | 'assistant' | 'sources';

interface NavbarProps {
  realCount?: number;
  demoCount?: number;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onRequestGeolocation: () => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  realCount = 0,
  demoCount = 0,
  activeTab,
  onSelectTab,
  onRequestGeolocation,
  highContrast,
  onToggleHighContrast,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col bg-[#F5F0E6] shadow-sm">
      {/* Top Banner Alert (Mandatory DEMO warning) */}
      <div className="w-full bg-[#FFF9E6] border-b border-[#E5B744]/40 px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2 mx-auto text-center">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E5B744] text-[#121E14] text-[11px] uppercase font-extrabold tracking-wider">
            <Wrench size={12} />
            Catálogo
          </span>
          <p className="text-xs text-[#78350F] font-semibold">
            {realCount} locais mapeados {demoCount > 0 ? `• ${demoCount} DEMO` : '• catálogo real'}. Pontos comunitários podem não estar verificados; confira a fonte.
          </p>
        </div>
      </div>

      {/* Main Bar in Cerrado Green (#355E3B) */}
      <div className="h-16 w-full px-3 lg:px-6 flex items-center justify-between gap-2 bg-[#355E3B] text-white">
        {/* Brand & Identity */}
        <div className="flex items-center gap-4 lg:gap-6">
          <button
            type="button"
            onClick={() => onSelectTab('map')}
            className="flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-[#BA623D] rounded-lg p-1"
          >
            <div className="hidden sm:flex w-10 h-10 shrink-0 rounded-xl bg-[#27472c] border border-white/20 items-center justify-center text-[#E5B744] font-extrabold text-xl shadow-sm">
              <MapIcon size={22} />
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-lg whitespace-nowrap font-extrabold tracking-tight text-white font-sans">
                  Mapa Planaltina
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#27472c] text-white text-[11px] uppercase font-bold tracking-wider">
                  GO
                </span>
              </div>
              <span className="text-xs text-white/80 font-medium">
                Planaltina, Goiás
              </span>
            </div>
          </button>

          {/* Desktop Navigation Tabs for Citizens */}
          <nav
            aria-label="Navegação principal"
            className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-black/15"
          >
            <button
              type="button"
              onClick={() => onSelectTab('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'map'
                  ? 'bg-[#27472c] text-white shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Mapa Interativo
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('assistant')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'assistant'
                  ? 'bg-[#27472c] text-white shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Bot size={14} />
              <span>Assistente Cívico</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('sources')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'sources'
                  ? 'bg-[#27472c] text-white shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText size={14} />
              <span>Fontes e Transparência</span>
            </button>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* IBGE 5217609 Pill */}
          <a
            href="https://www.ibge.gov.br/cidades-e-estados/go/planaltina.html"
            target="_blank"
            rel="noopener noreferrer"
            title="Conferir município no portal oficial do IBGE"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold hover:bg-white/25 transition-colors"
          >
            <Tag size={13} />
            <span>IBGE 5217609</span>
          </a>

          {/* Perto de Mim Geolocation Button (44px target) */}
          <button
            type="button"
            onClick={onRequestGeolocation}
            className="touch-target flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#BA623D] text-white text-xs font-bold shadow-sm hover:bg-[#a35230] active:scale-95 transition-all"
            title="Localizar no dispositivo (privado, não enviado ao servidor)"
          >
            <LocateFixed size={16} />
            <span className="hidden sm:inline">Perto de mim</span>
          </button>

          {/* High Contrast Toggle */}
          <button
            type="button"
            onClick={onToggleHighContrast}
            aria-label="Alternar modo de alto contraste"
            className={`touch-target w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              highContrast ? 'bg-amber-400 text-black' : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            <Contrast size={18} />
          </button>

          {/* Fontes Shortcut */}
          <button
            type="button"
            onClick={() => onSelectTab('sources')}
            aria-label="Ver informações de fontes"
            className="touch-target w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center hover:bg-white/25 transition-colors"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
