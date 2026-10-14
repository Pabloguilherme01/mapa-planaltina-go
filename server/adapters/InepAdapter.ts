import { MUNICIPALITY_CODE, SourceInfo } from '../../src/types/index.ts';
import { SourceAdapter } from './SourceAdapter.ts';

/**
 * Adaptador para INEP (Censo Escolar)
 */
export class InepAdapter implements SourceAdapter {
  readonly id = 'inep';
  readonly name = 'INEP - Censo Escolar e Dados Educacionais';
  readonly agency = 'Ministério da Educação / INEP';
  readonly municipalCode = MUNICIPALITY_CODE;
  readonly url = 'https://www.gov.br/inep/pt-br';
  readonly license = 'Pendente de verificação';

  async checkStatus(): Promise<SourceInfo> {
    return {
      id: this.id,
      name: this.name,
      agency: this.agency,
      municipalCode: this.municipalCode,
      url: this.url,
      status: 'not_configured',
      statusMessage: 'Integração com microdados do Censo Escolar não configurada para Planaltina, Goiás.',
      license: this.license,
      retrievedAt: null,
      checkedAt: null,
      verified: false,
      notes: 'Equipamentos educacionais exibidos no mapa são sintéticos e demonstrativos (DEMO).',
    };
  }
}
