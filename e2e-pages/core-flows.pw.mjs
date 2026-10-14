import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_PATH = '/mapa-planaltina-go/';

async function waitForServiceWorkerControl(page) {
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) throw new Error('Service worker indisponível');
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return;

    await new Promise((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
    });
  });
}

test('mobile: busca e rota de fontes funcionam sem quebrar o layout principal', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Cobertura mobile específica');

  await page.goto('./');

  const search = page.getByLabel('Buscar pontos em Planaltina, Goiás');
  await expect(search).toBeVisible();
  await search.fill('termo-inexistente-qa');
  await expect(page.getByText('Nenhum ponto demonstrativo encontrado com os filtros atuais.')).toBeVisible();

  await page.getByRole('navigation', { name: 'Navegação móvel' }).getByRole('button', { name: /Fontes/i }).click();
  await expect(page).toHaveURL(new RegExp(`${BASE_PATH}fontes/?$`));
  await expect(page.getByRole('heading', { name: 'Fontes & Transparência Territorial' })).toBeVisible();
});

test('desktop: mapa e artefatos PWA estão acessíveis', async ({ page, request }, testInfo) => {
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

test('desktop: recarrega o mapa sem rede depois que o service worker assume o controle', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Cobertura desktop específica');

  await page.goto('./');
  await waitForServiceWorkerControl(page);

  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('main', { name: 'Área principal do mapa' })).toBeVisible();
    await expect(page.getByText(/Sem conexão:/)).toBeVisible();
    await expect(page.getByText(/snapshots locais/)).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});

test('desktop: geolocalização e assistente prendem foco, fecham com Escape e restauram o acionador', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Cobertura desktop específica');

  await page.goto('./');

  const geoTrigger = page.getByRole('button', { name: 'Perto de mim' });
  await geoTrigger.click();
  const geoDialog = page.getByRole('dialog', { name: 'Ativar Geolocalização?' });
  await expect(geoDialog).toBeVisible();
  await expect(geoDialog.getByRole('button', { name: 'Fechar' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(geoDialog.getByRole('button', { name: 'Cancelar' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(geoDialog).toBeHidden();
  await expect(geoTrigger).toBeFocused();

  const assistantTrigger = page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name: /Assistente Cívico/i });
  await assistantTrigger.click();
  const assistantDialog = page.getByRole('dialog', { name: 'Assistente Cívico Local' });
  await expect(assistantDialog).toBeVisible();
  await expect(assistantDialog.getByRole('button', { name: 'Fechar assistente' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(assistantDialog.getByPlaceholder('Pergunte sobre serviços em Planaltina, Goiás...')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(assistantDialog).toBeHidden();
  await expect(assistantTrigger).toBeFocused();
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
