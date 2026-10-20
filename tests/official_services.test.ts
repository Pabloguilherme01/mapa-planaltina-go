import { describe, expect, it } from 'vitest';
import { OFFICIAL_SERVICES, searchOfficialServices } from '../src/data/officialServices.ts';

describe('serviços oficiais da Prefeitura de Planaltina-GO', () => {
  it('expõe atalhos públicos documentados e URLs seguras, sem coletar identificação do cidadão', () => {
    expect(OFFICIAL_SERVICES.length).toBeGreaterThanOrEqual(10);
    expect(new Set(OFFICIAL_SERVICES.map(service => service.id)).size).toBe(OFFICIAL_SERVICES.length);
    for (const service of OFFICIAL_SERVICES) {
      const url = new URL(service.url);
      expect(url.protocol).toBe('https:');
      expect(url.hostname.endsWith('.go.gov.br') || url.hostname === 'planaltina.go.gov.br' ||
        ['planaltina.centi.com.br', 'go.centi.com.br', 'www.nfse.gov.br','planaltina.bsit-br.com.br'].includes(url.hostname)).toBe(true);
      expect(service.source).toBe('Portal da Prefeitura de Planaltina-GO');
    }
  });
  it('acha serviços por termos sem acento e oferece recursos para comércio e cidadão', () => {
    expect(searchOfficialServices('certidao').some(s=>s.label.includes('Certidão'))).toBe(true);
    expect(searchOfficialServices('nota fiscal').some(s=>s.group==='Empresas')).toBe(true);
    expect(searchOfficialServices('contratos').some(s=>s.group==='Transparência')).toBe(true);
    expect(searchOfficialServices('municipio', 'Cidadão')).toEqual([]);
  });
});
