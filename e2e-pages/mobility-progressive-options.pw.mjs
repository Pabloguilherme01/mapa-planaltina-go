import { test, expect } from '@playwright/test';

test('mobile: planejador percorre o catálogo em lotes sem ocultar destinos e origens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await page.getByRole('button', { name: 'Planejar viagem' }).click();

  const dialog = page.getByRole('dialog', { name: 'Mobilidade em Planaltina' });
  await expect(dialog).toBeVisible();

  const destinations = dialog.getByRole('combobox', { name: 'Destino real' });
  await expect(destinations.locator('option')).toHaveCount(101);
  await dialog.getByRole('button', { name: 'Carregar mais destinos' }).click();
  await expect(destinations.locator('option')).toHaveCount(201);

  const laterId = await destinations.locator('option').nth(150).getAttribute('value');
  expect(laterId).toBeTruthy();
  await destinations.selectOption(laterId!);
  await expect(destinations).toHaveValue(laterId!);

  const origins = dialog.getByRole('combobox', { name: 'Ponto de partida' });
  await expect(origins.locator('option')).toHaveCount(101);
  await dialog.getByRole('button', { name: 'Carregar mais origens' }).click();
  await expect(origins.locator('option')).toHaveCount(201);

  const search = dialog.getByRole('searchbox', { name: 'Buscar destino por nome ou endereço' });
  await search.fill('zzzz-sem-resultados');
  await expect(destinations.locator('option')).toHaveCount(1);
  await search.fill('');
  await expect(destinations.locator('option')).toHaveCount(101);
  await expect(dialog.getByRole('button', { name: 'Carregar mais destinos' })).toBeVisible();
});
