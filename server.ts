import 'dotenv/config';
import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';
import { createExpressApp } from './server/index.ts';
import { registerSpaFallback } from './server/spaFallback.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = createExpressApp();
const PORT = Number(process.env.PORT) || 3000;

// Serve static frontend assets from dist
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Rota de fallback compatível com Express 5 e rotas /api.
registerSpaFallback(app, distPath);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mapa Planaltina GO listening on port ${PORT}`);
});
