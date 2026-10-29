import { test, expect } from '@playwright/test';

test('catálogo: busca com hífen encontra o mesmo estabelecimento no desktop e mobile', async ({ page, request }, testInfo) => {
  await page.goto('./');

  const snapshotResponse = await request.get(new URL('data/points.json', page.url()).toString());
  expect(snapshotResponse.ok()).toBeTruthy();
  const snapshot = await snapshotResponse.json();
  const point = snapshot.data.find((candidate) =>
    candidate.isDemo === false &&
    candidate.provenanceMeta?.verificationStatus === 'verified' &&
    candidate.category === 'Saúde' &&
    /^\p{L}.*\s+\p{L}/u.test(candidate.name) &&
    candidate.name.trim().split(/\s+/).length >= 3 &&
    candidate.name.length <= 75
  );
  expect(point, 'esperava um serviço de saúde real com nome composto').toBeTruthy();

  const mobile = testInfo.project.name.includes('mobile');
  const search = mobile
    ? page.getByLabel('Buscar pontos em Planaltina, Goiás')
    : page.getByLabel('Buscar locais, órgãos e serviços em Planaltina, Goiás');

  if (mobile) {
    await page.getByRole('button', { name: 'Expandir ou recolher lista de pontos e filtros' }).click();
  }

  const matchedName = page.getByRole('heading', { name: point.name, exact: true }).first();
  const hyphenatedName = point.name.replace(/\s+/, '-');
  await search.fill(hyphenatedName);
  await expect(matchedName).toBeVisible();

  await search.fill(point.name.replace(/\s+/, ', '));
  await expect(matchedName).toBeVisible();

  // O identificador de fonte também continua pesquisável após normalizar o hífen.
  await search.fill(point.id);
  await expect(matchedName).toBeVisible();
});
