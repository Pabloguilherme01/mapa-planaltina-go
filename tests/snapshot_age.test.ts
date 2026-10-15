import { expect, it } from 'vitest';
import { snapshotAgeLabel } from '../src/utils/snapshotDate.ts';
it('distingue coleta recente, antiga e data inválida sem fingir atualização', () => {
  const now = Date.parse('2026-10-14T12:00:00Z');
  expect(snapshotAgeLabel('2026-10-14T01:00:00Z', now)).toBe('Coleta de hoje');
  expect(snapshotAgeLabel('2026-09-01T12:00:00Z', now)).toContain('confirme atualizações');
  expect(snapshotAgeLabel(null, now)).toContain('indisponível');
  expect(snapshotAgeLabel('2099-01-01T00:00:00Z', now)).toContain('indisponível');
});
