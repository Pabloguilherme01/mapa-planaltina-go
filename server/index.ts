import express from 'express';
import { apiRouter } from './apiRouter.ts';

export function createExpressApp() {
  // Bloquear apenas a inicialização real da API. O Vite preview importa
  // módulos de backend mesmo com NODE_ENV=production.
  if (process.env.NODE_ENV === 'production' &&
      (!process.env.CATALOG_SNAPSHOT_PATH || process.env.VITE_STATIC_MODE === 'true')) {
    throw new Error('API em produção exige CATALOG_SNAPSHOT_PATH e não aceita VITE_STATIC_MODE.');
  }
  const app = express();

  app.use(express.json());

  // Mount API router
  app.use('/api', apiRouter);

  return app;
}
