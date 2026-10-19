import express, { type ErrorRequestHandler } from 'express';
import { apiRouter } from './apiRouter.ts';

export function createExpressApp() {
  // Bloquear apenas a inicialização real da API. O Vite preview importa
  // módulos de backend mesmo com NODE_ENV=production.
  if (process.env.NODE_ENV === 'production' &&
      (!process.env.CATALOG_SNAPSHOT_PATH || process.env.VITE_STATIC_MODE === 'true')) {
    throw new Error('API em produção exige CATALOG_SNAPSHOT_PATH e não aceita VITE_STATIC_MODE.');
  }
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
  // O contrato do assistente aceita até 500 caracteres, mais histórico limitado.
  // Não é necessário aceitar corpos HTTP arbitrariamente grandes.
  app.use(express.json({ limit: '16kb' }));

  // Mount API router
  app.use('/api', apiRouter);

  const safeJsonErrors: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    const kind = error instanceof Error && 'type' in error
      ? String((error as Error & { type: unknown }).type)
      : '';
    if (kind === 'entity.too.large') {
      res.status(413).json({ success: false, error: 'Requisição excede o tamanho permitido.' });
      return;
    }
    if (kind === 'entity.parse.failed') {
      res.status(400).json({ success: false, error: 'JSON inválido.' });
      return;
    }
    res.status(500).json({ success: false, error: 'Requisição não pôde ser processada.' });
  };
  app.use(safeJsonErrors);

  return app;
}
