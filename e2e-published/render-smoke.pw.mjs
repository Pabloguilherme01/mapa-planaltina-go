import { test, expect } from '@playwright/test';

// Executa contra o site realmente publicado, depois do deploy.
// Um HTTP 200 ou HTML válido não comprova que o React conseguiu montar o mapa.
for (const device of ['desktop-chromium', 'mobile-chromium']) {
  test(`produção: mapa, busca e planejador renderizam (${device})`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== device, 'Teste do outro perfil de viewport');

    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));

    const path = `./?smoke=render-${device}`;
    const response = await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    expect(response?.ok(), 'O documento principal deve responder com HTTP 2xx').toBe(true);

    const map = page.getByLabel('Mapa geográfico de Planaltina com limite IBGE');
    await expect(page.getByRole('main', { name: 'Área principal do mapa' })).toBeVisible();
    await expect(map).toBeVisible();
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await expect.poll(
      () => page.locator('.leaflet-marker-icon').count(),
      { timeout: 20_000, message: 'O mapa deve apresentar marcadores reais do catálogo' },
    ).toBeGreaterThan(0);

    const isMobile = device === 'mobile-chromium';
    const search = page.getByLabel(isMobile
      ? 'Buscar pontos em Planaltina, Goiás'
      : 'Buscar locais, órgãos e serviços em Planaltina, Goiás');
    await expect(search).toBeVisible();
    await search.fill('termo-inexistente-smoke-published-90538');
    await expect(page.getByText(/Nenhum ponto encontrado/).first()).toBeVisible();
    await search.fill('');

    const plannerButton = page.getByRole('button', { name: 'Planejar viagem', exact: true });
    await expect(plannerButton).toBeVisible();
    await plannerButton.click();
    const planner = page.getByRole('dialog', { name: 'Mobilidade em Planaltina' });
    await expect(planner).toBeVisible();
    await planner.getByRole('button', { name: 'Fechar planejador' }).click();
    await expect(planner).toBeHidden();

    const width = page.viewportSize()?.width ?? 0;
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth, 'A página não deve ter rolagem horizontal').toBeLessThanOrEqual(width);
    expect(runtimeErrors, 'Nenhuma exceção não tratada pode impedir a UI').toEqual([]);
  });
}
