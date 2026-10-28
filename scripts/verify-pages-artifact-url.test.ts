import { describe, expect, it } from 'vitest';
import { isSourceUrl } from './verify-pages-artifact.ts';

describe('source URLs must be public HTTPS addresses', () => {
  it('accepts legitimate official and community source URLs', () => {
    expect(isSourceUrl('https://dadosabertos.go.gov.br/dataset')).toBe(true);
    expect(isSourceUrl('https://www.openstreetmap.org/node/123')).toBe(true);
  });

  it('rejects local, IP-based, credential-bearing and insecure URLs', () => {
    for (const url of [
      'http://dadosabertos.go.gov.br/dataset',
      'https://localhost/',
      'https://localhost./',
      'https://internal.local/',
      'https://login.localhost./',
      'https://127.0.0.1/',
      'https://192.168.1.5/',
      'https://[::1]/',
      'https://private:secret@dadosabertos.go.gov.br/dataset',
      'file:///etc/passwd',
      'javascript:alert(1)',
      '',
    ]) {
      expect(isSourceUrl(url), url).toBe(false);
    }
  });
});
