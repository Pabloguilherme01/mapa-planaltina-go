import { describe, expect, it } from 'vitest';
import { assessPublishedSnapshot } from '../scripts/snapshot-health.ts';

const NOW = new Date('2026-10-19T15:00:00.000Z');
const real = (retrievedAt: string) => ({
  id: 'cnes-0112666',
  isDemo: false,
  provenanceMeta: {
    provenance: 'verified_open_data',
    verificationStatus: 'verified',
    retrievedAt,
  },
});
const payload = (retrievedAt: string, mode: 'live' | 'snapshot_fallback' = 'live') => ({
  success: true,
  data: [real(retrievedAt), { id: 'demo-1', isDemo: true }],
  meta: {
    ibgeCode: '5217609',
    realCount: 1,
    demoCount: 1,
    realSourceMode: mode,
  },
});

describe('vigia do catálogo público', () => {
  it('aceita coleta recente com contagens coerentes', () => {
    const result = assessPublishedSnapshot(payload('2026-10-18T15:00:00.000Z'), NOW);
    expect(result.status).toBe('healthy');
    expect(result.realCount).toBe(1);
    expect(result.oldestAgeDays).toBe(1);
    expect(result.sourceMode).toBe('live');
  });

  it('detecta dados antigos mesmo com fallback legítimo', () => {
    const result = assessPublishedSnapshot(
      payload('2026-09-01T15:00:00.000Z', 'snapshot_fallback'),
      NOW
    );
    expect(result.status).toBe('stale');
    expect(result.oldestAgeDays).toBe(48);
    expect(result.sourceMode).toBe('snapshot_fallback');
  });

  it('considera a coleta mais antiga, sem contar DEMO', () => {
    const value = payload('2026-10-18T15:00:00.000Z');
    value.data.push(real('2026-09-01T15:00:00.000Z'));
    value.data[2].id = 'cnes-2';
    value.meta.realCount = 2;
    const result = assessPublishedSnapshot(value, NOW);
    expect(result.oldestAgeDays).toBe(48);
    expect(result.realCount).toBe(2);
  });

  it('permite limitar a tolerância para idade dos dados', () => {
    expect(
      assessPublishedSnapshot(payload('2026-10-10T15:00:00.000Z'), NOW, 7).status
    ).toBe('stale');
  });

  it.each([
    ['município incorreto', { ...payload('2026-10-18T15:00:00.000Z'), meta: { ...payload('2026-10-18T15:00:00.000Z').meta, ibgeCode: '5300108' } }],
    ['nenhum ponto real', { ...payload('2026-10-18T15:00:00.000Z'), data: [], meta: { ...payload('2026-10-18T15:00:00.000Z').meta, realCount: 0, demoCount: 0 } }],
    ['identidades inconsistentes', { ...payload('2026-10-18T15:00:00.000Z'), meta: { ...payload('2026-10-18T15:00:00.000Z').meta, realCount: 50 } }],
    ['data futura', payload('2026-10-20T15:00:00.000Z')],
    ['data inválida', payload('2026-02-30T00:00:00.000Z')],
    ['proveniência ausente', { ...payload('2026-10-18T15:00:00.000Z'), data: [{ id: 'a', isDemo: false }, { id: 'demo-1', isDemo: true }] }],
  ])('rejeita %s', (_label, value) => {
    expect(() => assessPublishedSnapshot(value, NOW)).toThrow();
  });
});
