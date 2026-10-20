import { describe, expect, it } from 'vitest';
import { listDirectoryEntries, searchDirectoryEntries } from '../src/utils/unlocatedRegistry.ts';

describe('diretório real sem geocodificação especulativa', () => {
  it('apresenta todos os cadastros municipais disponíveis sem criar pinos falsos', () => {
    const items = listDirectoryEntries();
    expect(items.filter(x => x.kind === 'school')).toHaveLength(63);
    expect(items.filter(x => x.kind === 'fuel')).toHaveLength(17);
    expect(items.filter(x => x.kind === 'commercial')).toHaveLength(5);
    expect(items).toHaveLength(85);
    expect(items.every(x => !('lat' in x) && !('lng' in x) && x.sourceUrl.startsWith('https://'))).toBe(true);
    expect(new Set(items.map(x=>x.id)).size).toBe(items.length);
  });
  it('procura nomes, bairros, endereços e redes com acentos e filtros de categoria', () => {
    const schools = searchDirectoryEntries('escola municipal', ['Educação']);
    expect(schools.length).toBeGreaterThan(5);
    expect(schools.every(x=>x.kind==='school')).toBe(true);
    const anchor=searchDirectoryEntries('Atacadao Dia a Dia',['Comércio']);
    expect(anchor.some(x=>x.name.includes('Atacadão Dia a Dia'))).toBe(true);
    expect(searchDirectoryEntries('posto', ['Educação'])).toEqual([]);
    expect(searchDirectoryEntries('uma consulta que não existe')).toEqual([]);
  });
  it('marca ano e ausência de coordenadas como advertência, jamais como rota pronta', () => {
    const items=listDirectoryEntries();
    expect(items.find(x=>x.kind==='school')?.reference).toContain('2024');
    expect(items.find(x=>x.kind==='fuel')?.reference).toContain('ANP');
    expect(items.every(x=>x.locationStatus==='unlocated' && x.sourceUrl !== '')).toBe(true);
  });
});
