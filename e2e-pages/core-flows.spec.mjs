import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_PATH = '/mapa-planaltina-go/';

test('mobile: busca e rota de fontes funcionam sem quebrar o layout principal', async ({ page }) => {
  await page.goto('./');

  const search = page.getByLabel('Buscar pontos em Planaltina, Goiás');
  await expect(search).toBeVisible();
  await search.fill('termo-inexistente-qa');
  await expect(page.getByText('Nenhum ponto demonstrativo encontrado com os filtros atuais.')).toBeVisible();

  await page.getByRole('navigation', { name: 'Navegação móvel' }).getByRole('button', { name: /Fontes/i }).click();
  await expect(page).toHaveURL(new RegExp(`${BASE_PATH}fontes/?$`));
  await expect(page.getByRole('heading', { name: 'Fontes & Transparência Territorial' })).toBeVisible();
});

test('desktop: mapa, fontes e artefatos PWA estão acessíveis', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Cobertura desktop específica');

  await page.goto('./');
  await expect(page.getByRole('main', { name: 'Área principal do mapa' })).toBeVisible();

  const manifest = await request.get(`${page.url()}manifest.webmanifest`);
  expect(manifest.ok()).toBeTruthy();
  const manifestJson = await manifest.json();
  expect(manifestJson.start_url).toBe(BASE_PATH);
  expect(manifestJson.scope).toBe(BASE_PATH);

  const serviceWorker = await request.get(`${page.url()}sw.js`);
  expect(serviceWorker.ok()).toBeTruthy();
  expect(await serviceWorker.text()).toContain(`${BASE_PATH}data/points.json`);
});

test('páginas principais não têm violações críticas ou sérias de acessibilidade', async ({ page }) => {
  await page.goto('./');

  const mapResults = await new AxeBuilder({ page }).analyze();
  const mapBlocking = mapResults.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact));
  expect(mapBlocking, JSON.stringify(mapBlocking, null, 2)).toEqual([]);

  await page.goto('./fontes/');
  await expect(page.getByRole('heading', { name: 'Fontes & Transparência Territorial' })).toBeVisible();

  const sourcesResults = await new AxeBuilder({ page }).analyze();
  const sourcesBlocking = sourcesResults.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact));
  expect(sourcesBlocking, JSON.stringify(sourcesBlocking, null, 2)).toEqual([]);
});
