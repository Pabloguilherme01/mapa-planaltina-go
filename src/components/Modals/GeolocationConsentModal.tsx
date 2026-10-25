import React, { useEffect, useRef, useState } from 'react';
import { Share2, ShieldCheck, AlertCircle, X } from 'lucide-react';
import { useDialogFocus } from '../../hooks/useDialogFocus.ts';
import { createLocationRequestGuard } from '../../utils/geolocationRequestGuard.ts';

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const requestGuard = useRef(createLocationRequestGuard());
  const closeConsent = () => {
    requestGuard.current.cancel();
    setIsLocating(false);
    setErrorMessage(null);
    onClose();
  };
  useDialogFocus(isOpen, closeConsent, dialogRef);
  useEffect(() => {
    // Invalida o callback mesmo se o pai fechar/desmontar o modal.
    return () => requestGuard.current.cancel();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPosition = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocalização não é suportada pelo seu navegador.');
      return;
    }

    const request = requestGuard.current.begin();
    setIsLocating(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!request.isCurrent()) return;
        setIsLocating(false);
        onSuccessLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        closeConsent();
      },
      (err) => {
        if (!request.isCurrent()) return;
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
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="geoConsentTitle"
      aria-describedby="geoConsentDescription"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-in fade-in focus:outline-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeConsent();
      }}
    >
      <div className="w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 border border-neutral-200">
        <div className="flex justify-end -mr-2 -mt-2">
          <button
            type="button"
            onClick={closeConsent}
            className="touch-target min-w-11 min-h-11 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-700"
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
          <p id="geoConsentDescription" className="text-sm text-neutral-600 leading-relaxed">
            A permissão é opcional e a posição é usada nesta sessão para mostrar sua região. O aplicativo não grava suas coordenadas nem as envia diretamente à IA. Ao carregar mapas, provedores externos podem receber solicitações da área visualizada.
          </p>
        </div>

        <div className="bg-[#EAE3D2]/60 rounded-xl p-3 flex items-start gap-2 border border-[#355E3B]/10">
          <ShieldCheck size={18} className="text-[#355E3B] shrink-0 mt-0.5" />
          <p className="text-xs text-[#424941] leading-relaxed">
            <strong>Planaltina, Goiás:</strong> você pode continuar usando o mapa sem ativar o GPS. Fechar esta janela cancela o uso de qualquer resposta de localização ainda pendente.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800"
          >
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
            onClick={closeConsent}
            className="touch-target w-full min-h-[44px] rounded-xl bg-neutral-100 text-neutral-700 text-xs font-semibold hover:bg-neutral-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
