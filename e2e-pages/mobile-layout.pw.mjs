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

for (const viewport of [
  { width: 320, height: 700 },
  { width: 390, height: 844 },
]) {
  test(`mobile ${viewport.width}px: zoom acessível, lista utilizável e fontes claras`, async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.includes('mobile'), 'Fluxo específico mobile');
    await page.setViewportSize(viewport);
    await page.goto('./');

    const zoomIn = page.locator('.leaflet-control-zoom-in');
    const planner = page.getByRole('button', { name: 'Planejar viagem' });
    await expect(zoomIn).toBeVisible();
    await expect(planner).toBeVisible();
    const zoomRect = await zoomIn.boundingBox();
    const planRect = await planner.boundingBox();
    expect(zoomRect).not.toBeNull();
    expect(planRect).not.toBeNull();
    const overlap = zoomRect.x < planRect.x + planRect.width
      && zoomRect.x + zoomRect.width > planRect.x
      && zoomRect.y < planRect.y + planRect.height
      && zoomRect.y + zoomRect.height > planRect.y;
    expect(overlap, 'Zoom não pode ser encoberto pelo planejador').toBe(false);

    await page.locator('#mobile-search-input').fill('centro');
    const results = page.locator('#mobile-points-list');
    await expect(results).toBeVisible();
    const resultsRect = await results.boundingBox();
    expect(resultsRect?.height, 'Resultados precisam de espaço para leitura e toque').toBeGreaterThan(100);

    await page.getByRole('navigation', { name: 'Navegação móvel' })
      .getByRole('button', { name: 'Fontes, proveniência e serviços digitais' }).click();
    await expect(page).toHaveURL(/\/fontes\/?$/);
  });
}
