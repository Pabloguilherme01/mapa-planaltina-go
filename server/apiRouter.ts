import { Router, Request, Response } from 'express';
import {
  IbgeAdapter,
  PrefeituraAdapter,
  CnesAdapter,
  InepAdapter,
  OsmAdapter,
} from './adapters/SourceAdapter.ts';
import { catalogSourceMode, pointsRepository } from './repository/PointsRepository.ts';
import { assistantService } from './gemini/assistantService.ts';
import { PointsQuerySchema } from './security/pointQuery.ts';
import { createAssistantRateLimiter } from './security/assistantRateLimiter.ts';
import { AssistantRequestSchema } from './security/assistantRequest.ts';

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

// Ativa-se somente no servidor. Não confiar no X-Forwarded-For fornecido pelo cliente.
const checkRateLimit = createAssistantRateLimiter({
  maxRequests: 20,
  windowMs: 60_000,
  maxClients: 10_000,
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
    console.error('Falha na consulta municipal.', err instanceof Error ? err.name : 'Erro desconhecido');
    res.status(500).json({
      success: false,
      error: 'Serviço municipal temporariamente indisponível.',
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
        mode: catalogSourceMode === 'verified_snapshot' ? 'misto_oficial_demo' : 'demonstrativo',
        disclaimer: catalogSourceMode === 'verified_snapshot'
          ? 'Catálogo municipal validado com pontos reais e DEMO identificados. Consulte a origem e a data de cada registro.'
          : 'Modo demonstrativo — locais ilustrativos, não use para deslocamento.',
      },
    });
  } catch (err: unknown) {
    console.error('Falha na consulta de pontos.', err instanceof Error ? err.name : 'Erro desconhecido');
    res.status(500).json({
      success: false,
      error: 'Catálogo temporariamente indisponível.',
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
    console.error('Falha na consulta de fontes.', err instanceof Error ? err.name : 'Erro desconhecido');
    res.status(500).json({
      success: false,
      error: 'Consulta de fontes temporariamente indisponível.',
    });
  }
});

/**
 * POST /api/assistant
 * Responde dúvidas cívicas estritamente limitadas ao corpus cadastrado
 */
apiRouter.post('/assistant', async (req: Request, res: Response) => {
  // req.ip usa exclusivamente os proxies que o Express explicitamente confia.
  // No servidor atual, trust proxy permanece desativado por padrão.
  const clientIp = req.ip ?? req.socket.remoteAddress ?? '';

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
    });
  }

  try {
    const result = await assistantService.answer(parseResult.data);
    return res.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    console.error('Falha interna no serviço de assistente.', err instanceof Error ? err.name : 'Erro desconhecido');
    return res.status(500).json({
      success: false,
      error: 'Assistente temporariamente indisponível. Tente novamente mais tarde.',
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
