import { describe, expect, it } from 'vitest';
import type { MapPoint } from '../types/index.ts';
import { filterCatalog } from './catalogFilters.ts';
import { findDestinations } from './destinationSearch.ts';

const clinic: MapPoint = {
  id: 'cnes-1234567',
  name: 'Posto de Saúde São João',
  category: 'Saúde',
  description: 'Atendimento comunitário',
  addressHint: 'Setor Norte',
  lat: -15.6,
  lng: -47.6,
  zone: 'Urbana',
  isDemo: false,
  demoDisclaimer: '',
  provenanceMeta: {
    provenance: 'official',
    verificationStatus: 'verified',
    sourceName: 'CNES',
    license: 'Consultar fonte',
    retrievedAt: '2026-10-15T00:00:00Z',
    disclaimer: 'Confirme atendimento',
  },
  tags: ['Tipo: Unidade Básica'],
};

const market: MapPoint = {
  ...clinic,
  id: 'osm-node-123',
  name: 'Mercado de São Sebastião',
  category: 'Comércio',
  provenanceMeta: {
    ...clinic.provenanceMeta,
    provenance: 'community',
    verificationStatus: 'unverified',
    sourceName: 'OpenStreetMap',
  },
  tags: ['Tipo: Mercado'],
};

describe('busca textual no catálogo e em destinos', () => {
  it('interpreta hífens e vírgulas como separadores ao procurar nomes', () => {
    expect(filterCatalog([market, clinic], { search: 'posto-de-saúde' })).toEqual([clinic]);
    expect(filterCatalog([market, clinic], { search: 'São, João' })).toEqual([clinic]);
    expect(filterCatalog([market, clinic], { search: 'São João' })).toEqual([clinic]);
  });

  it('mantém buscas por identificador mesmo quando há hífen', () => {
    expect(filterCatalog([market, clinic], { search: 'cnes-1234567' })).toEqual([clinic]);
    expect(findDestinations([market, clinic], 'osm-node-123', false)).toEqual([market]);
  });

  it('reconhece bairro digitado com hífen no planejador de viagem', () => {
    expect(findDestinations([market, clinic], 'setor-norte', false)).toEqual([clinic]);
    expect(findDestinations([market, clinic], 'mercado,são sebastião', false)).toEqual([market]);
    expect(findDestinations([market, clinic], 'São João inexistente', false)).toEqual([]);
  });
});
