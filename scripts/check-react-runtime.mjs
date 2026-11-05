import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);

export function assertReactVersions(react, reactDom) {
  if (!react || react !== reactDom) {
    throw new Error(`Runtime React incompatível: react=${react}, react-dom=${reactDom}. As versões devem ser idênticas.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const react = require('react/package.json').version;
  const reactDom = require('react-dom/package.json').version;
  assertReactVersions(react, reactDom);
  // Exercise the production entry point, where React rejects mismatched renderers.
  process.env.NODE_ENV = 'production';
  await import('react-dom/client');
  console.log(`Runtime de produção validado: react e react-dom ${react}.`);
}
