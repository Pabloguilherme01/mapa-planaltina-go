import { MUNICIPALITY_CODE, SourceInfo } from '../../src/types/index.ts';
import { SourceAdapter } from './SourceAdapter.ts';

/**
 * Adaptador para OpenStreetMap
 * URL oficial de direitos e licença: https://www.openstreetmap.org/copyright
 */
export class OsmAdapter implements SourceAdapter {
  readonly id = 'osm';
  readonly name = 'OpenStreetMap (Comunidade Colaborativa)';
  readonly agency = 'OpenStreetMap Foundation';
  readonly municipalCode = MUNICIPALITY_CODE;
  readonly url = 'https://www.openstreetmap.org/copyright';
  readonly license = 'ODbL 1.0 (Open Database License)';

  async checkStatus(): Promise<SourceInfo> {
    return {
      id: this.id,
      name: this.name,
      agency: this.agency,
      municipalCode: this.municipalCode,
      url: this.url,
      status: 'not_configured',
      statusMessage: 'Integração de extração direta com o OpenStreetMap não configurada para Planaltina, Goiás.',
      license: this.license,
      retrievedAt: null,
      checkedAt: null,
      verified: false,
      notes: 'Não há ingestão automática de feições colaborativas ativada para este ambiente.',
    };
  }
}
