import { normalizeText } from '../utils/text.ts';

export type OfficialServiceGroup = 'Cidadão' | 'Empresas' | 'Transparência';
export interface OfficialService {
  id: string;
  label: string;
  group: OfficialServiceGroup;
  description: string;
  url: string;
  source: 'Portal da Prefeitura de Planaltina-GO';
}

const SOURCE = 'Portal da Prefeitura de Planaltina-GO' as const;
export const OFFICIAL_SERVICES: OfficialService[] = [
  { id:'iptu', label:'Emitir ou consultar IPTU', group:'Cidadão',
    description:'Consulta municipal de débitos imobiliários, acessada pelo portal oficial.',
    url:'https://planaltina.bsit-br.com.br/portal/immobile/search-debit.jsf', source:SOURCE },
  { id:'certidao-imovel', label:'Certidão de imóvel e cadastro', group:'Cidadão',
    description:'Emissão de certidão cadastral pelo sistema indicado pela Prefeitura.',
    url:'https://planaltina.centi.com.br/servicos/certidaocadastro', source:SOURCE },
  { id:'sic', label:'e-SIC: informação pública', group:'Cidadão',
    description:'Solicitação de acesso à informação municipal.',
    url:'https://acessoainformacao.planaltina.go.gov.br/cidadao/informacao/sic', source:SOURCE },
  { id:'ouvidoria', label:'Ouvidoria municipal', group:'Cidadão',
    description:'Atendimento e manifestações aos órgãos municipais.',
    url:'https://acessoainformacao.planaltina.go.gov.br/cidadao/ouvidoria/inicio', source:SOURCE },
  { id:'legislacao', label:'Legislação tributária', group:'Cidadão',
    description:'Consulta às normas tributárias publicadas pela Prefeitura.',
    url:'https://planaltina.go.gov.br/legislacao-tributaria/', source:SOURCE },
  { id:'nfse', label:'Emitir NFS-e nacional', group:'Empresas',
    description:'Portal nacional de emissão de nota fiscal de serviços, com autenticação.',
    url:'https://www.nfse.gov.br/EmissorNacional/Login?ReturnUrl=%2fEmissorNacional', source:SOURCE },
  { id:'consulta-empresa', label:'Consultar empresa e serviços', group:'Empresas',
    description:'Portal de serviços empresariais indicado pela Prefeitura; pode exigir login.',
    url:'https://go.centi.com.br/planaltina/portalservicos/#/login', source:SOURCE },
  { id:'atividade-economica', label:'Certidão de atividade econômica', group:'Empresas',
    description:'Consulta de cadastro econômico e extrato no sistema municipal.',
    url:'https://planaltina.centi.com.br/servicos/extratoatividadeeconomica', source:SOURCE },
  { id:'licitacoes', label:'Licitações', group:'Transparência',
    description:'Processos licitatórios e acesso à informação.',
    url:'https://acessoainformacao.planaltina.go.gov.br/cidadao/informacao/licitacoes', source:SOURCE },
  { id:'dispensas', label:'Dispensas e inexigibilidades', group:'Transparência',
    description:'Contratações diretas publicadas pelo portal de transparência.',
    url:'https://acessoainformacao.planaltina.go.gov.br/cidadao/informacao/dispensas', source:SOURCE },
  { id:'contratos', label:'Contratos públicos', group:'Transparência',
    description:'Contratos administrativos publicados pela Prefeitura.',
    url:'https://acessoainformacao.planaltina.go.gov.br/cidadao/informacao/contratos', source:SOURCE },
  { id:'despesas', label:'Despesas municipais', group:'Transparência',
    description:'Consultas à execução das despesas públicas.',
    url:'https://acessoainformacao.planaltina.go.gov.br/cidadao/transparencia/despesas', source:SOURCE },
  { id:'receitas', label:'Receitas municipais', group:'Transparência',
    description:'Consultas à arrecadação municipal.',
    url:'https://acessoainformacao.planaltina.go.gov.br/cidadao/transparencia/receitas', source:SOURCE },
  { id:'folhas', label:'Folhas de pagamento', group:'Transparência',
    description:'Folhas publicadas no portal de transparência.',
    url:'https://acessoainformacao.planaltina.go.gov.br/cidadao/transparencia/folhas', source:SOURCE },
  { id:'portarias', label:'Portarias e atos normativos', group:'Transparência',
    description:'Consulta às portarias e normas publicadas.',
    url:'https://acessoainformacao.planaltina.go.gov.br/cidadao/legislacao/portarias', source:SOURCE },
  { id:'fiscal', label:'Responsabilidade fiscal', group:'Transparência',
    description:'Relatórios de gestão fiscal municipal.',
    url:'https://acessoainformacao.planaltina.go.gov.br/cidadao/resp_fiscal/rgfs', source:SOURCE },
];
export function searchOfficialServices(query: string, group?: OfficialServiceGroup): OfficialService[] {
  const tokens = normalizeText(query).split(/\s+/).filter(Boolean);
  return OFFICIAL_SERVICES.filter(service =>
    (!group || service.group === group) &&
    tokens.every(token => normalizeText(service.label + ' ' + service.description).includes(token))
  );
}
