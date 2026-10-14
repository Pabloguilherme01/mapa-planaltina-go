import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [hasOfflineCache, setHasOfflineCache] = useState<boolean>(
    typeof navigator !== 'undefined' ? Boolean(navigator.serviceWorker?.controller) : false
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleControllerChange = () => {
      setHasOfflineCache(Boolean(navigator.serviceWorker?.controller));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    navigator.serviceWorker?.addEventListener('controllerchange', handleControllerChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-24 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)] bg-[#78350F] text-[#FFF9E6] px-4 py-2 rounded-2xl shadow-xl flex items-start gap-2 text-xs font-bold border border-amber-300"
    >
      <WifiOff size={16} className="mt-0.5 shrink-0" />
      <span>
        {hasOfflineCache
          ? 'Sem conexão: o mapa esquemático, a página de fontes e os snapshots locais do último acesso continuam disponíveis. Recursos externos podem ficar indisponíveis.'
          : 'Sem conexão: recursos online podem ficar indisponíveis. O conteúdo já carregado nesta sessão permanece disponível.'}
      </span>
    </div>
  );
};
