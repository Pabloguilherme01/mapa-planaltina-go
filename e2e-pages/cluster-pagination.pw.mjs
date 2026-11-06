import { test, expect } from '@playwright/test';

test('abre a última ficha de um grupo com mais de 80 locais coincidentes', async ({ page }) => {
  // Somente a resposta deste navegador usa cópias de um registro para testar o limite.
  await page.route('**/data/points.json', async route => {
    const response = await route.fetch();
    const snapshot = await response.json();
    const template = snapshot.data.find(point => point.name.includes('UNIDADE DE PRONTO ATENDIMENTO UPA'));
    expect(template).toBeTruthy();
    snapshot.data = Array.from({ length: 81 }, (_, index) => ({
      ...template, id: `qa-grupo-${index + 1}`, name: `Local de teste ${index + 1}`,
    }));
    snapshot.meta.count = snapshot.meta.total = snapshot.data.length;
    await route.fulfill({ json: snapshot });
  });
  await page.goto('./');
  await page.getByRole('button', { name: '81 locais — ampliar grupo' }).click();
  const panel = page.getByRole('region', { name: 'Selecionar local no agrupamento' });
  const choices = panel.locator('.municipal-cluster-options button');
  const next = panel.getByRole('button', { name: 'Próximos' });
  const previous = panel.getByRole('button', { name: 'Anteriores' });
  await expect(choices).toHaveCount(40);
  await expect(previous).toBeDisabled();
  await next.click();
  await expect(choices.first()).toBeFocused();
  await expect(panel.getByRole('status')).toHaveText('Locais 41 a 80 de 81');
  await previous.click();
  await expect(choices.first()).toContainText('Local de teste 1 ·');
  await next.click();
  await next.click();
  await expect(choices).toHaveCount(1);
  await expect(next).toBeDisabled();
  await choices.first().click();
  await expect(page.getByRole('dialog', { name: 'Local de teste 81' })).toBeVisible();
});
