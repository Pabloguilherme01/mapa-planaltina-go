import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#78350F] text-[#FFF9E6] px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-xs font-bold border border-amber-300"
    >
      <WifiOff size={16} />
      <span>Modo Offline: Operando com dados cartográficos em cache local.</span>
    </div>
  );
};
