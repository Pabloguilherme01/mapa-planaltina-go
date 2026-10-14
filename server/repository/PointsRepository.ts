import {
  DEMO_DISCLAIMER_TEXT,
  MapPoint,
  ORIGIN_DISCLAIMER_TEXT,
  PointCategory,
  ProvenanceType,
} from '../../src/types/index.ts';

export interface PointsFilterCriteria {
  query?: string;
  categories?: PointCategory[];
  provenance?: ProvenanceType[];
  zone?: 'Urbana' | 'Rural' | 'Distrital';
  limit?: number;
  offset?: number;
}

export interface PointsRepository {
  list(criteria?: PointsFilterCriteria): Promise<MapPoint[]>;
  getById(id: string): Promise<MapPoint | null>;
  search(query: string, categories?: PointCategory[]): Promise<MapPoint[]>;
  getAllForCorpus(): Promise<MapPoint[]>;
  count(criteria?: PointsFilterCriteria): Promise<number>;
}

export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Static baseline of synthetic DEMO points for Planaltina, Goiás (IBGE 5217609)
 * Explicitly synthetic with demo notices.
 */
const SYNTHETIC_DEMO_POINTS: MapPoint[] = [
  // 1. Saúde
  {
    id: 'demo-saude-01',
    name: 'Unidade Básica de Saúde Sintética Central (DEMO)',
    category: 'Saúde',
    description:
      'Ponto ilustrativo para demonstração de interface de atenção primária à saúde em Planaltina, Goiás. Sem agendamento real ou prontuário médico.',
    lat: -15.4512,
    lng: -47.6135,
    zone: 'Urbana',
    isDemo: true,
    demoDisclaimer: DEMO_DISCLAIMER_TEXT,
    provenanceMeta: {
      provenance: 'demo',
      sourceName: 'Catálogo Sintético Local - Planaltina, Goiás',
      sourceUrl: 'https://www.ibge.gov.br/cidades-e-estados/go/planaltina.html',
      license: 'Demonstração Aberta / Prototipagem',
      retrievedAt: '2026-10-14T08:00:00Z',
      verificationStatus: 'synthetic_demo',
      disclaimer: ORIGIN_DISCLAIMER_TEXT,
    },
    tags: ['Atenção Básica', 'Vacinação Simulada', 'Saúde da Família'],
    addressHint: 'Localização ilustrativa no perímetro urbano de Planaltina, Goiás',
  },
  {
    id: 'demo-saude-02',
    name: 'Posto de Saúde Comunitário do Setor Leste (DEMO)',
    category: 'Saúde',
    description:
      'Referência conceitual de posto de saúde satélite para testes de agrupamento cartográfico. Não representa endereço oficial do CNES.',
    lat: -15.4468,
    lng: -47.6041,
    zone: 'Urbana',
    isDemo: true,
    demoDisclaimer: DEMO_DISCLAIMER_TEXT,
    provenanceMeta: {
      provenance: 'demo',
      sourceName: 'Simulação Cadastral Municipal',
      license: 'Demonstração Aberta',
      retrievedAt: '2026-10-14T08:00:00Z',
      verificationStatus: 'synthetic_demo',
      disclaimer: ORIGIN_DISCLAIMER_TEXT,
    },
    tags: ['UBS', 'Atenção Comunitária', 'Triagem'],
    addressHint: 'Zona Leste de Planaltina, Goiás (esquemático)',
  },
  {
    id: 'demo-saude-03',
    name: 'Farmácia Popular de Referência Simulada (DEMO)',
    category: 'Saúde',
    description:
      'Exemplo ilustrativo de dispensação de medicamentos essenciais cadastrado apenas para testes de filtros por categoria.',
    lat: -15.4545,
    lng: -47.6172,
    zone: 'Urbana',
    isDemo: true,
    demoDisclaimer: DEMO_DISCLAIMER_TEXT,
    provenanceMeta: {
      provenance: 'demo',
      sourceName: 'Simulação Cadastral Municipal',
      license: 'Demonstração Aberta',
      retrievedAt: '2026-10-14T08:00:00Z',
      verificationStatus: 'synthetic_demo',
      disclaimer: ORIGIN_DISCLAIMER_TEXT,
    },
    tags: ['Farmácia', 'Medicamentos', 'Demonstrativo'],
    addressHint: 'Área comercial central (ponto simulado)',
  },

  // 2. Educação
  {
    id: 'demo-edu-01',
    name: 'Escola Municipal Exemplo Cerrado (DEMO)',
    category: 'Educação',
    description:
      'Ponto educacional sintético de ensino fundamental I e II para homologação de dados abertos no município 5217609.',
    lat: -15.456,
    lng: -47.611,
    zone: 'Urbana',
    isDemo: true,
    demoDisclaimer: DEMO_DISCLAIMER_TEXT,
    provenanceMeta: {
      provenance: 'demo',
      sourceName: 'Modelo de Censo Escolar Sintético',
      sourceUrl: 'https://www.gov.br/inep/pt-br',
      license: 'Demonstração Acadêmica',
      retrievedAt: '2026-10-14T08:00:00Z',
      verificationStatus: 'synthetic_demo',
      disclaimer: ORIGIN_DISCLAIMER_TEXT,
    },
    tags: ['Ensino Fundamental', 'Educação Básica', 'Demonstração'],
    addressHint: 'Região Escolar Central (esquema ilustrativo)',
  },
  {
    id: 'demo-edu-02',
    name: 'Colégio Estadual Modelo Planaltina (DEMO)',
    category: 'Educação',
    description:
      'Unidade escolar estadual ilustrativa para o ensino médio e técnico profissionalizante.',
    lat: -15.4485,
    lng: -47.6205,
    zone: 'Urbana',
    isDemo: true,
    demoDisclaimer: DEMO_DISCLAIMER_TEXT,
    provenanceMeta: {
      provenance: 'demo',
      sourceName: 'Modelo de Censo Escolar Sintético',
      license: 'Demonstração Acadêmica',
      retrievedAt: '2026-10-14T08:00:00Z',
      verificationStatus: 'synthetic_demo',
      disclaimer: ORIGIN_DISCLAIMER_TEXT,
    },
    tags: ['Ensino Médio', 'Rede Estadual Goiás', 'Juventude'],
    addressHint: 'Setor Norte demonstrativo',
  },
  {
    id: 'demo-edu-03',
    name: 'Centro Municipal de Educação Infantil Piloto (DEMO)',
    category: 'Educação',
    description:
      'Creche e pré-escola modelo simulada para testes de acessibilidade e filtros educacionais.',
    lat: -15.462,
    lng: -47.609,
    zone: 'Urbana',
    isDemo: true,
    demoDisclaimer: DEMO_DISCLAIMER_TEXT,
    provenanceMeta: {
      provenance: 'demo',
      sourceName: 'Modelo de Censo Escolar Sintético',
      license: 'Demonstração Aberta',
      retrievedAt: '2026-10-14T08:00:00Z',
      verificationStatus: 'synthetic_demo',
      disclaimer: ORIGIN_DISCLAIMER_TEXT,
    },
    tags: ['CMEI', 'Primeira Infância', 'Creche'],
    addressHint: 'Setor Sul demonstrativo',
  },

  // 3. Transporte
  {
    id: 'demo-transp-01',
    name: 'Terminal Rodoviário Urbano Integrado (DEMO)',
    category: 'Transporte',
    description:
      'Entroncamento de transporte coletivo municipal e linhas alimentadoras demonstrativo. Sem horários de ônibus reais.',
    lat: -15.4539,
    lng: -47.6165,
    zone: 'Urbana',
    isDemo: true,
    demoDisclaimer: DEMO_DISCLAIMER_TEXT,
    provenanceMeta: {
      provenance: 'demo',
      sourceName: 'Mapeamento de Mobilidade Conceitual',
      license: 'Demonstração Aberta',
      retrievedAt: '2026-10-14T08:00:00Z',
      verificationStatus: 'synthetic_demo',
      disclaimer: ORIGIN_DISCLAIMER_TEXT,
    },
    tags: ['Terminal', 'Ônibus Coletivo', 'Mobilidade Urbana'],
    addressHint: 'Eixo rodoviário central de Planaltina, Goiás',
  },
  {
    id: 'demo-transp-02',
    name: 'Ponto de Integração Rodoviária GO-118 (DEMO)',
    category: 'Transporte',
    description:
      'Ponto de embarque e conexão viária na rota da rodovia estadual, ilustrando a conexão entre Planaltina, Goiás e o norte do estado.',
    lat: -15.438,
    lng: -47.625,
    zone: 'Urbana',
    isDemo: true,
    demoDisclaimer: DEMO_DISCLAIMER_TEXT,
    provenanceMeta: {
      provenance: 'demo',
      sourceName: 'Mapeamento Viário Conceitual',
      license: 'Demonstração Aberta',
      retrievedAt: '2026-10-14T08:00:00Z',
      verificationStatus: 'synthetic_demo',
      disclaimer: ORIGIN_DISCLAIMER_TEXT,
    },
    tags: ['Rodovia', 'Integração Regional', 'GO-118'],
    addressHint: 'Acesso rodoviário estadual',
  },

  // 4. Segurança
  {
    id: 'demo-seg-01',
    name: 'Base Comunitária de Segurança Pública (DEMO)',
    category: 'Segurança',
    description:
      'Ponto representativo de policiamento comunitário e atendimento emergencial. Em caso de socorro real, disque 190 ou 193.',
    lat: -15.4501,
    lng: -47.6148,
    zone: 'Urbana',
    isDemo: true,
    demoDisclaimer: DEMO_DISCLAIMER_TEXT,
    provenanceMeta: {
      provenance: 'demo',
      sourceName: 'Infraestrutura de Segurança Demonstrativa',
      license: 'Demonstração Aberta',
      retrievedAt: '2026-10-14T08:00:00Z',
      verificationStatus: 'synthetic_demo',
      disclaimer: ORIGIN_DISCLAIMER_TEXT,
    },
    tags: ['Policiamento', 'Apoio Comunitário', 'Segurança'],
    addressHint: 'Área central institucional',
  },
  {
    id: 'demo-seg-02',
    name: 'Núcleo de Defesa Civil e Prevenção de Queimadas (DEMO)',
    category: 'Segurança',
    description:
      'Estação de monitoramento de risco e prevenção a focos de calor no bioma Cerrado.',
    lat: -15.461,
    lng: -47.628,
    zone: 'Distrital',
    isDemo: true,
    demoDisclaimer: DEMO_DISCLAIMER_TEXT,
    provenanceMeta: {
      provenance: 'demo',
      sourceName: 'Infraestrutura de Segurança Demonstrativa',
      license: 'Demonstração Aberta',
      retrievedAt: '2026-10-14T08:00:00Z',
      verificationStatus: 'synthetic_demo',
      disclaimer: ORIGIN_DISCLAIMER_TEXT,
    },
    tags: ['Defesa Civil', 'Cerrado', 'Prevenção'],
    addressHint: 'Perímetro sudoeste',
  },

  // 5. Serviços Públicos
  {
    id: 'demo-pub-01',
    name: 'Unidade de Atendimento ao Cidadão - Vapt Vupt Simulado (DEMO)',
    category: 'Serviços Públicos',
    description:
      'Ponto demonstrativo para serviços de protocolo, emissão de documentos municipais e orientação tributária.',
    lat: -15.4525,
    lng: -47.6152,
    zone: 'Urbana',
    isDemo: true,
    demoDisclaimer: DEMO_DISCLAIMER_TEXT,
    provenanceMeta: {
      provenance: 'demo',
      sourceName: 'Catálogo de Serviços Públicos Simulados',
      sourceUrl: 'https://planaltina.go.gov.br',
      license: 'Demonstração Aberta',
      retrievedAt: '2026-10-14T08:00:00Z',
      verificationStatus: 'synthetic_demo',
      disclaimer: ORIGIN_DISCLAIMER_TEXT,
    },
    tags: ['Cidadania', 'Protocolo', 'Documentos'],
    addressHint: 'Centro Cívico (ponto sintético)',
  },
  {
    id: 'demo-pub-02',
    name: 'Agência de Saneamento e Abastecimento Modelo (DEMO)',
    category: 'Serviços Públicos',
    description:
      'Posto operacional ilustrativo de atendimento para rede de água e esgoto do município.',
    lat: -15.4475,
    lng: -47.618,
    zone: 'Urbana',
    isDemo: true,
    demoDisclaimer: DEMO_DISCLAIMER_TEXT,
    provenanceMeta: {
      provenance: 'demo',
      sourceName: 'Catálogo de Serviços Públicos Simulados',
      license: 'Demonstração Aberta',
      retrievedAt: '2026-10-14T08:00:00Z',
      verificationStatus: 'synthetic_demo',
      disclaimer: ORIGIN_DISCLAIMER_TEXT,
    },
    tags: ['Saneamento', 'Água', 'Atendimento'],
    addressHint: 'Área urbana central',
  },

  // 6. Comércio
  {
    id: 'demo-com-01',
    name: 'Feira Livre do Produtor e Artesanato Local (DEMO)',
    category: 'Comércio',
    description:
      'Espaço de comercialização de produtos hortifrutigranjeiros, queijos e doces típicos do cerrado goiano.',
    lat: -15.4552,
    lng: -47.6125,
    zone: 'Urbana',
    isDemo: true,
    demoDisclaimer: DEMO_DISCLAIMER_TEXT,
    provenanceMeta: {
      provenance: 'demo',
      sourceName: 'Inventário Cultural e Econômico Simulado',
      license: 'Demonstração Aberta',
      retrievedAt: '2026-10-14T08:00:00Z',
      verificationStatus: 'synthetic_demo',
      disclaimer: ORIGIN_DISCLAIMER_TEXT,
    },
    tags: ['Feira Livre', 'Agricultura Familiar', 'Artesanato'],
    addressHint: 'Praça de Eventos Municipal',
  },
  {
    id: 'demo-com-02',
    name: 'Armazém de Insumos Agropecuários do Vale (DEMO)',
    category: 'Comércio',
    description:
      'Ponto comercial de abastecimento rural, rações, mudas de cerrado e ferramentas agrícolas.',
    lat: -15.443,
    lng: -47.6198,
    zone: 'Distrital',
    isDemo: true,
    demoDisclaimer: DEMO_DISCLAIMER_TEXT,
    provenanceMeta: {
      provenance: 'demo',
      sourceName: 'Inventário Comercial Simulado',
      license: 'Demonstração Aberta',
      retrievedAt: '2026-10-14T08:00:00Z',
      verificationStatus: 'synthetic_demo',
      disclaimer: ORIGIN_DISCLAIMER_TEXT,
    },
    tags: ['Agropecuária', 'Sementes', 'Comércio Regional'],
    addressHint: 'Eixo de escoamento rural',
  },

  // 7. Lazer
  {
    id: 'demo-lazer-01',
    name: 'Praça das Palmeiras e Convivência Urbana (DEMO)',
    category: 'Lazer',
    description:
      'Área verde pública com pista de caminhada, arborização nativa e bancos de descanso. Espaço ilustrativo para simulação.',
    lat: -15.4508,
    lng: -47.6118,
    zone: 'Urbana',
    isDemo: true,
    demoDisclaimer: DEMO_DISCLAIMER_TEXT,
    provenanceMeta: {
      provenance: 'demo',
      sourceName: 'Espaços Públicos de Convivência (DEMO)',
      license: 'Demonstração Aberta',
      retrievedAt: '2026-10-14T08:00:00Z',
      verificationStatus: 'synthetic_demo',
      disclaimer: ORIGIN_DISCLAIMER_TEXT,
    },
    tags: ['Praça', 'Caminhada', 'Crianças'],
    addressHint: 'Bairro Modelo Central',
  },
  {
    id: 'demo-lazer-02',
    name: 'Complexo Esportivo e Ginásio Comunitário (DEMO)',
    category: 'Lazer',
    description:
      'Instalação esportiva para futebol amador, vôlei e projetos esportivos municipais.',
    lat: -15.4582,
    lng: -47.621,
    zone: 'Urbana',
    isDemo: true,
    demoDisclaimer: DEMO_DISCLAIMER_TEXT,
    provenanceMeta: {
      provenance: 'demo',
      sourceName: 'Espaços Públicos de Convivência (DEMO)',
      license: 'Demonstração Aberta',
      retrievedAt: '2026-10-14T08:00:00Z',
      verificationStatus: 'synthetic_demo',
      disclaimer: ORIGIN_DISCLAIMER_TEXT,
    },
    tags: ['Esporte', 'Futebol', 'Juventude'],
    addressHint: 'Setor Poliesportivo demonstrativo',
  },

  // 8. Meio Ambiente
  {
    id: 'demo-env-01',
    name: 'Mirante Ecológico e Bacia do Rio Maranhão (DEMO)',
    category: 'Meio Ambiente',
    description:
      'Ponto referencial de observação hídrica e conservação das matas ciliares que vertem para o curso do Rio Maranhão.',
    lat: -15.435,
    lng: -47.595,
    zone: 'Rural',
    isDemo: true,
    demoDisclaimer: DEMO_DISCLAIMER_TEXT,
    provenanceMeta: {
      provenance: 'demo',
      sourceName: 'Mapeamento Hidrográfico e Ambiental Simulado',
      license: 'Demonstração Acadêmica',
      retrievedAt: '2026-10-14T08:00:00Z',
      verificationStatus: 'synthetic_demo',
      disclaimer: ORIGIN_DISCLAIMER_TEXT,
    },
    tags: ['Recursos Hídricos', 'Cerrado', 'Rio Maranhão'],
    addressHint: 'Borda nordeste do município de Planaltina, Goiás',
  },
  {
    id: 'demo-env-02',
    name: 'Ecoponto e Viveiro Municipal de Mudas Nativas (DEMO)',
    category: 'Meio Ambiente',
    description:
      'Centro educativo de reprodução de espécies nativas do cerrado (ipês, baru, pequi) e triagem de recicláveis.',
    lat: -15.466,
    lng: -47.618,
    zone: 'Distrital',
    isDemo: true,
    demoDisclaimer: DEMO_DISCLAIMER_TEXT,
    provenanceMeta: {
      provenance: 'demo',
      sourceName: 'Mapeamento Ambiental Simulado',
      license: 'Demonstração Acadêmica',
      retrievedAt: '2026-10-14T08:00:00Z',
      verificationStatus: 'synthetic_demo',
      disclaimer: ORIGIN_DISCLAIMER_TEXT,
    },
    tags: ['Mudas Nativas', 'Reciclagem', 'Educação Ambiental'],
    addressHint: 'Chácaras periurbanas',
  },

  // 9. Rural
  {
    id: 'demo-rural-01',
    name: 'Núcleo de Extensão e Assistência Técnica Rural (DEMO)',
    category: 'Rural',
    description:
      'Posto ilustrativo de orientação agronômica, conservação do solo e crédito rural para pequenos produtores de Planaltina, Goiás.',
    lat: -15.422,
    lng: -47.64,
    zone: 'Rural',
    isDemo: true,
    demoDisclaimer: DEMO_DISCLAIMER_TEXT,
    provenanceMeta: {
      provenance: 'demo',
      sourceName: 'Cadastro de Desenvolvimento Rural Simulado',
      license: 'Demonstração Aberta',
      retrievedAt: '2026-10-14T08:00:00Z',
      verificationStatus: 'synthetic_demo',
      disclaimer: ORIGIN_DISCLAIMER_TEXT,
    },
    tags: ['Agricultura Familiar', 'Extensão Rural', 'Solo'],
    addressHint: 'Gleba Rural Norte (demonstração)',
  },
  {
    id: 'demo-rural-02',
    name: 'Associação Comunitária Agroecológica do Entorno (DEMO)',
    category: 'Rural',
    description:
      'Ponto de encontro de agricultores familiares dedicados ao cultivo agroecológico de hortaliças e frutas do cerrado.',
    lat: -15.475,
    lng: -47.585,
    zone: 'Rural',
    isDemo: true,
    demoDisclaimer: DEMO_DISCLAIMER_TEXT,
    provenanceMeta: {
      provenance: 'demo',
      sourceName: 'Cadastro de Desenvolvimento Rural Simulado',
      license: 'Demonstração Aberta',
      retrievedAt: '2026-10-14T08:00:00Z',
      verificationStatus: 'synthetic_demo',
      disclaimer: ORIGIN_DISCLAIMER_TEXT,
    },
    tags: ['Agroecologia', 'Comunidade Rural', 'Feira do Entorno'],
    addressHint: 'Região do Córrego do Meio (simulada)',
  },
];

