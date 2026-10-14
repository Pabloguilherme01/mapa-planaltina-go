import express from 'express';
import { apiRouter } from './apiRouter.ts';

export function createExpressApp() {
  const app = express();

  app.use(express.json());

  // Mount API router
  app.use('/api', apiRouter);

  return app;
}
