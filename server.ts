import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createExpressApp } from './server/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = createExpressApp();
const PORT = Number(process.env.PORT) || 3000;

// Serve static frontend assets from dist
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback for frontend navigation
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      // If dist/index.html is not yet built, return informative status
      res.status(200).send('Servidor Mapa Planaltina GO em execução. Frontend em carregamento.');
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mapa Planaltina GO listening on port ${PORT}`);
});
