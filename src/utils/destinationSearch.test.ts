import { describe, expect, it } from 'vitest';
import type { MapPoint } from '../types';
import { findDestinations, susStatus } from './destinationSearch';

const point = (id: string, name: string, tags: string[], extra: Partial<MapPoint> = {}): MapPoint => ({
  id, name, tags, category: 'Saúde', description: '', addressHint: 'Setor Norte', lat: -15.45, lng: -47.61,
  zone: 'Não classificada', isDemo: false, demoDisclaimer: '',
  provenanceMeta: { provenance: 'official', verificationStatus: 'verified', sourceName: 'CNES', license: 'Consultar fonte', retrievedAt: '2026-10-15T00:00:00Z', disclaimer: 'Confirme atendimento' }, ...extra,
});
const upa = point('cnes-0112666', 'UNIDADE DE PRONTO ATENDIMENTO UPA', ['Vínculo SUS: SIM']);
const clinic = point('cnes-1234567', 'Clínica São João', ['Vínculo SUS: NAO']);

describe('destinos reais e vínculo SUS', () => {
  it('combina palavras sem acentos, endereço e identificação CNES', () => {
    expect(findDestinations([upa, clinic], 'joao norte', false)).toEqual([clinic]);
    expect(findDestinations([upa, clinic], '0112666', false)).toEqual([upa]);
  });
  it('filtra somente vínculo SIM explicitamente informado no CNES', () => {
    expect(findDestinations([upa, clinic], '', true)).toEqual([upa]);
    expect(susStatus(clinic)).toBe('no');
    expect(susStatus(point('cnes-123', 'Unidade', []))).toBe('unknown');
    expect(susStatus(point('community-1', 'Unidade', ['Vínculo SUS: SIM']))).toBe('unknown');
  });
  it('exclui DEMO, não verificados, sem nome e coordenadas inválidas', () => {
    expect(findDestinations([upa, { ...clinic, isDemo: true }, { ...clinic, name: '12345678000199' },
      { ...clinic, lat: NaN }, { ...clinic, provenanceMeta: { ...clinic.provenanceMeta, verificationStatus: 'pending' } }], '', false)).toEqual([upa]);
  });
  it('não muda a lista original nem mescla estabelecimentos com nomes iguais', () => {
    const points = [upa, { ...clinic, name: upa.name }];
    expect(findDestinations(points, '', false)).toHaveLength(2);
    expect(points[0]).toBe(upa);
  });
});
