import { describe, it, expect } from 'vitest';
import { pointsRepository } from '../server/repository/PointsRepository.ts';
import {
  DEMO_DISCLAIMER_TEXT,
  ORIGIN_DISCLAIMER_TEXT,
  ProvenanceType,
} from '../src/types/index.ts';
import { PROVENANCE_CONFIG } from '../src/utils/provenanceMeta.ts';

describe('Modelo de Proveniência & Rigor Anti-Alucinação', () => {
  it('todos os pontos cadastrados devem ser marcados como isDemo: true', async () => {
    const all = await pointsRepository.getAllForCorpus();
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((p) => p.isDemo === true)).toBe(true);
  });

  it('todos os pontos devem conter o aviso mandatório de modo demonstrativo', async () => {
    const all = await pointsRepository.getAllForCorpus();
    expect(all.every((p) => p.demoDisclaimer === DEMO_DISCLAIMER_TEXT)).toBe(true);
  });

  it('cada ponto deve possuir metadados completos de proveniência', async () => {
    const all = await pointsRepository.getAllForCorpus();
    for (const point of all) {
      expect(point.provenanceMeta).toBeDefined();
      expect(point.provenanceMeta.sourceName).toBeTruthy();
      expect(point.provenanceMeta.license).toBeTruthy();
      expect(point.provenanceMeta.retrievedAt).toBeTruthy();
      expect(point.provenanceMeta.verificationStatus).toBeTruthy();
      expect(point.provenanceMeta.disclaimer).toBe(ORIGIN_DISCLAIMER_TEXT);
    }
  });

  it('os quatro tipos de proveniência devem estar mapeados com rótulos corretos', () => {
    const expectedTypes: ProvenanceType[] = [
      'official',
      'verified_open_data',
      'community',
      'demo',
    ];

    expectedTypes.forEach((type) => {
      const config = PROVENANCE_CONFIG[type];
      expect(config).toBeDefined();
      expect(config.label).toBeTruthy();
      expect(config.description).toBeTruthy();
    });

    // Validar rótulo explícito solicitado para dados abertos
    expect(PROVENANCE_CONFIG.verified_open_data.label).toBe('Dado aberto verificado');
  });

  it('nenhum ponto deve conter números de telefone ou dados prediais arbitrários que induzam a erro', async () => {
    const all = await pointsRepository.getAllForCorpus();
    for (const point of all) {
      // Check description does not fake official operating hours or fake phone
      expect(point.description.toLowerCase()).not.toContain('(61) 9');
      expect(point.description.toLowerCase()).not.toContain('(62) 9');
    }
  });
});
