import { describe, expect, it, vi } from 'vitest';
import {
  installGoogleMapsQuotaConsoleBridge,
  isGoogleMapsQuotaError,
} from '../src/utils/googleMapsErrors.ts';

describe('Google Maps quota error bridge', () => {
  it('reconhece apenas mensagens de quota conhecidas', () => {
    expect(isGoogleMapsQuotaError(['OverQuotaMapError'])).toBe(true);
    expect(isGoogleMapsQuotaError([new Error('QuotaExceededError')])).toBe(true);
    expect(isGoogleMapsQuotaError(['Falha comum de rede'])).toBe(false);
  });

  it('encaminha console.error, sinaliza quota e restaura o console no cleanup', () => {
    const originalError = vi.fn();
    const targetConsole = { error: originalError };
    const signalQuota = vi.fn();

    const cleanup = installGoogleMapsQuotaConsoleBridge(targetConsole, signalQuota);
    const patchedError = targetConsole.error;

    expect(patchedError).not.toBe(originalError);

    targetConsole.error('Falha comum');
    expect(originalError).toHaveBeenCalledWith('Falha comum');
    expect(signalQuota).not.toHaveBeenCalled();

    targetConsole.error('Google Maps:', 'OverQuotaMapError');
    expect(originalError).toHaveBeenLastCalledWith('Google Maps:', 'OverQuotaMapError');
    expect(signalQuota).toHaveBeenCalledTimes(1);

    cleanup();
    expect(targetConsole.error).toBe(originalError);
  });
});
