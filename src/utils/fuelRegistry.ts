import { isSnapshotDate } from './snapshotDate';
import { normalizeText } from './text';

export const ANP_SOURCE_URL = 'https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/dados-cadastrais-dos-revendedores-varejistas-de-combustiveis-automotivos';
export interface FuelStationRecord { id: string; authorization: string; name: string; address: string; district: string; brand: string; municipality: string; uf: string }
const fields = ['id', 'authorization', 'name', 'address', 'district', 'brand', 'municipality', 'uf'];

export function parseFuelRegistry(input: unknown) {
  if (!input || typeof input !== 'object') throw new Error('Snapshot ANP inválido');
  const snapshot = input as Record<string, unknown>;
  if (snapshot.version !== 1 || !isSnapshotDate(snapshot.retrievedAt) || snapshot.geometry !== 'not_provided' ||
      typeof snapshot.sourceSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(snapshot.sourceSha256) ||
      !Array.isArray(snapshot.items) || !snapshot.items.length || snapshot.items.length > 500) throw new Error('Snapshot ANP inválido');
  const items = snapshot.items.map(value => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Registro ANP inválido');
    const item = value as Record<string, unknown>;
    if (Object.keys(item).some(key => !fields.includes(key)) || fields.some(key => typeof item[key] !== 'string' || (item[key] as string).length > 500)) throw new Error('Campos ANP inválidos');
    const station = item as unknown as FuelStationRecord;
    if (station.municipality !== 'PLANALTINA' || station.uf !== 'GO' || !/^\d{1,12}$/.test(station.id) ||
        !/^PR\/GO\d{7}$/.test(station.authorization) || !/\p{L}/u.test(station.name) || !station.address.trim()) throw new Error('Identidade ou município ANP divergente');
    return station;
  });
  if (new Set(items.map(item => item.id)).size !== items.length || new Set(items.map(item => item.authorization)).size !== items.length) throw new Error('Identidade ANP duplicada');
  return { retrievedAt: snapshot.retrievedAt, items };
}

export function filterFuelStations(items: FuelStationRecord[], query: string, brand: string) {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  return items.filter(item => (!brand || item.brand === brand) && terms.every(term => normalizeText(`${item.name} ${item.address} ${item.district} ${item.authorization}`).includes(term)));
}
