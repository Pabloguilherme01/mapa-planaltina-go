import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { assertReactVersions } from '../scripts/check-react-runtime.mjs';
const require = createRequire(import.meta.url);

describe('runtime publicado do React', () => {
  it('rejeita a divergência de patch que causou a tela vazia em produção', () => {
    expect(() => assertReactVersions('19.3.1', '19.3.0')).toThrow('incompatível');
    expect(() => assertReactVersions('19.3.1', '19.3.1')).not.toThrow();
  });
  it('mantém manifest, lockfile e instalação com a mesma versão exata', () => {
    const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
    const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
    const version = manifest.dependencies.react;
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(manifest.dependencies['react-dom']).toBe(version);
    for (const name of ['react', 'react-dom']) {
      expect(lock.packages[`node_modules/${name}`].version).toBe(version);
      expect(require(`${name}/package.json`).version).toBe(version);
    }
  });
});
