import { describe, expect, it } from 'vitest';
import { createLocationRequestGuard } from './geolocationRequestGuard';

describe('consentimento e respostas de GPS', () => {
  it('desconsidera resposta após cancelamento', () => {
    const guard = createLocationRequestGuard();
    const pending = guard.begin();
    expect(pending.isCurrent()).toBe(true);
    guard.cancel();
    expect(pending.isCurrent()).toBe(false);
  });
  it('uma segunda solicitação invalida a anterior', () => {
    const guard = createLocationRequestGuard();
    const old = guard.begin();
    const fresh = guard.begin();
    expect(old.isCurrent()).toBe(false);
    expect(fresh.isCurrent()).toBe(true);
  });
  it('reabrir o diálogo não revalida o pedido anterior', () => {
    const guard = createLocationRequestGuard();
    const first = guard.begin();
    guard.cancel();
    const reopened = guard.begin();
    expect(first.isCurrent()).toBe(false);
    expect(reopened.isCurrent()).toBe(true);
  });
});
