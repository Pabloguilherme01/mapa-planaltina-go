import { MapPoint } from '../../src/types/index.ts';

export const CNES_FALLBACK_CAPTURED_AT = '2026-10-14T23:25:00.000Z';

/**
 * Último snapshot mínimo conhecido e validado para manter a publicação útil
 * quando o portal estadual bloquear ou estiver indisponível.
 *
 * Identidade/endereço: CNES/DataSUS oficial, unidade 0112666, Planaltina-GO.
 * Geometria: coordenada exposta por índice público que declara derivá-la do
 * cadastro CNES. Por isso a procedência é `verified_open_data`, e não
 * `official`: a aplicação não promove a geometria do espelho a dado oficial.
 */
export const CNES_FALLBACK_POINTS: MapPoint[] = [
  {
    id: 'cnes-0112666',
    name: 'UNIDADE DE PRONTO ATENDIMENTO UPA',
    category: 'Saúde',
    description:
      'Pronto atendimento municipal cadastrado no CNES sob o código 0112666. A ficha oficial registra atendimento contínuo; confirme disponibilidade e serviços antes do deslocamento.',
    lat: -15.45293,
    lng: -47.60913,
    zone: 'Não classificada',
    isDemo: false,
    demoDisclaimer: '',
    provenanceMeta: {
      provenance: 'verified_open_data',
      sourceUrl:
        'https://cnes2.datasus.gov.br/Mod_Conjunto.asp?VCo_Unidade=5217600112666',
      sourceName:
        'CNES/DataSUS oficial + geometria pública indexada a partir do cadastro CNES',
      license:
        'Dados cadastrais públicos do CNES; licença específica não declarada na ficha oficial consultada',
      retrievedAt: CNES_FALLBACK_CAPTURED_AT,
      verificationStatus: 'verified',
      disclaimer:
        'Snapshot de contingência: identidade e endereço conferidos no CNES oficial; geometria conferida em índice público que declara origem CNES. Confirme atendimento antes do deslocamento.',
    },
    tags: ['CNES 0112666', 'PRONTO ATENDIMENTO UPA', 'Fallback verificado'],
    addressHint:
      'CC LOTE 02, 02 • PRAÇA DR LUIZ F EUST — JARDIM PAQUETA • CEP 73758000',
  },
];
