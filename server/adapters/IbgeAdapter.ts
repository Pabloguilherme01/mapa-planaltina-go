import {
  MUNICIPALITY_CODE,
  MunicipalityOfficialInfo,
  SourceInfo,
} from '../../src/types/index.ts';
import { SourceAdapter } from './SourceAdapter.ts';

/**
 * IbgeAdapter para Planaltina, Goiás (IBGE 5217609)
 * Consulta a API de Localidades do IBGE e valida identificação municipal.
 * NOTA: O IBGE fornece apenas código censitário e metadados de identificação
 * do município (5217609), não fornecendo cadastro de pontos ou malha oficial nesta conexão.
 */
export class IbgeAdapter implements SourceAdapter {
  readonly id = 'ibge';
  readonly name = 'IBGE - Instituto Brasileiro de Geografia e Estatística';
  readonly agency = 'Governo Federal / IBGE';
  readonly municipalCode = MUNICIPALITY_CODE;
  readonly url = `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${MUNICIPALITY_CODE}`;
  readonly license = 'Pendente de verificação';

  private cachedMunicipality: MunicipalityOfficialInfo | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutos

  async getMunicipalityData(): Promise<MunicipalityOfficialInfo> {
    const now = Date.now();
    if (this.cachedMunicipality && now - this.lastFetchTime < this.CACHE_TTL_MS) {
      return this.cachedMunicipality;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(this.url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'MapaPlanaltinaGO/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `IBGE API retornou status HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      this.validateIbgePayload(data);

      const officialInfo: MunicipalityOfficialInfo = {
        id: data.id,
        nome: data.nome,
        microrregiao: data.microrregiao,
        regiaoImediata: data['regiao-imediata']
          ? {
              id: data['regiao-imediata'].id,
              nome: data['regiao-imediata'].nome,
            }
          : undefined,
        verified: true,
        officialSourceUrl: 'https://www.ibge.gov.br/cidades-e-estados/go/planaltina.html',
        lastChecked: new Date().toISOString(),
        overviewNotes:
          'Identificação municipal de Planaltina, Goiás, código 5217609, consultada na API do IBGE. Esta resposta não fornece coordenadas nem cadastro de pontos.',
      };

      this.cachedMunicipality = officialInfo;
      this.lastFetchTime = now;
      return officialInfo;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Consulta IBGE indisponível ou inválida: ${errorMsg}`);
    }
  }

  validateIbgePayload(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Payload IBGE inválido: formato não é objeto JSON.');
    }

    if (String(data.id) !== MUNICIPALITY_CODE) {
      throw new Error(
        `Código IBGE divergente! Esperado ${MUNICIPALITY_CODE}, recebido ${data.id}.`
      );
    }

    const ufSigla = data?.microrregiao?.mesorregiao?.UF?.sigla;
    if (ufSigla !== 'GO') {
      throw new Error(
        `UF divergente! Esperado GO (Goiás), recebido ${ufSigla}.`
      );
    }
  }

  async checkStatus(): Promise<SourceInfo> {
    try {
      const data = await this.getMunicipalityData();
      return {
        id: this.id,
        name: this.name,
        agency: this.agency,
        municipalCode: this.municipalCode,
        url: this.url,
        status: 'connected',
        statusMessage: `Conexão ativa para identificação censitária municipal (código ${data.id}, Planaltina, Goiás).`,
        license: this.license,
        retrievedAt: data.lastChecked,
        checkedAt: data.lastChecked,
        verified: true,
        notes:
          'A fonte IBGE conectada é utilizada estritamente para identificação e divisão político-administrativa do município (código 5217609). Não fornece cadastro de pontos de serviços ou malha oficial.',
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        id: this.id,
        name: this.name,
        agency: this.agency,
        municipalCode: this.municipalCode,
        url: this.url,
        status: 'error',
        statusMessage: `Falha na consulta IBGE: ${message}`,
        license: this.license,
        retrievedAt: null,
        checkedAt: new Date().toISOString(),
        verified: false,
        notes: 'Erro na validação remota do IBGE para Planaltina, Goiás.',
      };
    }
  }
}
