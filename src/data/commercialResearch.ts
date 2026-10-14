export type CommercialEvidenceStatus =
  | 'community_pending'
  | 'verified_primary'
  | 'verified_public_listing';

export interface CommercialCorridorResearch {
  id: string;
  name: string;
  sectors: string[];
  summary: string;
  evidenceStatus: 'community_pending';
  sourceName: string;
  roadEvidenceUrl?: string;
  disclaimer: string;
}

export interface CommercialAnchorResearch {
  id: string;
  name: string;
  corridorId: string;
  address: string;
  openingHours: string;
  evidenceStatus: Exclude<CommercialEvidenceStatus, 'community_pending'>;
  sourceName: string;
  sourceUrl: string;
  checkedAt: string;
  disclaimer: string;
}

const COMMUNITY_SOURCE =
  'Pesquisa comunitária de comércio e mobilidade fornecida ao projeto em 14/10/2026';
const ROAD_EVIDENCE_URL = 'https://legisla.casacivil.go.gov.br/api/v1/arquivos/18608';
const CORRIDOR_DISCLAIMER =
  'Hipótese territorial comunitária, sem geometria auditável. Não usar para navegação ou deslocamento.';
const ANCHOR_DISCLAIMER =
  'Informação pública consultada em 14/10/2026; confirme endereço e horário antes do deslocamento.';

export const COMMERCIAL_CORRIDORS: CommercialCorridorResearch[] = [
  {
    id: 'centro-elisio-vaz',
    name: 'Avenida Elísio Vaz e quadrilátero central',
    sectors: ['Centro', 'Setor Norte', 'Setor Sul'],
    summary:
      'A pesquisa comunitária descreve este eixo como corredor de varejo de rua, serviços financeiros, farmácias, óticas e comércio de balcão. A existência viária e sua conexão com a Avenida Pedro Ludovico aparecem em documentação estadual; a intensidade comercial ainda requer levantamento próprio.',
    evidenceStatus: 'community_pending',
    sourceName: COMMUNITY_SOURCE,
    roadEvidenceUrl: ROAD_EVIDENCE_URL,
    disclaimer: CORRIDOR_DISCLAIMER,
  },
  {
    id: 'leste-pedro-ludovico-go534',
    name: 'Avenida Pedro Ludovico / GO-534 — Setor Leste',
    sectors: ['Setor Leste', 'Setor de Mansões'],
    summary:
      'Corredor descrito pela comunidade como concentração de mercados, autopeças, depósitos, materiais de construção, saúde e galerias. A documentação estadual confirma a continuidade da Avenida Pedro Ludovico com a GO-534; o perfil econômico permanece classificado como pesquisa comunitária.',
    evidenceStatus: 'community_pending',
    sourceName: COMMUNITY_SOURCE,
    roadEvidenceUrl: ROAD_EVIDENCE_URL,
    disclaimer: CORRIDOR_DISCLAIMER,
  },
  {
    id: 'norte-go430',
    name: 'GO-430 e Setor Norte',
    sectors: ['Setor Norte', 'Acesso rodoviário'],
    summary:
      'A pesquisa comunitária identifica um eixo de comércio voltado ao acesso veicular, atacarejo e serviços do Setor Norte. A GO-430 é documentada na delimitação territorial estadual, mas a delimitação de um corredor comercial ainda não possui geometria homologada no projeto.',
    evidenceStatus: 'community_pending',
    sourceName: COMMUNITY_SOURCE,
    roadEvidenceUrl: ROAD_EVIDENCE_URL,
    disclaimer: CORRIDOR_DISCLAIMER,
  },
  {
    id: 'paqueta-go534',
    name: 'GO-534 / eixo Jardim Paquetá',
    sectors: ['Jardim Paquetá I', 'Jardim Paquetá II'],
    summary:
      'A pesquisa comunitária descreve o eixo do Paquetá como subcentro de abastecimento e serviços de bairro. A GO-534 possui referência pública e existem estabelecimentos confirmados por listagens atuais, mas o contorno territorial do subcentro ainda precisa de levantamento geoespacial auditável.',
    evidenceStatus: 'community_pending',
    sourceName: COMMUNITY_SOURCE,
    roadEvidenceUrl: ROAD_EVIDENCE_URL,
    disclaimer: CORRIDOR_DISCLAIMER,
  },
];

