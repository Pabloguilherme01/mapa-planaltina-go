import { describe, expect, it } from 'vitest';
import {
  COMMERCIAL_ANCHORS,
  COMMERCIAL_CORRIDORS,
} from '../src/data/commercialResearch.ts';

describe('camada de pesquisa comercial de Planaltina, Goiás', () => {
  it('mantém corredores comunitários fora do mapa enquanto não houver geometria auditável', () => {
    expect(COMMERCIAL_CORRIDORS).toHaveLength(4);

    for (const corridor of COMMERCIAL_CORRIDORS) {
      expect(corridor.evidenceStatus).toBe('community_pending');
      expect(corridor).not.toHaveProperty('lat');
      expect(corridor).not.toHaveProperty('lng');
      expect(corridor.disclaimer).toMatch(/não.*navegação|não.*deslocamento/i);
    }
  });

  it('distingue fonte primária de listagem pública nos estabelecimentos verificados', () => {
    const diaADia = COMMERCIAL_ANCHORS.find((anchor) => anchor.id === 'atacadao-dia-a-dia');
    const ultrabox = COMMERCIAL_ANCHORS.find((anchor) => anchor.id === 'ultrabox-planaltina-go');

    expect(diaADia).toMatchObject({
      evidenceStatus: 'verified_primary',
      checkedAt: '2026-10-14',
      address: expect.stringContaining('SETOR LESTE'),
    });
    expect(diaADia?.sourceUrl).toContain('atacadaodiaadia.com.br/lojas/go/planaltina-de-goias');

    expect(ultrabox).toMatchObject({
      evidenceStatus: 'verified_public_listing',
      checkedAt: '2026-10-14',
      address: expect.stringContaining('Santa Rita'),
    });
  });

  it('não publica âncoras sem data de checagem e aviso de validade temporal', () => {
    expect(COMMERCIAL_ANCHORS.length).toBeGreaterThanOrEqual(5);

    for (const anchor of COMMERCIAL_ANCHORS) {
      expect(anchor.checkedAt).toBe('2026-10-14');
      expect(anchor.disclaimer).toMatch(/confirme.*antes.*deslocamento/i);
      expect(anchor.sourceUrl).toMatch(/^https:\/\//);
    }
  });
});
