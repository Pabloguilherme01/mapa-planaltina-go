import type { MapPoint, PointCategory } from '../types/index.ts';
import { inPlanaltina } from './territory.ts';
import { isSnapshotDate } from './snapshotDate.ts';

export const CNEFE_SOURCE = 'https://ftp.ibge.gov.br/Cadastro_Nacional_de_Enderecos_para_Fins_Estatisticos/Censo_Demografico_2022/Arquivos_CNEFE/CSV/Municipio/52_GO/5217609_PLANALTINA.zip';
export const CNEFE_NOTICE = 'Registro histórico do Censo 2022. Nome e coordenada constam no IBGE; funcionamento, endereço e atendimento atuais precisam ser confirmados.';
const kinds: Record<string, [PointCategory, string]> = {
  '3': ['Rural', 'Estabelecimento agropecuário'],
  '4': ['Educação', 'Estabelecimento de ensino'],
  '5': ['Saúde', 'Estabelecimento de saúde'],
  '6': ['Comércio', 'Estabelecimento de outras finalidades'],
  '8': ['Lazer', 'Estabelecimento religioso'],
};
type SourcePoint = { id?: string; provenanceMeta?: { provenance?: string; verificationStatus?: string; sourceUrl?: string } };
export function isCensusPoint(point: SourcePoint): boolean {
  return /^cnefe-2022-[1-9]\d*-[a-f0-9]{12}$/.test(point.id ?? '') &&
    point.provenanceMeta?.provenance === 'official' &&
    point.provenanceMeta.verificationStatus === 'pending' && point.provenanceMeta.sourceUrl === CNEFE_SOURCE;
}

/** Tuplas sanitizadas pelo importador; nunca contém domicílios ou coordenadas estimadas. */
export function censusPoints(payload: unknown): MapPoint[] {
  const data = payload as { municipality?: string; year?: number; retrievedAt?: string; rows?: unknown[] };
  if (!data || data.municipality !== '5217609' || data.year !== 2022 ||
      !isSnapshotDate(data.retrievedAt) || !Array.isArray(data.rows) || data.rows.length > 20_000) {
    throw new Error('Snapshot CNEFE inválido.');
  }
  const seen = new Set<string>();
  const points: MapPoint[] = [];
  for (const raw of data.rows) {
    if (!Array.isArray(raw) || raw.length !== 7) throw new Error('Registro CNEFE inválido.');
    const [id, name, species, lat, lng, address, district] = raw;
    if (typeof id !== 'string' || !/^cnefe-2022-[1-9]\d*-[a-f0-9]{12}$/.test(id) || seen.has(id) ||
        ![name, address, district].every(value => typeof value === 'string' && value.length <= 300 && !/[<>\u0000-\u001f]/.test(value)) ||
        !/\p{L}{2}/u.test(name) || !Object.hasOwn(kinds, species) ||
        typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) {
      throw new Error('Identidade, endereço ou coordenada CNEFE inválida.');
    }
    seen.add(id);
    if (!inPlanaltina(lat, lng)) continue;
    const [category, label] = kinds[species];
    points.push({ id, name, category, lat, lng, zone: 'Não classificada', isDemo: false, demoDisclaimer: '',
      description: `${label} identificado no Censo 2022. ${CNEFE_NOTICE}`,
      addressHint: [address, district].filter(Boolean).join(' — '),
      tags: [`Tipo: ${label} (Censo 2022)`, 'Referência: Censo 2022', ...(district ? [`Localidade: ${district}`] : [])],
      provenanceMeta: { provenance: 'official', verificationStatus: 'pending', sourceName: 'IBGE — CNEFE / Censo 2022',
        sourceUrl: CNEFE_SOURCE, license: 'Dados públicos IBGE — atribuição da fonte', retrievedAt: data.retrievedAt!, disclaimer: CNEFE_NOTICE },
    });
  }
  return points;
}
