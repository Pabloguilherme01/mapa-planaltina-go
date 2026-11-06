import { describe, it, expect } from 'vitest';
import { mapOverpassElements, overpassQuery, validateOsmSnapshot, mergeOsmSnapshots } from '../src/utils/osmCatalog.ts';

const snapshot = '2026-10-19T12:00:00.000Z';
const entry = (id: number, tags: Record<string, string>, lat = -15.4542, lon = -47.6029) =>
  ({ type: 'node', id, lat, lon, tags });

describe('catálogo OSM municipal', () => {
  it('inclui novos tipos nomeados, sem aceitar privados ou fora do município', () => {
    const points = mapOverpassElements({ elements: [
      entry(201, { amenity: 'place_of_worship', name: 'Igreja Exemplo' }),
      entry(202, { amenity: 'driving_school', name: 'Autoescola Exemplo' }),
      entry(203, { amenity: 'car_wash', name: 'Lava-rápido Exemplo' }),
      entry(204, { amenity: 'place_of_worship', name: 'Privado', access: 'private' }),
      entry(205, { amenity: 'bar', name: 'Fora' }, -23.55, -46.63),
      entry(206, { amenity: 'bar' }),
    ] }, snapshot);
    expect(points.map(point => point.id)).toEqual(['osm-node-201', 'osm-node-202', 'osm-node-203']);
    expect(points.every(point => point.provenanceMeta.verificationStatus === 'unverified')).toBe(true);
  });
  it('classifica serviços mapeados de mobilidade e reciclagem sem presumir verificação', () => {
    const points = mapOverpassElements({ elements: [
      entry(51, { amenity: 'charging_station', name: 'Recarga Exemplo' }),
      entry(52, { amenity: 'parking', name: 'Estacionamento Exemplo' }),
      entry(53, { amenity: 'bicycle_parking', name: 'Bicicletário Exemplo' }),
      entry(54, { amenity: 'recycling', name: 'Reciclagem Exemplo' }),
      entry(55, { amenity: 'parking', name: 'Área privada', access: 'private' }),
      entry(56, { amenity: 'recycling' }),
    ] }, snapshot);
    expect(points.map(point => point.category)).toEqual(['Transporte', 'Transporte', 'Transporte', 'Meio Ambiente']);
    expect(points.every(point => point.provenanceMeta.verificationStatus === 'unverified')).toBe(true);
  });

  it('inclui serviços de deslocamento e patrimônio apenas com fonte OSM e nome real', () => {
    const points = mapOverpassElements({ elements: [
      entry(61, { amenity: 'taxi', name: 'Táxi exemplo' }),
      entry(62, { amenity: 'bicycle_rental', name: 'Bicicletas exemplo' }),
      entry(63, { railway: 'station', name: 'Estação exemplo' }),
      entry(64, { emergency: 'ambulance_station', name: 'Base de ambulâncias exemplo' }),
      entry(65, { historic: 'memorial', name: 'Memorial exemplo' }),
      entry(66, { amenity: 'taxi', name: 'Privado', access: 'private' }),
      entry(67, { amenity: 'taxi' }),
      entry(68, { emergency: 'fire_hydrant', name: 'Hidrante não atendível' }),
    ] }, snapshot);
    expect(points.map(p => p.id)).toEqual([
      'osm-node-61', 'osm-node-62', 'osm-node-63', 'osm-node-64', 'osm-node-65',
    ]);
    expect(points.map(p => p.category)).toEqual([
      'Transporte', 'Transporte', 'Transporte', 'Segurança', 'Lazer',
    ]);
    expect(points.every(p => p.provenanceMeta.verificationStatus === 'unverified')).toBe(true);
    expect(overpassQuery('urban')).toContain('["name"]["railway"]');
    expect(overpassQuery('urban')).toContain('["name"]["emergency"]');
    expect(overpassQuery('urban')).toContain('["name"]["historic"]');
  });

  it('apresenta tipos comerciais conhecidos em português sem alterar a origem comunitária', () => {
    const points = mapOverpassElements({ elements: [
      entry(41, { shop: 'beverages', name: 'Loja A' }),
      entry(42, { shop: 'car_parts', name: 'Loja B' }),
      entry(43, { shop: 'mall', name: 'Loja C' }),
      entry(44, { shop: 'stationery', name: 'Loja D' }),
      entry(45, { shop: 'travel_agency', name: 'Loja E' }),
    ] }, snapshot);
    expect(points.map(point => point.tags[0])).toEqual([
      'Tipo: Bebidas', 'Tipo: Autopeças', 'Tipo: Centro comercial', 'Tipo: Papelaria', 'Tipo: Agência de viagens',
    ]);
    expect(points.every(point => point.provenanceMeta.verificationStatus === 'unverified')).toBe(true);
  });

  it('inclui tipos adicionais nomeados, preservando a indicação de fonte comunitária', () => {
    const points = mapOverpassElements({ elements: [
      entry(31, { amenity: 'veterinary', name: 'Veterinária Exemplo' }),
      entry(32, { amenity: 'training', name: 'Centro de formação Exemplo' }),
      entry(33, { leisure: 'nature_reserve', name: 'Reserva Exemplo' }),
      entry(34, { leisure: 'pitch', name: 'Quadra Exemplo' }),
      entry(35, { tourism: 'artwork', name: 'Obra Exemplo' }),
      entry(36, { amenity: 'veterinary' }),
      entry(37, { amenity: 'training', name: 'Fechado', access: 'private' }),
    ] }, snapshot);
    expect(points.map(point => point.category)).toEqual(['Saúde', 'Educação', 'Meio Ambiente', 'Lazer', 'Lazer']);
    expect(points.every(point => point.provenanceMeta.verificationStatus === 'unverified')).toBe(true);
  });
  it('publica somente POIs nomeados dentro da malha IBGE e conserva identidade OSM', () => {
    const result = mapOverpassElements({ elements: [
      entry(1, { amenity: 'school', name: 'Escola Comunitária' }),
      entry(2, { shop: 'supermarket', name: 'Mercado Exemplo' }),
      entry(3, { amenity: 'townhall', name: 'Atendimento Municipal' }),
      entry(4, { shop: 'bakery', name: 'Fora da cidade' }, -23.55, -46.63),
      entry(5, { shop: 'bakery' }),
      entry(6, { shop: 'bakery', name: 'Fechado', disused: 'yes' }),
    ] }, snapshot);
    expect(result.map(point => point.id)).toEqual(['osm-node-1', 'osm-node-2', 'osm-node-3']);
    expect(result.map(point => point.category)).toEqual(['Educação', 'Comércio', 'Serviços Públicos']);
    expect(result[0].provenanceMeta).toMatchObject({
      provenance: 'community', verificationStatus: 'unverified',
      license: 'ODbL 1.0', sourceUrl: 'https://www.openstreetmap.org/node/1',
    });
    expect(result.every(point => !point.isDemo && point.zone === 'Não classificada')).toBe(true);
  });

  it('aceita coordenadas centrais de ways e rejeita registros ambíguos ou duplicados', () => {
    const result = mapOverpassElements({ elements: [
      { type: 'way', id: 8, center: { lat: -15.4542, lon: -47.6029 }, tags: { amenity: 'hospital', name: 'Hospital de referência' } },
      { type: 'way', id: 8, center: { lat: -15.4542, lon: -47.6029 }, tags: { amenity: 'hospital', name: 'Duplicado' } },
      entry(9, { shop: 'retail', name: 'Residência privada', access: 'private' }),
      entry(10, { shop: 'retail', name: 'Nome estranho' }, 0, 0),
      entry(11, { amenity: 'school', name: '<img src=x onerror=alert(1)>' }),
    ] }, snapshot);
    expect(result.map(point => point.id)).toEqual(['osm-way-8']);
  });

  it('não atribui verificação oficial e não vaza telefone ou contato', () => {
    const [point] = mapOverpassElements({ elements: [
      entry(20, { shop: 'bakery', name: 'Panificadora Norte', phone: '61999999999', email: 'secreto@exemplo.org', 'addr:street': 'Rua 1' }),
    ] }, snapshot);
    expect(JSON.stringify(point)).not.toContain('61999999999');
    expect(JSON.stringify(point)).not.toContain('secreto@exemplo.org');
    expect(point.tags).toContain('Tipo: Padaria');
  });

  it('reutiliza somente snapshot de dez ou mais pontos sanitizados e geolocalizados', () => {
    const batch = Array.from({ length: 10 }, (_, i) =>
      entry(100 + i, { shop: 'bakery', name: `Padaria ${i}` }));
    const points = mapOverpassElements({ elements: batch }, snapshot);
    expect(validateOsmSnapshot({ points })).toEqual(points);
    expect(validateOsmSnapshot({ points: points.slice(0, 9) })).toEqual([]);
    expect(validateOsmSnapshot({ points: points.map((p, i) => i === 0 ? { ...p, lat: 0 } : p) })).toEqual([]);
    expect(validateOsmSnapshot({ points: points.map((p, i) => i === 0 ? { ...p, id: 'osm-node-102' } : p) })).toEqual([]);
    expect(validateOsmSnapshot({ points: points.map((p, i) => i === 0 ? { ...p, provenanceMeta: { ...p.provenanceMeta, verificationStatus: 'verified' } } : p) })).toEqual([]);
  });

  it('une extrato regional e coleta Overpass preservando IDs únicos e versões novas', () => {
    const regional = mapOverpassElements({ elements: [
      entry(21, { shop: 'bakery', name: 'Padaria Regional' }),
      entry(22, { amenity: 'school', name: 'Escola Regional' }),
    ] }, '2026-10-15T12:00:00.000Z');
    const live = mapOverpassElements({ elements: [
      entry(21, { shop: 'bakery', name: 'Padaria Atualizada' }),
      entry(23, { amenity: 'townhall', name: 'Serviço Municipal' }),
    ] }, '2026-10-19T18:00:00.000Z');
    const merged = mergeOsmSnapshots(regional, live);
    expect(merged.map(p => p.id)).toEqual(['osm-node-21', 'osm-node-22', 'osm-node-23']);
    expect(merged[0].name).toBe('Padaria Atualizada');
    expect(merged[1].name).toBe('Escola Regional');
    expect(regional[0].name).toBe('Padaria Regional');
    expect(mergeOsmSnapshots(regional, [])).toEqual(regional);
  });

  it('resiste a JSON inválido e restringe a área consultada', () => {
    expect(mapOverpassElements({}, snapshot)).toEqual([]);
    expect(mapOverpassElements({ elements: null }, snapshot)).toEqual([]);
    expect(overpassQuery()).toContain('out center tags');
    expect(overpassQuery()).toContain('shop');
    expect(overpassQuery()).not.toContain('around:');
  });
});
