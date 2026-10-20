import { afterAll, describe, expect, it } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { registerSpaFallback } from '../server/spaFallback.ts';

const servers: Server[] = [];
afterAll(async () => { await Promise.all(servers.map(s=>new Promise<void>(resolve=>s.close(()=>resolve())))); });

async function start() {
  const app = express();
  app.get('/api/healthcheck', (_req,res)=>res.json({ok:true}));
  registerSpaFallback(app, '/arquivo-inexistente');
  const server = await new Promise<Server>(resolve => { const s=app.listen(0,()=>resolve(s)); });
  servers.push(server);
  const addr=server.address();
  if (!addr || typeof addr==='string') throw new Error('Porta inválida');
  return `http://127.0.0.1:${addr.port}`;
}
describe('fallback SPA em Express 5', () => {
  it('permite rotas sem prefixo e a raiz sem lançar path-to-regexp', async()=>{
    const base=await start();
    const a=await fetch(base+'/qualquer-caminho');
    const b=await fetch(base+'/');
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
  });
  it('nunca mascara respostas da API', async()=>{
    const base=await start();
    expect((await fetch(base+'/api/healthcheck')).status).toBe(200);
    expect((await fetch(base+'/api/nao-existe')).status).toBe(404);
  });
});
