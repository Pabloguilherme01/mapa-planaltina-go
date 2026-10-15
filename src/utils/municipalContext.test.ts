import { describe, expect, it } from 'vitest';
import { parseMunicipalContext } from './municipalContext';
import snapshot from '../data/municipalContext.json';

describe('contexto municipal IBGE', () => {
  it('preserva valores, referência e distritos da fonte', () => {
    const context = parseMunicipalContext(snapshot);
    expect(context.indicators.map(item => item.value)).toEqual([105031, 2558.924, 41.04]);
    expect(context.districts.map(item => item.name)).toContain('Córrego Rico');
    expect(context.referenceYear).toBe('2022');
  });
  it.each(['-', '...', '', 'NaN', '-1'])('rejeita valor ausente ou inválido %s', value => {
    const invalid = structuredClone(snapshot);
    invalid.indicators[0].resultados[0].series[0].serie['2022'] = value;
    expect(() => parseMunicipalContext(invalid)).toThrow();
  });
  it('bloqueia série de outro município', () => {
    const invalid = structuredClone(snapshot);
    invalid.indicators[0].resultados[0].series[0].localidade.id = '5300108';
    expect(() => parseMunicipalContext(invalid)).toThrow();
  });
  it('bloqueia unidades e indicadores divergentes', () => {
    const invalid = structuredClone(snapshot);
    invalid.indicators[0].unidade = 'Percentual';
    expect(() => parseMunicipalContext(invalid)).toThrow();
    expect(() => parseMunicipalContext({ ...snapshot, indicators: snapshot.indicators.slice(1) })).toThrow();
  });
  it('bloqueia distrito divergente, duplicado e data futura', () => {
    const invalid = structuredClone(snapshot);
    invalid.districts[0].municipio.id = 5300108;
    expect(() => parseMunicipalContext(invalid)).toThrow();
    expect(() => parseMunicipalContext({ ...snapshot, districts: [snapshot.districts[0], snapshot.districts[0]] })).toThrow();
    expect(() => parseMunicipalContext({ ...snapshot, retrievedAt: '2099-01-01T00:00:00Z' })).toThrow();
  });
});
