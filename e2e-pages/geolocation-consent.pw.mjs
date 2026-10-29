import { test, expect } from '@playwright/test';

// Simula GPS controlado para reproduzir callbacks tardios sem depender de
// permissões reais, sinal de satélite ou da posição do executor de CI.
async function mockPendingGeolocation(page) {
  await page.addInitScript(() => {
    const pending = [];
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition(onSuccess, onError) {
          pending.push({ onSuccess, onError });
        },
      },
    });
    window.__gpsPendingQA = {
      count: () => pending.length,
      success: (index) => pending[index].onSuccess({
        coords: { latitude: -15.623, longitude: -47.66 },
      }),
      denied: (index) => pending[index].onError({
        code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3,
      }),
    };
  });
}

test('GPS: cancelar e reabrir ignora respostas antigas e aceita apenas o pedido vigente', async ({ page }) => {
  await mockPendingGeolocation(page);
  await page.goto('./');

  const locate = page.locator('button[title^="Localizar no dispositivo"]');
  const positionControl = page.getByLabel('Controles do mapa').locator('button').filter({ hasText: 'Minha posição' });
  await expect(page.getByLabel('Controles do mapa')).toBeVisible();
  await expect(positionControl).toHaveCount(0);

  await locate.click();
  let dialog = page.getByRole('dialog', { name: 'Ativar Geolocalização?' });
  await dialog.getByRole('button', { name: 'Permitir no Dispositivo' }).click();
  expect(await page.evaluate(() => window.__gpsPendingQA.count())).toBe(1);

  await dialog.getByRole('button', { name: 'Cancelar' }).click();
  await expect(dialog).toBeHidden();
  await page.evaluate(() => window.__gpsPendingQA.success(0));
  await expect(positionControl).toHaveCount(0);

  await locate.click();
  dialog = page.getByRole('dialog', { name: 'Ativar Geolocalização?' });
  await dialog.getByRole('button', { name: 'Permitir no Dispositivo' }).click();
  expect(await page.evaluate(() => window.__gpsPendingQA.count())).toBe(2);
  await page.evaluate(() => window.__gpsPendingQA.denied(0));
  await expect(dialog.getByRole('button', { name: 'Obtendo posição...' })).toBeDisabled();
  await expect(dialog.getByRole('alert')).toHaveCount(0);
  await expect(positionControl).toHaveCount(0);

  await page.evaluate(() => window.__gpsPendingQA.success(1));
  await expect(dialog).toBeHidden();
  await expect(positionControl).toHaveCount(1);
});

test('GPS: Escape, botão Fechar e backdrop invalidam callbacks pendentes', async ({ page }) => {
  await mockPendingGeolocation(page);
  await page.goto('./');

  const locate = page.locator('button[title^="Localizar no dispositivo"]');
  const positionControl = page.getByLabel('Controles do mapa').locator('button').filter({ hasText: 'Minha posição' });
  await expect(page.getByLabel('Controles do mapa')).toBeVisible();

  for (const closeMethod of ['Escape', 'Fechar', 'backdrop']) {
    await locate.click();
    const dialog = page.getByRole('dialog', { name: 'Ativar Geolocalização?' });
    await dialog.getByRole('button', { name: 'Permitir no Dispositivo' }).click();
    const requestIndex = (await page.evaluate(() => window.__gpsPendingQA.count())) - 1;

    if (closeMethod === 'Escape') await page.keyboard.press('Escape');
    else if (closeMethod === 'Fechar') await dialog.getByRole('button', { name: 'Fechar' }).click();
    else await dialog.click({ position: { x: 4, y: 4 } });

    await expect(dialog).toBeHidden();
    await page.evaluate((index) => window.__gpsPendingQA.success(index), requestIndex);
    await expect(positionControl).toHaveCount(0);
  }
});
