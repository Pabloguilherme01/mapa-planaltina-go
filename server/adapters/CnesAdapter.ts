import { MUNICIPALITY_CODE, SourceInfo } from '../../src/types/index.ts';
import { SourceAdapter } from './SourceAdapter.ts';

/**
 * Adaptador para CNES (Cadastro Nacional de Estabelecimentos de Saúde)
 */
export class CnesAdapter implements SourceAdapter {
  readonly id = 'cnes';
  readonly name = 'CNES - Cadastro Nacional de Estabelecimentos de Saúde';
  readonly agency = 'Ministério da Saúde / DataSUS';
  readonly municipalCode = MUNICIPALITY_CODE;
  readonly url = 'https://cnes.datasus.gov.br';
  readonly license = 'Pendente de verificação';

  async checkStatus(): Promise<SourceInfo> {
    return {
      id: this.id,
      name: this.name,
      agency: this.agency,
      municipalCode: this.municipalCode,
      url: this.url,
      status: 'not_configured',
      statusMessage: 'Integração com webservices do CNES não configurada para o município 5217609.',
      license: this.license,
      retrievedAt: null,
      checkedAt: null,
      verified: false,
      notes: 'Os pontos de saúde exibidos no mapa são ilustrativos/sintéticos (DEMO). Não utilize para emergências médicas em Planaltina, Goiás.',
    };
  }
}
