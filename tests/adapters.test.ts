import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IbgeAdapter } from '../server/adapters/IbgeAdapter.ts';
import { PrefeituraAdapter } from '../server/adapters/PrefeituraAdapter.ts';
import { CnesAdapter } from '../server/adapters/CnesAdapter.ts';
import { InepAdapter } from '../server/adapters/InepAdapter.ts';
import { OsmAdapter } from '../server/adapters/OsmAdapter.ts';
import { MUNICIPALITY_CODE } from '../src/types/index.ts';

describe('Adaptadores de Dados Modulares (SourceAdapter)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      id: 5217609, nome: 'Planaltina', microrregiao: { id: 52012, nome: 'Fixture municipal', mesorregiao: { id: 5203, nome: 'Fixture de região', UF: { id: 52, sigla: 'GO', nome: 'Goiás' } } },
    }), { headers: { 'Content-Type': 'application/json' } })));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
  it('does not invent verified official metadata when IBGE is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const status = await new IbgeAdapter().checkStatus();
    expect(status.status).toBe('error');
    expect(status.verified).toBe(false);
    expect(status.retrievedAt).toBeNull();
    vi.unstubAllGlobals();
  });
  const ibgeAdapter = new IbgeAdapter();
  const prefeituraAdapter = new PrefeituraAdapter();
  const cnesAdapter = new CnesAdapter();
  const inepAdapter = new InepAdapter();
  const osmAdapter = new OsmAdapter();

  it('todos os adaptadores devem referenciar o código municipal 5217609', () => {
    expect(ibgeAdapter.municipalCode).toBe(MUNICIPALITY_CODE);
    expect(prefeituraAdapter.municipalCode).toBe(MUNICIPALITY_CODE);
    expect(cnesAdapter.municipalCode).toBe(MUNICIPALITY_CODE);
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
          UF: {
            id: 52,
            sigla: 'GO',
            nome: 'Goiás',
          },
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

    expect(() => ibgeAdapter.validateIbgePayload(invalidUfData)).toThrow(
      /UF divergente/
    );
  });

  it('adaptadores not_configured devem ter retrievedAt null e checkedAt null sem datas fictícias', async () => {
    const prefStatus = await prefeituraAdapter.checkStatus();
    expect(prefStatus.status).toBe('not_configured');
    expect(prefStatus.retrievedAt).toBeNull();
    expect(prefStatus.checkedAt).toBeNull();
    expect(prefStatus.verified).toBe(false);
    expect(prefStatus.license).toBe('Pendente de verificação');

    const cnesStatus = await cnesAdapter.checkStatus();
    expect(cnesStatus.status).toBe('not_configured');
    expect(cnesStatus.retrievedAt).toBeNull();
    expect(cnesStatus.checkedAt).toBeNull();

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
