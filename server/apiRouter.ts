import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  IbgeAdapter,
  PrefeituraAdapter,
  CnesAdapter,
  InepAdapter,
  OsmAdapter,
} from './adapters/SourceAdapter.ts';
import { pointsRepository } from './repository/PointsRepository.ts';
import { assistantService } from './gemini/assistantService.ts';
import { PointsQuerySchema } from './security/pointQuery.ts';

export const apiRouter = Router();

// Adapters registry
const ibgeAdapter = new IbgeAdapter();
const prefeituraAdapter = new PrefeituraAdapter();
const cnesAdapter = new CnesAdapter();
const inepAdapter = new InepAdapter();
const osmAdapter = new OsmAdapter();

const allAdapters = [
  ibgeAdapter,
  prefeituraAdapter,
  cnesAdapter,
  inepAdapter,
  osmAdapter,
];

// Simple in-memory rate limiter for Assistant API
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count += 1;
  return true;
}

// Zod schema for Assistant POST
const AssistantRequestSchema = z.object({
  message: z.string().min(1, 'Mensagem não pode estar vazia').max(500, 'Mensagem muito longa'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional(),
});

/**
 * GET /api/municipality
 * Retorna dados oficiais do IBGE para Planaltina, Goiás (5217609)
 */
apiRouter.get('/municipality', async (_req: Request, res: Response) => {
  try {
    const data = await ibgeAdapter.getMunicipalityData();
    res.json({
      success: true,
      data,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      success: false,
      error: `Erro ao obter dados do município: ${msg}`,
    });
  }
});

/**
 * GET /api/points
 * Retorna catálogo de pontos com filtros opcionais
 */
apiRouter.get('/points', async (req: Request, res: Response) => {
  try {
    const parsed = PointsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Filtros ou paginação inválidos.',
      });
    }
    const { q: query, categories, provenance, zone, limit, offset } = parsed.data;

    const points = await pointsRepository.list({
      query,
      categories,
      provenance,
      zone,
      limit,
      offset,
    });

    const totalCount = await pointsRepository.count({
      query,
      categories,
      provenance,
      zone,
    });

    res.json({
      success: true,
      data: points,
      meta: {
        total: totalCount,
        count: points.length,
        municipality: 'Planaltina, Goiás',
        ibgeCode: '5217609',
        mode: 'demonstrativo',
        disclaimer: 'Modo demonstrativo — locais ilustrativos, não use para deslocamento.',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      success: false,
      error: `Erro ao listar pontos: ${msg}`,
    });
  }
});

/**
 * GET /api/sources
 * Retorna transparência de fontes e status de conexão dos adaptadores
 */
apiRouter.get('/sources', async (_req: Request, res: Response) => {
  try {
    const statuses = await Promise.all(allAdapters.map((a) => a.checkStatus()));
    res.json({
      success: true,
      data: statuses,
      meta: {
        municipalCode: '5217609',
        municipality: 'Planaltina, Goiás',
        verifiedCount: statuses.filter((s) => s.verified).length,
        totalSources: statuses.length,
        policyNotice:
          'A indicação de repositório ou catálogo governamental não implica verificação oficial de horário, endereço ou rota.',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      success: false,
      error: `Erro ao inspecionar fontes: ${msg}`,
    });
  }
});

/**
 * POST /api/assistant
 * Responde dúvidas cívicas estritamente limitadas ao corpus cadastrado
 */
apiRouter.post('/assistant', async (req: Request, res: Response) => {
  const clientIp =
    (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'Limite de requisições excedido. Por favor, aguarde alguns instantes antes de enviar nova pergunta.',
    });
  }

  const parseResult = AssistantRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Parâmetros inválidos.',
      details: parseResult.error.issues,
    });
  }

  try {
    const result = await assistantService.answer(parseResult.data);
    return res.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({
      success: false,
      error: `Erro ao processar consulta do assistente: ${msg}`,
    });
  }
});

/**
 * GET /api/health
 */
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Mapa Planaltina GO',
    municipality: 'Planaltina, Goiás',
    ibge: '5217609',
    timestamp: new Date().toISOString(),
  });
});
