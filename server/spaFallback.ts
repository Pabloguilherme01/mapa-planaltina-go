import path from 'node:path';
import type { Express } from 'express';

/** Express 5 requer nomes para curingas de rota. /{*path} cobre raiz e subrotas. */
export function registerSpaFallback(app: Express, distPath: string): void {
  app.get('/{*path}', (req, res, next) => {
    if (req.path.startsWith('/api')) { next(); return; }
    res.sendFile(path.join(distPath, 'index.html'), (error) => {
      if (error && !res.headersSent) {
        res.status(200).send('Servidor Mapa Planaltina GO em execução. Frontend em carregamento.');
      }
    });
  });
}
