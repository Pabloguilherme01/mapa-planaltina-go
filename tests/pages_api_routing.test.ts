import { describe, expect, it } from 'vitest';
import { resolveApiRouting } from '../src/services/apiRoutingConfig.ts';

describe('isolamento da publicação GitHub Pages', () => {
  it('usa sempre o snapshot local no modo estático, mesmo com backend configurado', () => {
    expect(resolveApiRouting('true', 'https://api.example.org/')).toEqual({
      staticMode: true,
      apiBase: '',
    });
  });

  it('permite API externa apenas em builds não estáticos', () => {
    expect(resolveApiRouting('false', 'https://api.example.org///')).toEqual({
      staticMode: false,
      apiBase: 'https://api.example.org',
    });
  });

  it('preserva API de mesma origem no servidor opcional sem URL configurada', () => {
    expect(resolveApiRouting(undefined, undefined)).toEqual({
      staticMode: false,
      apiBase: '',
    });
  });

  it('não confunde falso com modo estático', () => {
    expect(resolveApiRouting('false', '')).toEqual({
      staticMode: false,
      apiBase: '',
    });
  });
});
