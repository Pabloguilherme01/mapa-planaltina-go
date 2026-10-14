import { describe, expect, it } from 'vitest';
import { hasGoogleMapsApiKey } from '../src/utils/mapProvider.ts';

describe('Disponibilidade do Google Maps', () => {
  it('considera ausente uma chave vazia, em branco ou placeholder', () => {
    expect(hasGoogleMapsApiKey(undefined)).toBe(false);
    expect(hasGoogleMapsApiKey('')).toBe(false);
    expect(hasGoogleMapsApiKey('   ')).toBe(false);
    expect(hasGoogleMapsApiKey('YOUR_API_KEY_HERE')).toBe(false);
  });

  it('habilita o provedor quando existe uma chave configurada', () => {
    expect(hasGoogleMapsApiKey('AIza-configurada-para-o-dominio')).toBe(true);
  });
});
