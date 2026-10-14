import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IbgeAdapter } from '../server/adapters/IbgeAdapter.ts';
import { PrefeituraAdapter } from '../server/adapters/PrefeituraAdapter.ts';
import { CnesAdapter } from '../server/adapters/CnesAdapter.ts';
import { InepAdapter } from '../server/adapters/InepAdapter.ts';
import { OsmAdapter } from '../server/adapters/OsmAdapter.ts';
import { MUNICIPALITY_CODE } from '../src/types/index.ts';

const ibgeFixture = {
  id: 5217609,
  nome: 'Planaltina',
  microrregiao: {
    id: 52012,
    nome: 'Fixture municipal',
    mesorregiao: {
      id: 5203,
      nome: 'Fixture de região',
      UF: { id: 52, sigla: 'GO', nome: 'Goiás' },
    },
  },
};

const cnesFixture = {
  success: true,
  result: {
    total: 1,
    records: [
      {
        cnes: '2437651',
        razao_social: 'FUNDO MUNICIPAL DE SAUDE DE PLANALTINA GOIAS',
        nome_fantasia: 'HOSPITAL MUNICIPAL MATERNO INFANTIL SANTA RITA DE CASSIA',
        logradouro: 'QD 08',
        numero: '115',
        bairro: 'LOTEAM SANTA RITA SETOR LESTE',
        cep: '73752080',
        latitude: '-15.4542',
        longitude: '-47.6029',
        codigo_ibge: '521760',
        uf: 'GO',
        municipio: 'PLANALTINA',
        tipo_estabelecimento: 'HOSPITAL GERAL',
        vinculo_sus: 'SIM',
      },
    ],
  },
};

describe('Adaptadores de Dados Modulares (SourceAdapter)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify(ibgeFixture), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not invent verified official metadata when IBGE is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const status = await new IbgeAdapter().checkStatus();
    expect(status.status).toBe('error');
    expect(status.verified).toBe(false);
    expect(status.retrievedAt).toBeNull();
  });

  const ibgeAdapter = new IbgeAdapter();
  const prefeituraAdapter = new PrefeituraAdapter();
  const inepAdapter = new InepAdapter();
  const osmAdapter = new OsmAdapter();

  it('todos os adaptadores devem referenciar o código municipal 5217609', () => {
    expect(ibgeAdapter.municipalCode).toBe(MUNICIPALITY_CODE);
    expect(prefeituraAdapter.municipalCode).toBe(MUNICIPALITY_CODE);
    expect(new CnesAdapter().municipalCode).toBe(MUNICIPALITY_CODE);
    expect(inepAdapter.municipalCode).toBe(MUNICIPALITY_CODE);
    expect(osmAdapter.municipalCode).toBe(MUNICIPALITY_CODE);
  });

  it('IbgeAdapter deve possuir licença como pendente de verificação e validar identificação municipal', async () => {
    expect(ibgeAdapter.license).toBe('Pendente de verificação');
    const status = await ibgeAdapter.checkStatus();
    expect(status.status).toBe('connected');
    expect(status.verified).toBe(true);
    expect(status.notes).toContain('identificação');
  });

  it('IbgeAdapter deve validar estritamente payload com id 5217609 e UF GO', () => {
    const validData = {
      id: 5217609,
      nome: 'Planaltina',
      microrregiao: {
        id: 52012,
        nome: 'Entorno do Distrito Federal',
        mesorregiao: {
          id: 5203,
          nome: 'Leste Goiano',
          UF: { id: 52, sigla: 'GO', nome: 'Goiás' },
        },
      },
    };

    expect(() => ibgeAdapter.validateIbgePayload(validData)).not.toThrow();
  });

  it('IbgeAdapter deve lançar erro explícito se o código for divergente ou UF incorreta', () => {
    const invalidIdData = {
      id: 3550308,
      nome: 'São Paulo',
      microrregiao: { mesorregiao: { UF: { sigla: 'SP' } } },
    };
    expect(() => ibgeAdapter.validateIbgePayload(invalidIdData)).toThrow(
      /Código IBGE divergente/
    );

    const invalidUfData = {
      id: 5217609,
      nome: 'Planaltina',
      microrregiao: { mesorregiao: { UF: { sigla: 'DF' } } },
    };
    expect(() => ibgeAdapter.validateIbgePayload(invalidUfData)).toThrow(/UF divergente/);
  });

  it('CNES conectado só fica verificado depois de receber registros georreferenciados de Planaltina', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify(cnesFixture), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    const status = await new CnesAdapter().checkStatus();
    expect(status.status).toBe('connected');
    expect(status.verified).toBe(true);
    expect(status.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(status.checkedAt).toBe(status.retrievedAt);
    expect(status.license).toMatch(/licença não informada/i);
    expect(status.statusMessage).toContain('1 estabelecimento');
  });

  it('adaptadores ainda não configurados mantêm datas nulas sem inventar consulta', async () => {
    const prefStatus = await prefeituraAdapter.checkStatus();
    expect(prefStatus.status).toBe('not_configured');
    expect(prefStatus.retrievedAt).toBeNull();
    expect(prefStatus.checkedAt).toBeNull();
    expect(prefStatus.verified).toBe(false);
    expect(prefStatus.license).toBe('Pendente de verificação');

    const inepStatus = await inepAdapter.checkStatus();
    expect(inepStatus.status).toBe('not_configured');
    expect(inepStatus.retrievedAt).toBeNull();
    expect(inepStatus.checkedAt).toBeNull();

    const osmStatus = await osmAdapter.checkStatus();
    expect(osmStatus.status).toBe('not_configured');
    expect(osmStatus.retrievedAt).toBeNull();
    expect(osmStatus.checkedAt).toBeNull();
    expect(osmStatus.url).toBe('https://www.openstreetmap.org/copyright');
  });
});
