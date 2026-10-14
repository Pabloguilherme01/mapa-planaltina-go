import React, { useState } from 'react';
import { Share2, ShieldCheck, AlertCircle, X } from 'lucide-react';

interface GeolocationConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLocation: (coords: { lat: number; lng: number }) => void;
}

export const GeolocationConsentModal: React.FC<GeolocationConsentModalProps> = ({
  isOpen,
  onClose,
  onSuccessLocation,
}) => {
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestPosition = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocalização não é suportada pelo seu navegador.');
      return;
    }

    setIsLocating(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        onSuccessLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        onClose();
      },
      (err) => {
        setIsLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setErrorMessage(
              'Permissão de geolocalização negada. O mapa continuará centrado no ponto oficial de Planaltina, Goiás.'
            );
            break;
          case err.POSITION_UNAVAILABLE:
            setErrorMessage(
              'Sinal de GPS ou serviço de localização indisponível no dispositivo.'
            );
            break;
          case err.TIMEOUT:
            setErrorMessage(
              'O tempo limite para obter a localização no aparelho expirou. Tente novamente.'
            );
            break;
          default:
            setErrorMessage('Não foi possível obter sua localização no dispositivo.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="geoConsentTitle"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl flex flex-col gap-4 border border-neutral-200">
        <div className="flex justify-end -mr-2 -mt-2">
          <button
            type="button"
            onClick={onClose}
            className="touch-target w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#BA623D]/15 text-[#BA623D] flex items-center justify-center mx-auto -mt-3">
          <Share2 size={26} />
        </div>

        <div className="text-center flex flex-col gap-1.5">
          <h3 id="geoConsentTitle" className="text-base font-bold text-[#121E14]">
            Ativar Geolocalização?
          </h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            A posição é calculada <strong>exclusivamente no seu aparelho</strong>. Nenhum dado de GPS é armazenado, persistido ou transmitido a servidores ou IA.
          </p>
        </div>

        <div className="bg-[#EAE3D2]/60 rounded-xl p-3 flex items-start gap-2 border border-[#355E3B]/10">
          <ShieldCheck size={18} className="text-[#355E3B] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#424941] leading-tight">
            Garantia de privacidade territorial de <strong>Planaltina, Goiás</strong>: localização temporária em memória voltada apenas para recentralizar o mapa.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            disabled={isLocating}
            onClick={handleRequestPosition}
            className="touch-target w-full min-h-[44px] rounded-xl bg-[#355E3B] text-white text-xs font-bold shadow-md hover:bg-[#27472c] active:scale-95 transition-all disabled:opacity-50"
          >
            {isLocating ? 'Obtendo posição...' : 'Permitir no Dispositivo'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="touch-target w-full min-h-[44px] rounded-xl bg-neutral-100 text-neutral-700 text-xs font-semibold hover:bg-neutral-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