export class InMemoryPointsRepository implements PointsRepository {
  private points: MapPoint[] = [...SYNTHETIC_DEMO_POINTS];

  async list(criteria?: PointsFilterCriteria): Promise<MapPoint[]> {
    let result = [...this.points];

    if (criteria?.categories && criteria.categories.length > 0) {
      result = result.filter((p) => criteria.categories!.includes(p.category));
    }

    if (criteria?.provenance && criteria.provenance.length > 0) {
      result = result.filter((p) =>
        criteria.provenance!.includes(p.provenanceMeta.provenance)
      );
    }

    if (criteria?.zone) {
      result = result.filter((p) => p.zone === criteria.zone);
    }

    if (criteria?.query && criteria.query.trim().length > 0) {
      const q = normalizeText(criteria.query);
      result = result.filter((p) => {
        const nameNorm = normalizeText(p.name);
        const descNorm = normalizeText(p.description);
        const catNorm = normalizeText(p.category);
        const tagsNorm = p.tags.map(normalizeText).join(' ');
        const addressNorm = normalizeText(p.addressHint || '');
        return (
          nameNorm.includes(q) ||
          descNorm.includes(q) ||
          catNorm.includes(q) ||
          tagsNorm.includes(q) ||
          addressNorm.includes(q)
        );
      });
    }

    const offset = criteria?.offset || 0;
    const limit = criteria?.limit || result.length;

    return result.slice(offset, offset + limit);
  }

  async getById(id: string): Promise<MapPoint | null> {
    const point = this.points.find((p) => p.id === id);
    return point || null;
  }

  async search(
    query: string,
    categories?: PointCategory[]
  ): Promise<MapPoint[]> {
    return this.list({ query, categories });
  }

  async getAllForCorpus(): Promise<MapPoint[]> {
    return [...this.points];
  }

  async count(criteria?: PointsFilterCriteria): Promise<number> {
    const list = await this.list({ ...criteria, limit: undefined, offset: 0 });
    return list.length;
  }
}

export const pointsRepository = new InMemoryPointsRepository();
