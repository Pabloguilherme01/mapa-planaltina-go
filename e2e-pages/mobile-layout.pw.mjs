import { test, expect } from '@playwright/test';

for (const width of [320, 390, 768]) {
  test(`mobile ${width}: busca compacta, resultados e seleção no mapa`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('./');
    const sheet = page.locator('#bottomSheet');
    await expect(sheet).toHaveClass(/catalog-collapsed/);
    await expect(page.locator('#mobile-points-list')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const search = page.getByLabel('Buscar pontos em Planaltina, Goiás');
    await search.fill('termo-inexistente-qa');
    await expect(sheet).toHaveClass(/catalog-expanded/);
    await expect(sheet.getByText('Nenhum ponto encontrado com os filtros atuais.')).toBeVisible();
    await search.fill('');
    await sheet.getByRole('button', { name: 'Focar', exact: true }).first().click();
    await expect(sheet).toHaveClass(/catalog-collapsed/);
    await page.getByRole('button', { name: 'Planejar viagem', exact: true }).click();
    await page.getByRole('button', { name: 'Marcar destino no mapa' }).click();
    await expect(sheet).toHaveCount(0);
    await expect(page.locator('main')).toHaveAttribute('data-picking', 'true');
    await page.getByRole('button', { name: 'Cancelar seleção' }).click();
    await expect(sheet).toHaveClass(/catalog-collapsed/);
  });
}
