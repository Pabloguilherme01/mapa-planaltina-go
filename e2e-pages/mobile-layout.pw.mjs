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

test('mobile: tocar em um marcador abre sua ficha e preserva o mapa ao fechar', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Fluxo específico mobile');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  const search = page.getByLabel('Buscar pontos em Planaltina, Goiás');
  await search.fill('UNIDADE DE PRONTO ATENDIMENTO UPA');
  await page.getByRole('button', { name: 'Focar', exact: true }).first().click();
  await expect(page.locator('#bottomSheet')).toHaveClass(/catalog-collapsed/);
  const marker = page.locator('.municipal-marker').first();
  await expect(marker).toBeVisible();
  await marker.click();
  const detail = page.getByRole('dialog', { name: 'UNIDADE DE PRONTO ATENDIMENTO UPA' });
  await expect(detail).toBeVisible();
  await detail.getByRole('button', { name: 'Fechar ficha cadastral' }).click();
  await expect(detail).toHaveCount(0);
  await expect(page.getByLabel('Mapa geográfico de Planaltina com limite IBGE')).toBeVisible();
});

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
    // Detecta sobreposição por hit-test, mesmo quando os retângulos parecem separados.
    await zoomIn.click({ trial: true });
    await page.locator('.leaflet-control-zoom-out').click({ trial: true });

    await page.locator('#mobile-search-input').fill('centro');
    const results = page.locator('#mobile-points-list');
    await expect(results).toBeVisible();
    // A expansão tem transição CSS de 300ms; medir o tamanho final,
    // não o primeiro frame (que ainda tem altura de painel recolhido).
    await expect.poll(async () => (await results.boundingBox())?.height ?? 0, {
      message: 'Resultados precisam de espaço para leitura e toque após expandir',
      timeout: 5_000,
    }).toBeGreaterThan(100);

    await page.getByRole('navigation', { name: 'Navegação móvel' })
      .getByRole('button', { name: 'Fontes, proveniência e serviços digitais' }).click();
    await expect(page).toHaveURL(/\/fontes\/?$/);
  });
}

for (const width of [320, 390]) {
  test(`mobile ${width}px: cores e navegação legíveis no tema escuro`, async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.includes('mobile'), 'Fluxo específico mobile');
    await page.setViewportSize({ width, height: 844 });
    await page.goto('./');
    await page.getByLabel('Aparência').selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const nav = page.getByRole('navigation', { name: 'Navegação móvel' });
    const active = nav.getByRole('button', { name: 'Mapa', exact: true });
    await expect(nav).toHaveCSS('background-color', 'rgb(25, 38, 48)');
    await expect(active).toHaveCSS('background-color', 'rgb(36, 67, 57)');
    await expect(active).toHaveCSS('color', 'rgb(234, 242, 238)');
    const box = await active.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test('mobile: busca e cartões mantêm separação visual nos dois temas', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Fluxo específico mobile');
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('./');
  await page.getByLabel('Aparência').selectOption('light');
  const search = page.getByLabel('Buscar pontos em Planaltina, Goiás');
  await search.fill('UPA');
  const card = page.getByTestId('mobile-place-card').first();
  await expect(card).toBeVisible();
  await expect(card).toHaveCSS('background-color', 'rgb(248, 249, 245)');
  await page.getByLabel('Aparência').selectOption('dark');
  await expect(card).toHaveCSS('background-color', 'rgb(36, 52, 58)');
  await expect(search).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('desktop: os dois controles de zoom ficam clicáveis sem sobreposição do planejador', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Fluxo específico desktop');
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Planejar viagem' })).toBeVisible();
  await page.locator('.leaflet-control-zoom-in').click({ trial: true });
  await page.locator('.leaflet-control-zoom-out').click({ trial: true });
});

test('desktop: centralizar novamente o mesmo local após mover o mapa', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Fluxo do painel desktop');
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('./');
  await page.getByLabel('Buscar locais, órgãos e serviços em Planaltina, Goiás').fill('UNIDADE DE PRONTO ATENDIMENTO UPA');
  await page.getByRole('button', { name: 'Ver no Mapa' }).first().click();
  const map = page.getByLabel('Mapa geográfico de Planaltina com limite IBGE');
  const pane = page.locator('.leaflet-map-pane');
  const offset = () => pane.evaluate(el => {
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return { x: m.m41, y: m.m42 };
  });
  await page.waitForTimeout(700); // Aguarda a animação do panTo do Leaflet.
  const focused = await offset();
  const box = await map.boundingBox();
  expect(box).not.toBeNull();
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 160, y + 60, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => {
    const p = await offset();
    return Math.hypot(p.x - focused.x, p.y - focused.y);
  }).toBeGreaterThan(30);
  await page.getByRole('button', { name: 'Centralizar novamente' }).click();
  await expect.poll(async () => {
    const p = await offset();
    return Math.hypot(p.x - focused.x, p.y - focused.y);
  }).toBeLessThan(5);
});
