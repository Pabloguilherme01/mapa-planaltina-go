import { describe, expect, it } from 'vitest';
import {
  CNES_GOIAS_RESOURCE_ID,
  CNES_MUNICIPALITY_CODE,
  buildCnesDatastoreUrl,
  mapCnesRecordToPoint,
} from '../server/adapters/CnesAdapter.ts';

const VALID_RECORD = {
  cnes: '2437651',
  razao_social: 'FUNDO MUNICIPAL DE SAUDE DE PLANALTINA GOIAS',
  nome_fantasia: 'HOSPITAL MUNICIPAL MATERNO INFANTIL SANTA RITA DE CASSIA',
  logradouro: 'QD 08',
  numero: '115',
  complemento: '',
  bairro: 'LOTEAM SANTA RITA SETOR LESTE',
  cep: '73752080',
  latitude: '-15.454200',
  longitude: '-47.602900',
  codigo_ibge: '521760',
  uf: 'GO',
  municipio: 'PLANALTINA',
  tipo_gestao: 'M',
  natureza_juridica: 'ADMINISTRACAO PUBLICA',
  vinculo_sus: 'SIM',
  tipo_estabelecimento: 'HOSPITAL GERAL',
};

describe('integração de pontos reais do CNES/SES-GO', () => {
  it('consulta o DataStore oficial filtrando o código CNES/IBGE de Planaltina', () => {
    expect(CNES_MUNICIPALITY_CODE).toBe('521760');
    const url = new URL(buildCnesDatastoreUrl());

    expect(url.hostname).toBe('dadosabertos.go.gov.br');
    expect(url.searchParams.get('resource_id')).toBe(CNES_GOIAS_RESOURCE_ID);
    expect(JSON.parse(url.searchParams.get('filters') || '{}')).toEqual({
      codigo_ibge: '521760',
    });
  });

  it('transforma registro oficial com geometria publicada em ponto real verificável', () => {
    const point = mapCnesRecordToPoint(VALID_RECORD, '2026-10-14T23:30:00.000Z');

    expect(point).toMatchObject({
      id: 'cnes-2437651',
      name: 'HOSPITAL MUNICIPAL MATERNO INFANTIL SANTA RITA DE CASSIA',
      category: 'Saúde',
      zone: 'Urbana',
      isDemo: false,
      lat: -15.4542,
      lng: -47.6029,
      provenanceMeta: {
        provenance: 'official',
        verificationStatus: 'verified',
        retrievedAt: '2026-10-14T23:30:00.000Z',
      },
    });
    expect(point?.addressHint).toContain('LOTEAM SANTA RITA SETOR LESTE');
    expect(point?.tags).toContain('CNES 2437651');
    expect(point?.provenanceMeta.sourceUrl).toContain(CNES_GOIAS_RESOURCE_ID);
  });

  it('não inventa geometria quando a fonte não publica coordenadas válidas', () => {
    expect(mapCnesRecordToPoint({ ...VALID_RECORD, latitude: '', longitude: '' })).toBeNull();
    expect(mapCnesRecordToPoint({ ...VALID_RECORD, latitude: '0', longitude: '0' })).toBeNull();
  });

  it('rejeita registros de outro município antes de chegar ao mapa', () => {
    expect(mapCnesRecordToPoint({ ...VALID_RECORD, codigo_ibge: '520870', municipio: 'GOIANIA' })).toBeNull();
  });

  it('não replica telefone ou e-mail no ponto cartográfico', () => {
    const point = mapCnesRecordToPoint({
      ...VALID_RECORD,
      telefone: '(61) 99999-9999',
      email: 'contato@example.org',
    });

    expect(JSON.stringify(point)).not.toContain('99999-9999');
    expect(JSON.stringify(point)).not.toContain('contato@example.org');
  });
});
