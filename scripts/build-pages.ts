import { spawnSync } from 'node:child_process';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';

process.env.VITE_STATIC_MODE = 'true';
process.env.VITE_SITE_BASE = '/mapa-planaltina-go/';
const exportData = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/export-static.ts'], { stdio: 'inherit', env: process.env });
if (exportData.status !== 0) process.exit(exportData.status || 1);
const build = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], { stdio: 'inherit', env: process.env });
if (build.status !== 0) process.exit(build.status || 1);
await mkdir('dist/fontes', { recursive: true });
await copyFile('dist/index.html', 'dist/fontes/index.html');
await copyFile('dist/index.html', 'dist/404.html');
await writeFile('dist/.nojekyll', '');
