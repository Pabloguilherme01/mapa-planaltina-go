import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const schemaUrl = new URL('../server/database/migration_postgis.sql', import.meta.url);

describe('esquema PostGIS de referência', () => {
  it('não inventa zona Urbana para registros sem classificação da fonte', async () => {
    const sql = await readFile(schemaUrl, 'utf8');
    expect(sql).toMatch(/zone\s+VARCHAR\(32\)\s+NOT NULL\s+DEFAULT\s+'Não classificada'/i);
    expect(sql).not.toMatch(/zone\s+VARCHAR\(32\)\s+(?:NOT NULL\s+)?DEFAULT\s+'Urbana'/i);
  });

  it('corrige também o default de tabelas criadas por uma versão anterior', async () => {
    const sql = await readFile(schemaUrl, 'utf8');
    expect(sql).toMatch(
      /ALTER\s+TABLE\s+planaltina_points\s+ALTER\s+COLUMN\s+zone\s+SET\s+DEFAULT\s+'Não classificada'/i
    );
  });
});
