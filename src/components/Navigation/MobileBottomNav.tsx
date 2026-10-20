import React from 'react';
import { ActiveTab } from './Navbar.tsx';
import { Map as MapIcon, Bot, FileText } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const tabs = [
    { id: 'map' as ActiveTab, label: 'Mapa', icon: MapIcon },
    { id: 'assistant' as ActiveTab, label: 'Assistente', icon: Bot },
    { id: 'sources' as ActiveTab, label: 'Serviços', icon: FileText },
  ];

  return (
    <nav
      aria-label="Navegação móvel"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-neutral-200 shadow-[0_-2px_12px_rgba(30,43,32,0.08)]"
    >
      <div className="flex justify-around items-center h-16 px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComp = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`touch-target flex flex-col items-center justify-center min-w-[44px] min-h-[44px] w-20 h-14 transition-all ${
                isActive
                  ? 'text-[#355E3B] font-extrabold scale-105'
                  : 'text-neutral-500 hover:text-neutral-800 font-medium'
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.id === 'sources' ? 'Fontes e serviços digitais' : undefined}
            >
              <IconComp size={22} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
              <span className="text-[11px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
