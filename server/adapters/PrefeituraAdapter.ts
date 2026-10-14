import { MUNICIPALITY_CODE, SourceInfo } from '../../src/types/index.ts';
import { SourceAdapter } from './SourceAdapter.ts';

/**
 * Adaptador para Prefeitura Municipal de Planaltina, Goiás
 * Marcado como não configurado sem fazer suposições sobre a infraestrutura da prefeitura.
 */
export class PrefeituraAdapter implements SourceAdapter {
  readonly id = 'prefeitura_planaltina';
  readonly name = 'Prefeitura Municipal de Planaltina, Goiás';
  readonly agency = 'Poder Executivo de Planaltina, Goiás';
  readonly municipalCode = MUNICIPALITY_CODE;
  readonly url = 'https://planaltina.go.gov.br';
  readonly license = 'Pendente de verificação';

  async checkStatus(): Promise<SourceInfo> {
    return {
      id: this.id,
      name: this.name,
      agency: this.agency,
      municipalCode: this.municipalCode,
      url: this.url,
      status: 'not_configured',
      statusMessage: 'Integração com sistemas municipais não configurada neste ambiente.',
      license: this.license,
      retrievedAt: null,
      checkedAt: null,
      verified: false,
      notes: 'Integração técnica com o município de Planaltina, Goiás pendente de configuração.',
    };
  }
}
