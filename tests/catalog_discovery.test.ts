import { describe, expect, it } from 'vitest';
import { browseCatalogResources, findCatalogResources } from '../src/utils/catalogDiscovery.ts';

describe('descoberta unificada de cadastros e serviços de Planaltina', () => {
  it('permite explorar 85 registros documentais e 16 serviços digitais sem coordenadas inventadas', () => {
    const all = browseCatalogResources();
    expect(all).toHaveLength(101);
    expect(all.filter(item => item.type === 'directory')).toHaveLength(85);
    expect(all.filter(item => item.type === 'digital')).toHaveLength(16);
    expect(new Set(all.map(item => item.id)).size).toBe(101);
    expect(all.every(item => item.sourceUrl.startsWith('https://'))).toBe(true);
    expect(all.every(item => !('lat' in item) && !('lng' in item))).toBe(true);
  });
  it('encontra certidões digitais, escolas documentais e posto ANP na mesma busca', () => {
    const certificates = findCatalogResources('certidao');
    expect(certificates.some(item => item.type === 'digital' && item.name.includes('Certidão'))).toBe(true);
    expect(findCatalogResources('MACHADO DE ASSIS').some(item => item.type === 'directory' && item.kind === 'school')).toBe(true);
    expect(findCatalogResources('F1 COMBUSTIVEIS').some(item => item.type === 'directory' && item.kind === 'fuel')).toBe(true);
  });
  it('mantém categorias corretas e nunca apresenta cadastro documental como ponto verificado no mapa', () => {
    const publicItems = browseCatalogResources(['Serviços Públicos']);
    expect(publicItems.every(item => item.type === 'digital')).toBe(true);
    expect(publicItems.some(item => item.name.includes('Contratos'))).toBe(true);
    const commerce = browseCatalogResources(['Comércio']);
    expect(commerce.some(item => item.type === 'directory' && item.kind === 'fuel')).toBe(true);
    expect(commerce.some(item => item.type === 'digital' && item.name.includes('NFS-e'))).toBe(true);
    const education = browseCatalogResources(['Educação']);
    expect(education).toHaveLength(63);
    expect(education.every(item => item.type === 'directory' && item.kind === 'school')).toBe(true);
    expect(findCatalogResources('iptu', ['Educação'])).toEqual([]);
    expect(findCatalogResources('   ')).toEqual([]);
  });
});
