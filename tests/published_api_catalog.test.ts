import { describe, expect, it } from 'vitest';
import { loadPublishedCatalog, parsePublishedCatalog } from '../server/repository/publishedCatalog.ts';
import { InMemoryPointsRepository } from '../server/repository/PointsRepository.ts';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CNES_FALLBACK_POINTS } from '../server/data/cnesPlanaltinaFallback.ts';
import { DEMO_DISCLAIMER_TEXT, ORIGIN_DISCLAIMER_TEXT, type MapPoint } from '../src/types/index.ts';

const verified = (): MapPoint => structuredClone(CNES_FALLBACK_POINTS[0]);
const demo = (): MapPoint => ({
  ...verified(),
  id: 'demo-validation',
  name: 'Destino fictício (DEMO)',
  isDemo: true,
  demoDisclaimer: DEMO_DISCLAIMER_TEXT,
  provenanceMeta: {
    provenance: 'demo' as const,
    sourceName: 'Demonstração',
    license: 'Demonstração',
    retrievedAt: '2026-10-14T08:00:00.000Z',
    verificationStatus: 'synthetic_demo' as const,
    disclaimer: ORIGIN_DISCLAIMER_TEXT,
  },
});
const fixture = () => ({
  success: true,
  data: [verified(), demo()],
  meta: { ibgeCode: '5217609', realCount: 1, demoCount: 1 },
});

describe('catálogo de snapshot compartilhável com a API', () => {
  it('fornece pontos reais ao mesmo repositório usado pela busca e assistente', async () => {
    const { points } = parsePublishedCatalog(fixture());
    const repo = new InMemoryPointsRepository(points);
    expect((await repo.getAllForCorpus()).some(p => !p.isDemo)).toBe(true);
    expect((await repo.list({ provenance: ['verified_open_data'] })).map(p => p.id)).toEqual(['cnes-0112666']);
    expect(await repo.count()).toBe(2);
  });

  it('carrega um snapshot persistido e rejeita arquivo corrompido sem usar DEMO como fallback', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'planaltina-api-snapshot-'));
    const file = join(dir, 'points.json');
    try {
      await writeFile(file, JSON.stringify(fixture()));
      expect(loadPublishedCatalog(file).realCount).toBe(1);
      await writeFile(file, '{ arquivo inválido');
      expect(() => loadPublishedCatalog(file)).toThrow(/Snapshot municipal|snapshot municipal/i);
      expect(() => loadPublishedCatalog(join(dir, 'missing.json'))).toThrow(/Snapshot municipal|snapshot municipal/i);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('aceita catálogo municipal com reais verificados e DEMO rotulados', () => {
    const result = parsePublishedCatalog(fixture());
    expect(result.realCount).toBe(1);
    expect(result.demoCount).toBe(1);
    expect(result.points[0].isDemo).toBe(false);
    expect(result.points[1].isDemo).toBe(true);
  });

  it.each([
    ['código municipal divergente', p => { p.meta.ibgeCode = '5300108'; }],
    ['contagem real falsa', p => { p.meta.realCount = 2; }],
    ['sem registros reais', p => { p.data = [demo()]; p.meta.realCount = 0; }],
    ['identidade duplicada', p => { p.data[1].id = p.data[0].id; }],
    ['real sem verificação', p => { p.data[0].provenanceMeta.verificationStatus = 'pending'; }],
    ['real inventado', p => { p.data[0].isDemo = true; }],
    ['geometria externa', p => { p.data[0].lat = -16.5; }],
    ['fonte inválida', p => { p.data[0].provenanceMeta.sourceUrl = 'http://invalid.test'; }],
    ['data inválida', p => { p.data[0].provenanceMeta.retrievedAt = '2026-02-30T00:00:00Z'; }],
    ['DEMO sem rótulo', p => { p.data[1].demoDisclaimer = ''; }],
  ] as Array<[string, (payload: ReturnType<typeof fixture>) => void]>)('rejeita %s', (_label, mutate) => {
    const payload = fixture();
    mutate(payload);
    expect(() => parsePublishedCatalog(payload)).toThrow(/catálogo|snapshot|procedência|real|geometria|municipal/i);
  });
});
