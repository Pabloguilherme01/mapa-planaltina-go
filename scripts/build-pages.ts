import { spawnSync } from 'node:child_process';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { writePagesPwa } from './pagesPwa.ts';
import { parseMunicipalContext } from '../src/utils/municipalContext';
import contextSnapshot from '../src/data/municipalContext.json';
import fuelSnapshot from '../src/data/fuelRegistry.json';
import { parseFuelRegistry } from '../src/utils/fuelRegistry';

parseMunicipalContext(contextSnapshot);
parseFuelRegistry(fuelSnapshot);

const SITE_BASE = '/mapa-planaltina-go/';

process.env.VITE_STATIC_MODE = 'true';
process.env.VITE_SITE_BASE = SITE_BASE;
const exportData = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/export-static.ts'], { stdio: 'inherit', env: process.env });
if (exportData.status !== 0) process.exit(exportData.status || 1);
const build = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], { stdio: 'inherit', env: process.env });
if (build.status !== 0) process.exit(build.status || 1);
await mkdir('dist/fontes', { recursive: true });
await copyFile('dist/index.html', 'dist/fontes/index.html');
await copyFile('dist/index.html', 'dist/404.html');
await writeFile('dist/.nojekyll', '');
await writePagesPwa('dist', SITE_BASE);
