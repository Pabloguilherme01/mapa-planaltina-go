export const GOOGLE_MAPS_UNAVAILABLE_EVENT = 'gmp-map-unavailable';

const QUOTA_ERROR_MARKERS = ['OverQuotaMapError', 'QuotaExceededError'] as const;

type MutableErrorConsole = {
  error: (...args: unknown[]) => void;
};

export function isGoogleMapsQuotaError(args: unknown[]): boolean {
  const message = args
    .map((value) => {
      if (value instanceof Error) return `${value.name}: ${value.message}`;
      if (typeof value === 'string') return value;
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    })
    .join(' ');

  return QUOTA_ERROR_MARKERS.some((marker) => message.includes(marker));
}

export function signalGoogleMapsUnavailable(): void {
  window.dispatchEvent(new CustomEvent(GOOGLE_MAPS_UNAVAILABLE_EVENT));
}

export function installGoogleMapsQuotaConsoleBridge(
  targetConsole: MutableErrorConsole,
  signalQuota: () => void
): () => void {
  const originalError = targetConsole.error;
  const patchedError = (...args: unknown[]) => {
    originalError.apply(targetConsole, args);
    if (isGoogleMapsQuotaError(args)) signalQuota();
  };

  targetConsole.error = patchedError;

  return () => {
    if (targetConsole.error === patchedError) {
      targetConsole.error = originalError;
    }
  };
}
