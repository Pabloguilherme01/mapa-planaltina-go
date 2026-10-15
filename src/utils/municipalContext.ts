import { isSnapshotDate } from './snapshotDate';

export const INDICATORS_URL = 'https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93%7C6318%7C614?localidades=N6%5B5217609%5D';
export const DISTRICTS_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios/5217609/distritos';
const definitions = [
  { id: '93', label: 'População residente', unit: 'Pessoas' },
  { id: '6318', label: 'Área da unidade territorial', unit: 'Quilômetros quadrados' },
  { id: '614', label: 'Densidade demográfica', unit: 'Habitante por quilômetro quadrado' },
] as const;

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Registro IBGE inválido');
  return value as Record<string, unknown>;
}
function list(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('Lista IBGE inválida');
  return value;
}

/** Fixed census contract: no latest-year inference, absent values or other municipalities. */
export function parseMunicipalContext(input: unknown) {
  const snapshot = record(input);
  if (snapshot.version !== 1 || !isSnapshotDate(snapshot.retrievedAt)) throw new Error('Snapshot IBGE inválido');
  const rawIndicators = list(snapshot.indicators).map(record);
  if (rawIndicators.length !== definitions.length) throw new Error('Indicadores incompletos');
  const indicators = definitions.map(definition => {
    const matches = rawIndicators.filter(item => item.id === definition.id);
    if (matches.length !== 1 || matches[0].unidade !== definition.unit) throw new Error('Indicador ou unidade divergente');
    const results = list(matches[0].resultados);
    if (results.length !== 1) throw new Error('Série ambígua');
    const result = record(results[0]);
    const series = list(result.series);
    if (list(result.classificacoes).length || series.length !== 1) throw new Error('Série ambígua');
    const seriesItem = record(series[0]);
    const locality = record(seriesItem.localidade);
    if (locality.id !== '5217609' || record(locality.nivel).id !== 'N6') throw new Error('Município divergente');
    const periods = record(seriesItem.serie);
    const value = periods['2022'];
    if (Object.keys(periods).length !== 1 || typeof value !== 'string' || !/^\d+(?:\.\d+)?$/.test(value) || !Number.isFinite(Number(value)) || Number(value) <= 0) throw new Error('Valor ou referência inválida');
    if (definition.id === '93' && !Number.isSafeInteger(Number(value))) throw new Error('População inválida');
    return { ...definition, value: Number(value) };
  });
  const districts = list(snapshot.districts).map(value => {
    const item = record(value);
    const municipality = record(item.municipio);
    if (municipality.id !== 5217609 || typeof item.id !== 'number' || !/^5217609\d{2}$/.test(String(item.id)) || typeof item.nome !== 'string' || !item.nome.trim() || item.nome.length > 200) throw new Error('Distrito divergente ou inválido');
    return { id: item.id, name: item.nome.trim() };
  });
  if (!districts.length || districts.length > 100 || new Set(districts.map(item => item.id)).size !== districts.length) throw new Error('Distritos ausentes ou duplicados');
  return { municipalityCode: '5217609', referenceYear: '2022', retrievedAt: snapshot.retrievedAt, indicators, districts };
}
