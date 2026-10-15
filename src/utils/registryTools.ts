import { SCHOOL_REGISTRY } from '../data/schoolRegistry';
import { normalizeText } from './text';

type School = typeof SCHOOL_REGISTRY.items[number];

export function filterSchools(items: School[], query: string, network = '', zone = ''): School[] {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  return items.filter(item => (!network || item.network === network) && (!zone || item.zone === zone) &&
    terms.every(term => normalizeText(`${item.code} ${item.name} ${item.address} ${item.district} ${item.network} ${item.zone}`).includes(term)));
}

function csvCell(value: string | number): string {
  const text = String(value);
  // Spreadsheet formula execution must remain disabled even for unexpected source text.
  const safe = /^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function schoolCsv(items: School[]): string {
  const rows = [
    ['Código INEP', 'Nome', 'Rede', 'Zona', 'Endereço', 'Bairro', 'Ano de referência', 'Fonte', 'Coleta', 'Geometria'],
    ...items.map(item => [item.code, item.name, item.network, item.zone, item.address, item.district,
      SCHOOL_REGISTRY.referenceYear, SCHOOL_REGISTRY.sourceUrl, SCHOOL_REGISTRY.retrievedAt, 'Não fornecida']),
  ];
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(';')).join('\r\n');
}

export function downloadText(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
