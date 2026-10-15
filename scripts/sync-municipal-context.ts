import { writeFile, rename } from 'node:fs/promises';
import { DISTRICTS_URL, INDICATORS_URL, parseMunicipalContext } from '../src/utils/municipalContext';

async function fetchJson(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000), headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`IBGE retornou HTTP ${response.status}`);
  return response.json();
}

// Manual sync: failure leaves the versioned, validated snapshot untouched.
const indicators = await fetchJson(INDICATORS_URL);
const districts = await fetchJson(DISTRICTS_URL);
const snapshot = { version: 1, retrievedAt: new Date().toISOString(), indicators, districts };
const context = parseMunicipalContext(snapshot);
const path = 'src/data/municipalContext.json';
await writeFile(`${path}.tmp`, JSON.stringify(snapshot, null, 2) + '\n');
await rename(`${path}.tmp`, path);
console.log(`IBGE validado: ${context.indicators.length} indicadores (${context.referenceYear}), ${context.districts.length} distritos.`);