export const COMMERCIAL_ANCHORS: CommercialAnchorResearch[] = [
  {
    id: 'atacadao-dia-a-dia',
    name: 'Atacadão Dia a Dia — Planaltina de Goiás',
    corridorId: 'leste-pedro-ludovico-go534',
    address: 'Q QM 1 - Lote 31 - SETOR LESTE - PLANALTINA - GO - 73752-010',
    openingHours: 'Segunda a sábado, 07h–22h; domingos e feriados, 07h–20h.',
    evidenceStatus: 'verified_primary',
    sourceName: 'Atacadão Dia a Dia — página oficial da loja Planaltina de Goiás',
    sourceUrl: 'https://atacadaodiaadia.com.br/lojas/go/planaltina-de-goias/',
    checkedAt: '2026-10-14',
    disclaimer: ANCHOR_DISCLAIMER,
  },
  {
    id: 'ultrabox-planaltina-go',
    name: 'ULTRABOX — Planaltina GO',
    corridorId: 'leste-pedro-ludovico-go534',
    address: 'Quadra M 33, S/N - Quadra 27, Lote 14/15 - Santa Rita, Planaltina - GO, 73752-410',
    openingHours: 'Listagem pública consultada indica funcionamento 24 horas, todos os dias.',
    evidenceStatus: 'verified_public_listing',
    sourceName: 'Listagem pública do estabelecimento',
    sourceUrl:
      'https://www.google.com/maps/search/?api=1&query=ULTRABOX%20Planaltina%20GO&query_place_id=ChIJQ4tN18RxWpMR4c8w8IW3Jic',
    checkedAt: '2026-10-14',
    disclaimer: ANCHOR_DISCLAIMER,
  },
  {
    id: 'mix-atacadao-planaltina-go',
    name: 'Mix Atacadão — Planaltina GO',
    corridorId: 'norte-go430',
    address: 'GO-430 - Setor Norte, Planaltina - GO, 73751-107',
    openingHours: 'Segunda a sábado, 07h–22h; domingo, 07h–15h, conforme listagem consultada.',
    evidenceStatus: 'verified_public_listing',
    sourceName: 'Listagem pública do estabelecimento',
    sourceUrl:
      'https://www.google.com/maps/search/?api=1&query=Mix%20Atacad%C3%A3o%20Planaltina%20GO&query_place_id=ChIJH9E_M1dlWpMRYaSuTEonLAQ',
    checkedAt: '2026-10-14',
    disclaimer: ANCHOR_DISCLAIMER,
  },
  {
    id: 'supermercado-mini-preco',
    name: 'Supermercado Mini Preço',
    corridorId: 'centro-elisio-vaz',
    address: 'QA 7, Q. 7 MC, Lote 1 - Setor Norte, Planaltina - GO, 73751-207',
    openingHours: 'Horário não publicado nesta camada: a listagem consultada não apresentou grade confiável.',
    evidenceStatus: 'verified_public_listing',
    sourceName: 'Listagem pública do estabelecimento',
    sourceUrl:
      'https://www.google.com/maps/search/?api=1&query=Supermercado%20Mini%20Pre%C3%A7o%20Planaltina%20GO&query_place_id=ChIJa-3i86p6WpMRxUkppYYPXNo',
    checkedAt: '2026-10-14',
    disclaimer: ANCHOR_DISCLAIMER,
  },
  {
    id: 'supermercado-renatao',
    name: 'Supermercado Renatão',
    corridorId: 'paqueta-go534',
    address: 'GO-534 - Jardim Paquetá II, Planaltina - GO, 73755-230',
    openingHours: 'Todos os dias, 07h–21h, conforme listagem pública consultada.',
    evidenceStatus: 'verified_public_listing',
    sourceName: 'Listagem pública do estabelecimento',
    sourceUrl:
      'https://www.google.com/maps/search/?api=1&query=Supermercado%20Renat%C3%A3o%20Planaltina%20GO&query_place_id=ChIJgewrcydwWpMRDk0hYHZItRE',
    checkedAt: '2026-10-14',
    disclaimer: ANCHOR_DISCLAIMER,
  },
];
