import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IbgeAdapter } from '../server/adapters/IbgeAdapter.ts';
import { PrefeituraAdapter } from '../server/adapters/PrefeituraAdapter.ts';
import { CnesAdapter } from '../server/adapters/CnesAdapter.ts';
import { InepAdapter } from '../server/adapters/InepAdapter.ts';
import { OsmAdapter } from '../server/adapters/OsmAdapter.ts';
import { CNES_FALLBACK_CAPTURED_AT } from '../server/data/cnesPlanaltinaFallback.ts';
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
    expect(status.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(Date.parse(status.checkedAt!)).toBeLessThanOrEqual(Date.parse(status.retrievedAt!));
    expect(status.license).toMatch(/licença não informada/i);
    expect(status.statusMessage).toContain('1 estabelecimento');
  });

  it('preserva snapshot real verificado quando a atualização CNES é bloqueada', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('<html><body>Request Rejected</body></html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        })
      )
    );

    const adapter = new CnesAdapter();
    const points = await adapter.fetchPoints();
    const status = await adapter.checkStatus();

    expect(points.length).toBeGreaterThan(0);
    expect(points[0]).toMatchObject({
      id: 'cnes-0112666',
      isDemo: false,
      category: 'Saúde',
      provenanceMeta: {
        provenance: 'verified_open_data',
        verificationStatus: 'verified',
        retrievedAt: CNES_FALLBACK_CAPTURED_AT,
      },
    });
    expect(status.status).toBe('snapshot_fallback');
    expect(status.verified).toBe(true);
    expect(status.retrievedAt).toBe(CNES_FALLBACK_CAPTURED_AT);
    expect(status.notes).toMatch(/fallback|conteúdo inesperado/i);
  });

  it('carrega todas as páginas do CNES antes de declarar conexão completa', async () => {
    const record = cnesFixture.result.records[0];
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ success: true, result: { total: 2, records: [record] } }))
      .mockResolvedValueOnce(Response.json({ success: true, result: { total: 2, records: [{ ...record, cnes: '0112666' }] } }));
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new CnesAdapter();
    const points = await adapter.fetchPoints();
    expect(points.map(point => point.id)).toEqual(['cnes-2437651', 'cnes-0112666']);
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get('offset')).toBe('1');
    expect(adapter.dataMode).toBe('live');
  });

  it('não publica coleta parcial se uma página seguinte falha', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(Response.json({ success: true, result: { total: 2, records: cnesFixture.result.records } }))
      .mockRejectedValueOnce(new Error('página indisponível')));
    const adapter = new CnesAdapter();
    const points = await adapter.fetchPoints();
    expect(adapter.dataMode).toBe('snapshot_fallback');
    expect(points.map(point => point.id)).not.toContain('cnes-2437651');
    expect(adapter.liveError).toContain('página indisponível');
  });

  it('interrompe paginação vazia antes do total e preserva snapshot', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ success: true, result: { total: 2, records: cnesFixture.result.records } }))
      .mockResolvedValueOnce(Response.json({ success: true, result: { total: 2, records: [] } }));
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new CnesAdapter();
    await adapter.fetchPoints();
    expect(adapter.dataMode).toBe('snapshot_fallback');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('preserva coleta live entre instâncias sem armazenar contatos', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cnes-cache-'));
    try {
      const path = join(dir, 'snapshot.json');
      const record = { ...cnesFixture.result.records[0], telefone: 'PRIVADO', email: 'PRIVADO' };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ success: true, result: { total: 1, records: [record] } })));
      const live = new CnesAdapter(path);
      const original = await live.fetchPoints();
      const saved = await readFile(path, 'utf8');
      expect(saved).not.toContain('PRIVADO');
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
      const restored = new CnesAdapter(path);
      expect(await restored.fetchPoints()).toEqual(original);
      expect((await restored.checkStatus()).status).toBe('snapshot_fallback');
      expect(await readFile(path, 'utf8')).toBe(saved);
    } finally { await rm(dir, { recursive: true, force: true }); }
  });

  it('rejeita snapshot persistido adulterado e usa contingência versionada', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cnes-cache-'));
    try {
      const path = join(dir, 'snapshot.json');
      await writeFile(path, JSON.stringify({ version: 1, retrievedAt: 'invalid', records: cnesFixture.result.records }));
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
      const adapter = new CnesAdapter(path);
      expect((await adapter.fetchPoints())[0].id).toBe('cnes-0112666');
    } finally { await rm(dir, { recursive: true, force: true }); }
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
