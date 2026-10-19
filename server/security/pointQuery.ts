import { z } from 'zod';
import { CATEGORIES_LIST, type PointCategory } from '../../src/types/index.ts';

const categorySchema = z.string()
  .refine(value => CATEGORIES_LIST.includes(value as PointCategory), 'Categoria inválida')
  .transform(value => value as PointCategory);

const provenanceSchema = z.enum(['official', 'verified_open_data', 'community', 'demo']);
const zoneSchema = z.enum(['Urbana', 'Rural', 'Distrital', 'Não classificada']);

function oneOrMany<T extends z.ZodType>(schema: T) {
  return z.union([schema, z.array(schema).min(1).max(10)]).transform(
    value => Array.isArray(value) ? value : [value]
  );
}

const positiveInt = z.string().regex(/^[1-9]\d*$/).transform(Number)
  .pipe(z.number().int().min(1).max(200));

const offsetInt = z.string().regex(/^(0|[1-9]\d*)$/).transform(Number)
  .pipe(z.number().int().min(0).max(10_000));

/** Contrato único e restrito para filtros via query string do Express. */
export const PointsQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  categories: oneOrMany(categorySchema).optional(),
  provenance: oneOrMany(provenanceSchema).optional(),
  zone: zoneSchema.optional(),
  limit: positiveInt.default(200),
  offset: offsetInt.default(0),
}).strict();
