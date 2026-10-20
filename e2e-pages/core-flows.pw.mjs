import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_PATH = '/mapa-planaltina-go/';

test('abastecimento: consulta ANP municipal sem preços, pins ou exportação', async ({ page }) => {
  await page.goto('fontes/');
  const registry = page.getByRole('region', { name: 'Abastecimento — cadastro oficial ANP' });
  await expect(registry.getByRole('status')).toHaveText('17 revendedores encontrados');
  await registry.getByLabel('Buscar posto por nome ou bairro').fill('f1 itapua');
  await registry.getByLabel('Bandeira informada na ANP').selectOption('BANDEIRA BRANCA');
  await expect(registry.getByRole('status')).toHaveText('1 revendedor encontrado');
  await expect(registry).toContainText('F1 COMBUSTIVEIS E DERIVADOS LTDA');
  await registry.getByLabel('Bandeira informada na ANP').selectOption('VIBRA');
  await expect(registry.getByRole('status')).toHaveText('0 revendedores encontrados');
  await registry.getByRole('button', { name: 'Limpar filtros de postos' }).click();
  await expect(registry.getByRole('status')).toHaveText('17 revendedores encontrados');
  await expect(registry).toContainText('não fornece preços, horários ou coordenadas');
  await expect(registry.getByRole('button', { name: /baixar|exportar|navega/i })).toHaveCount(0);
  const accessibility = await new AxeBuilder({ page }).include('[aria-labelledby="fuel-title"]').analyze();
  expect(accessibility.violations.filter(issue => ['critical', 'serious'].includes(issue.impact))).toEqual([]);
});

test('favoritos: persistem no aparelho, não duplicam e podem ser removidos offline', async ({ page, context }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Planejar viagem' }).click();
  let planner = page.getByRole('dialog', { name: 'Mobilidade em Planaltina' });
  const options = planner.getByLabel('Destino real').locator('option');
  await expect(options).not.toHaveCount(1);
  const id = await options.nth(1).getAttribute('value');
  await planner.getByLabel('Destino real').selectOption(id);
  await planner.getByRole('button', { name: 'Salvar viagem neste aparelho' }).click();
  await planner.getByRole('button', { name: 'Salvar viagem neste aparelho' }).click();
  await expect(planner.locator('summary')).toHaveText('Destinos salvos (1)');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('planaltina-private-favorites-v1')));
  expect(stored).toEqual([{ id, mode: 'driving' }]);
  await page.reload();
  await page.getByRole('button', { name: 'Planejar viagem' }).click();
  planner = page.getByRole('dialog', { name: 'Mobilidade em Planaltina' });
  await planner.locator('summary').click();
  const saved = planner.locator('details');
  await saved.getByRole('button', { name: /Usar destino salvo/ }).click();
  await expect(planner.getByLabel('Destino real')).toHaveValue(id);
  await context.setOffline(true);
  await expect(planner.getByRole('link', { name: 'Abrir navegação externa' })).toHaveCount(0);
  await saved.getByRole('button', { name: /Remover destino salvo/ }).click();
  await expect(planner.locator('details')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('planaltina-private-favorites-v1')))).toEqual([]);
  await context.setOffline(false);
});

test('ANTT: fontes operacionais oficiais são consultáveis sem publicar horários não validados', async ({ page }) => {
  await page.goto('fontes/');
  const transport = page.getByRole('region', { name: 'Transporte semiurbano — fontes oficiais ANTT' });
  await expect(transport).toContainText('Planaltina-GO');
  await expect(transport).toContainText('não são informados como itinerários confirmados');
  const hours = transport.getByRole('link', { name: 'Consultar quadro de horários na ANTT' });
  const lines = transport.getByRole('link', { name: 'Consultar empresas, linhas e tarifas na ANTT' });
  await expect(hours).toHaveAttribute('href', 'https://www.gov.br/antt/pt-br/assuntos/passageiros/transportesemiurbano/informacoes-operacionais-do-semiurbano/quadro-de-horarios');
  await expect(lines).toHaveAttribute('href', 'https://www.gov.br/antt/pt-br/assuntos/passageiros/transportesemiurbano/informacoes-operacionais-do-semiurbano/relacao-de-empresas-linhas-e-tarifas');
  await expect(transport.getByRole('button', { name: /navegar|comprar|partir/i })).toHaveCount(0);
});

test('consulta municipal: dados e filtros sem downloads ou exportações', async ({ page }) => {
  await page.goto('fontes/');
  const context = page.getByRole('region', { name: 'Planaltina em números — IBGE' });
  await expect(context).toBeVisible();
  await expect(context).toContainText('105.031');
  await expect(context).toContainText('Córrego Rico');
  await expect(context).toContainText('São Gabriel de Goiás');
  await expect(page.getByRole('button', { name: /baixar|exportar/i })).toHaveCount(0);
  await expect(page.locator('a[download]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Ver registros em revisão territorial' })).toHaveCount(0);
  const provenance = page.locator('details').filter({ hasText: 'Como classificamos a procedência' });
  await expect(provenance).not.toHaveAttribute('open', '');
  await provenance.locator('summary').click();
  await expect(provenance).toHaveAttribute('open', '');
  const schools = page.getByRole('region', { name: 'Educação — cadastro oficial SEDUC' });
  await schools.getByLabel('Buscar escola por nome, código ou bairro').fill('mario andrade');
  await schools.getByLabel('Rede de ensino').selectOption('Estadual');
  await schools.getByLabel('Zona da escola').selectOption('Urbana');
  await expect(schools.getByRole('status')).toHaveText('1 registro encontrado');
  await expect(schools).toContainText('52050807');
  await expect(schools).toContainText('2024');
  await expect(schools).toContainText('26 de 63 registros');
  await expect(schools.getByRole('link', { name: 'Catálogo de Escolas do INEP' })).toHaveAttribute('href', /gov\.br\/inep/);
  await schools.getByLabel('Rede de ensino').selectOption('Privada');
  await expect(schools.getByRole('status')).toHaveText('0 registros encontrados');
  await schools.getByRole('button', { name: 'Limpar filtros escolares' }).click();
  await expect(schools.getByRole('status')).toHaveText('63 registros encontrados');
  const accessibility = await new AxeBuilder({ page }).include('[aria-labelledby="municipal-context-title"]').include('[aria-labelledby="schools-title"]').analyze();
  expect(accessibility.violations.filter(issue => ['critical', 'serious'].includes(issue.impact))).toEqual([]);
});

test('mobile: filtro de procedência mantém DEMO separado dos pontos oficiais', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Filtro mobile específico');
  await page.goto('./');
  await page.getByRole('button', { name: 'Expandir ou recolher lista de pontos e filtros' }).click();
  const response = await page.request.get(`${new URL(BASE_PATH, page.url())}data/points.json`);
  expect(response.ok()).toBeTruthy();
  const { data: points } = await response.json();
  expect(points.some(point => !point.isDemo)).toBeTruthy();
  for (const provenance of ['demo', 'official', 'verified_open_data', 'community', 'all']) {
    await page.getByLabel('Origem dos pontos').selectOption(provenance);
    const expected = points.filter(point => provenance === 'all' || point.provenanceMeta.provenance === provenance).length;
    await expect(page.locator('#mobile-results-heading')).toHaveText(`${expected} pontos no catálogo`);
  }
});

test('planejador: modos, viagem privada, economia e consulta offline', async ({ page, context }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Planejar viagem' }).click();
  const planner = page.getByRole('dialog', { name: 'Mobilidade em Planaltina' });
  await expect(planner).toBeVisible();
  const response = await page.request.get(`${new URL(BASE_PATH, page.url())}data/points.json`);
  const data = await response.json();
  const points = Array.isArray(data) ? data : data.data;
  const real = points.find(point => !point.isDemo && point.provenanceMeta.verificationStatus === 'verified');
  await planner.getByLabel('Buscar destino por nome ou endereço').fill(real.id);
  await expect(planner.getByLabel('Destino real').locator('option')).toHaveCount(2);
  await planner.getByLabel('Buscar destino por nome ou endereço').fill('destino-inexistente-qa');
  await expect(planner.getByText('0 destinos disponíveis', { exact: true })).toBeVisible();
  await expect(planner.getByRole('link', { name: 'Abrir navegação externa' })).toHaveCount(0);
  await planner.getByLabel('Buscar destino por nome ou endereço').fill('');
  await planner.getByLabel('Somente vínculo SUS informado no CNES').check();
  const susIds = points.filter(point => !point.isDemo && point.tags.includes('Vínculo SUS: SIM')).map(point => point.id).sort();
  const actualIds = await planner.getByLabel('Destino real').locator('option').evaluateAll(options => options.map(option => option.value).filter(Boolean).sort());
  expect(actualIds).toEqual(susIds);
  await planner.getByLabel('Somente vínculo SUS informado no CNES').uncheck();
  await planner.getByLabel('Destino real').selectOption(real.id);
  await planner.getByLabel('Deslocamento').selectOption('walking');
  await expect(planner.getByRole('link', { name: 'Abrir navegação externa' })).toHaveAttribute('href', /travelmode=walking/);
  await planner.getByRole('button', { name: 'Salvar viagem neste aparelho' }).click();
  await expect(planner.getByRole('status')).toContainText('somente neste navegador');
  await planner.getByLabel('Modo de uso').selectOption('economia');
  await planner.getByLabel('Distância (km)').fill('100');
  await planner.getByLabel('Consumo (km/l)').fill('10');
  await planner.getByLabel('Preço (R$/l)').fill('6');
  await expect(planner.locator('output')).toContainText(/60,00/);
  await planner.getByLabel('Destino real').selectOption('');
  await planner.getByLabel('Modo de uso').selectOption('repetir');
  await expect(planner.getByLabel('Destino real')).toHaveValue(real.id);
  await context.setOffline(true);
  await expect(planner.getByRole('link', { name: 'Abrir navegação externa' })).toHaveCount(0);
  await expect(planner.getByText(/Consulta offline: endereço/)).toBeVisible();
  await context.setOffline(false);
  await planner.getByRole('button', { name: 'Apagar viagem salva' }).click();
  await planner.getByLabel('Modo de uso').selectOption('repetir');
  await expect(planner.getByRole('status')).toContainText('Nenhuma viagem válida');
  const accessibility = await new AxeBuilder({ page }).include('dialog').analyze();
  expect(accessibility.violations.filter(issue => ['critical', 'serious'].includes(issue.impact))).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(planner).not.toBeVisible();
});

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
  await expect(page.getByText('Nenhum ponto encontrado com os filtros atuais.')).toBeVisible();

  await page.getByRole('navigation', { name: 'Navegação móvel' }).getByRole('button', { name: /Fontes/i }).click();
  await expect(page).toHaveURL(new RegExp(`${BASE_PATH}fontes/?$`));
  await expect(page.getByRole('heading', { name: 'Fontes & Transparência Territorial' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pesquisa comunitária: comércio e corredores urbanos' })).toBeVisible();
  await expect(page.getByText('Atacadão Dia a Dia — Planaltina de Goiás')).toBeVisible();
  await expect(page.getByText('Pendente de geometria')).toHaveCount(4);
});

test('desktop: ficha de ponto prende e restaura o foco do teclado', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Navegação por teclado desktop');
  await page.goto('./');
  const trigger = page.getByRole('button', { name: 'Ficha', exact: true }).first();
  await expect(trigger).toBeVisible();
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const first = dialog.getByRole('button', { name: 'Fechar ficha cadastral' });
  const last = dialog.getByRole('button', { name: 'Fechar Ficha', exact: true });
  await expect(first).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.keyboard.press('Shift+Tab');
  await expect(last).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(first).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
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

test('desktop: catálogo publicado contém saúde real verificável, inclusive em fallback', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Cobertura desktop específica');
  await page.goto('./');

  const pointsResponse = await request.get(`${page.url()}data/points.json`);
  const sourcesResponse = await request.get(`${page.url()}data/sources.json`);
  expect(pointsResponse.ok()).toBeTruthy();
  expect(sourcesResponse.ok()).toBeTruthy();
  const snapshot = await pointsResponse.json();
  const sourcesSnapshot = await sourcesResponse.json();

  expect(snapshot.meta.mode).toMatch(/^catalogo_real_/);
  expect(snapshot.meta.realCount).toBeGreaterThan(0);
  expect(snapshot.meta.demoCount).toBe(0);

  const realHealthPoint = snapshot.data.find(
    (point) => point.isDemo === false && point.category === 'Saúde' && ['official', 'verified_open_data'].includes(point.provenanceMeta?.provenance)
  );
  expect(realHealthPoint, 'esperava ao menos um estabelecimento de saúde real').toBeTruthy();
  expect(realHealthPoint.id).toMatch(/^cnes-\d+/);
  expect(realHealthPoint.provenanceMeta.verificationStatus).toBe('verified');
  expect(realHealthPoint.provenanceMeta.sourceUrl).toMatch(/dadosabertos\.go\.gov\.br|cnes2\.datasus\.gov\.br/);

  const cnesSource = sourcesSnapshot.data.find((source) => source.id === 'cnes');
  expect(cnesSource).toBeTruthy();
  expect(['connected', 'snapshot_fallback']).toContain(cnesSource.status);

  const search = page.getByLabel('Buscar locais, órgãos e serviços em Planaltina, Goiás');
  await search.fill(realHealthPoint.name);
  await expect(page.getByRole('heading', { name: realHealthPoint.name })).toBeVisible();
  await expect(page.getByText('Dado real')).toBeVisible();

  await page.getByRole('button', { name: 'Ficha' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Dado real verificado')).toBeVisible();
  await expect(dialog.getByText('Verificado na fonte')).toBeVisible();
  await expect(dialog.getByText('Coordenadas publicadas:')).toBeVisible();
  for (const app of ['Google Maps · rotas', 'Waze · carro', 'Apple Maps · rotas', 'Organic Maps · ponto']) {
    await expect(dialog.getByRole('link', { name: app })).toHaveAttribute('href', /^https:\/\//);
  }

  await page.goto('./fontes/');
  if (cnesSource.status === 'snapshot_fallback') {
    await expect(page.getByText('Snapshot preservado')).toBeVisible();
  } else {
    await expect(page.getByText('Fonte Ativa').first()).toBeVisible();
  }
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
  await expect(page.getByRole('heading', { name: 'Âncoras comerciais com checagem pública' })).toBeVisible();
  await expect(page.getByText('CNES - Estabelecimentos de Saúde de Goiás')).toBeVisible();

  const sourcesResults = await new AxeBuilder({ page }).analyze();
  const sourcesBlocking = sourcesResults.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact));
  expect(sourcesBlocking, JSON.stringify(sourcesBlocking, null, 2)).toEqual([]);
});

test('cartografia local e cadastro SEDUC distinguem geometria de registro cadastral', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByLabel('Mapa geográfico de Planaltina com limite IBGE')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ruas online ativadas' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Ver município' })).toBeVisible();
  await page.goto('./fontes/');
  await expect(page.getByRole('heading', { name: 'Educação — cadastro oficial SEDUC' })).toBeVisible();
  await page.getByLabel('Buscar escola por nome, código ou bairro').fill('52188442');
  await expect(page.getByText('ESCOLA CRESCER E SABER', { exact: true })).toBeVisible();
  await expect(page.getByText('1 registro encontrado', { exact: true })).toBeVisible();
});


test('aparência: modo escuro é nativo, persiste e segue o sistema quando escolhido', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('./');
  await page.getByLabel('Aparência').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel('Aparência').selectOption('system');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('catálogo: filtros de confiança e ordenação funcionam em desktop', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Controles desktop');
  await page.goto('./');
  const payload = await (await request.get(`${new URL(BASE_PATH, page.url())}data/points.json`)).json();
  const points = payload.data;
  const verified = points.filter(point => point.provenanceMeta.verificationStatus === 'verified').length;
  const sidebar = page.getByRole('complementary', { name: 'Painel de busca e catálogo territorial' });
  await sidebar.getByLabel('Situação da verificação').selectOption('verified');
  await expect(sidebar).toContainText(`${verified} pontos no catálogo`);
  await sidebar.getByLabel('Ordenar resultados').selectOption('name');
  await sidebar.getByLabel('Situação da verificação').selectOption('unverified');
  const unverified = points.filter(point => ['unverified','pending'].includes(point.provenanceMeta.verificationStatus)).length;
  await expect(sidebar).toContainText(`${unverified} pontos no catálogo`);
  await expect(sidebar.getByLabel('Raio de proximidade')).toBeDisabled();
});

test('rotas: publicação oferece malha rodoviária verdadeira e rejeita origem vazia', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Contrato desktop do planejador');
  await page.goto('./');
  const response = await request.get(`${new URL(BASE_PATH, page.url())}data/road-graph.json`);
  expect(response.ok()).toBeTruthy();
  const graph = await response.json();
  expect(graph.source).toBe('OpenStreetMap/Geofabrik');
  expect(graph.nodes.length).toBeGreaterThan(100);
  expect(graph.edges.length).toBeGreaterThan(100);
  await page.getByRole('button', { name: 'Planejar viagem' }).click();
  const dialog = page.getByRole('dialog', { name: 'Mobilidade em Planaltina' });
  await expect(dialog.getByLabel('Ponto de partida')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Traçar rota no mapa' })).toBeDisabled();
  await expect(dialog).toContainText('Não possui tráfego ao vivo');
});

test('busca compartilhável: aplica filtros da URL, permite limpar e mantém GPS fora do endereço', async ({page}, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Painel desktop com ações de busca');
  await page.goto('./?q=Centro&verified=verified&order=name');
  const sidebar = page.getByRole('complementary',{name:'Painel de busca e catálogo territorial'});
  await expect(sidebar.getByLabel('Situação da verificação')).toHaveValue('verified');
  await expect(sidebar.getByLabel('Ordenar resultados')).toHaveValue('name');
  await expect(page).toHaveURL(/q=Centro/);
  await sidebar.getByRole('button',{name:'Limpar todos os filtros'}).click();
  await expect(page).not.toHaveURL(/verified=verified/);
  await expect(sidebar.getByLabel('Situação da verificação')).toHaveValue('all');
});

test('mobile: filtros recolhidos mantêm mapa acessível e controles avançados em painel', async ({page}, testInfo)=>{
  test.skip(!testInfo.project.name.includes('mobile'), 'Somente smartphones');
  await page.goto('./');
  const sheet = page.getByRole('region',{name:'Busca e lista do catálogo territorial'});
  await expect(sheet.getByLabel('Origem dos pontos')).not.toBeVisible();
  await sheet.getByRole('button',{name:'Expandir ou recolher lista de pontos e filtros'}).click();
  await expect(sheet.getByLabel('Origem dos pontos')).toBeVisible();
  await sheet.getByLabel('Situação da verificação').selectOption('verified');
  await expect(sheet.getByRole('button',{name:'Limpar todos os filtros'})).toBeVisible();
  await sheet.getByRole('button',{name:'Limpar todos os filtros'}).click();
  await expect(sheet.getByLabel('Situação da verificação')).toHaveValue('all');
});

test('roteamento de qualquer rua: selecionar origem e destino por toque sem GPS', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Fluxo de mapa com espaço para seleção');
  await page.goto('./');
  await page.getByRole('button', { name: 'Planejar viagem' }).click();
  const planner = page.getByRole('dialog', { name: 'Mobilidade em Planaltina' });
  await planner.getByRole('button', { name: 'Marcar origem no mapa' }).click();
  await expect(planner).not.toBeVisible();
  await expect(page.getByText('Toque em uma rua do mapa para marcar a origem do percurso.')).toBeVisible();
  await page.getByLabel('Mapa geográfico de Planaltina com limite IBGE').click({ position: { x: 300, y: 220 }, force: true });
  await expect(planner).toBeVisible();
  await expect(planner.getByLabel('Ponto de partida')).toHaveValue('__map__');
  await planner.getByRole('button', { name: 'Marcar destino no mapa' }).click();
  await expect(page.getByText('Toque em uma rua do mapa para marcar o destino do percurso.')).toBeVisible();
  await page.getByLabel('Mapa geográfico de Planaltina com limite IBGE').click({ position: { x: 460, y: 320 }, force: true });
  await expect(planner).toBeVisible();
  await expect(planner.getByLabel('Destino real')).toHaveValue('__map__');
  await expect(planner.getByRole('button', { name: 'Traçar rota no mapa' })).toBeEnabled();
});

test('diretório: encontra cadastros SEDUC, ANP e comércio sem inventar pontos no mapa', async ({ page }, testInfo) => {
  await page.goto('./');
  const mobile = testInfo.project.name.includes('mobile');
  const search = page.getByLabel(mobile ? 'Buscar pontos em Planaltina, Goiás' :
    'Buscar locais, órgãos e serviços em Planaltina, Goiás');
  await search.fill('MACHADO DE ASSIS');
  const docs = page.getByRole('region', { name: 'Cadastros sem geolocalização' });
  await expect(docs).toBeVisible();
  await expect(docs).toContainText('ESCOLA MUNICIPAL MACHADO DE ASSIS');
  await expect(docs).toContainText('Cadastro SEDUC GO 2024');
  await expect(docs).toContainText('Não geramos pinos nem rotas');
  await search.fill('F1 COMBUSTIVEIS');
  await expect(docs).toContainText('Cadastro ANP');
  await search.fill('Atacadao Dia a Dia');
  await expect(docs).toContainText('Atacadão Dia a Dia');
  await expect(docs.getByRole('link', { name: 'Consultar fonte' })).toHaveCount(1);
});

test('serviços digitais oficiais: navegação cidadã, comércio e transparência no celular e desktop', async ({ page }) => {
  await page.goto('fontes/');
  const services = page.getByRole('region', { name: 'Serviços digitais de Planaltina' });
  await expect(services).toBeVisible();
  await expect(services.getByRole('link', {name:/Emitir ou consultar IPTU/})).toHaveAttribute('href', /planaltina.bsit-br.com.br/);
  const search=services.getByRole('searchbox', {name:'Buscar serviços digitais municipais'});
  await search.fill('certidao');
  await expect(services.getByRole('link',{name:/Certidão de imóvel e cadastro/})).toBeVisible();
  await search.fill('');
  await services.getByRole('button',{name:'Empresas e comércio'}).click();
  await expect(services.getByRole('link',{name:/Emitir NFS-e nacional/})).toBeVisible();
  await expect(services.getByRole('link',{name:/Licitações/})).toHaveCount(0);
  await services.getByRole('button',{name:'Transparência'}).click();
  await expect(services.getByRole('link',{name:/Licitações/})).toBeVisible();
  await expect(services.getByRole('link',{name:/Emitir NFS-e nacional/})).toHaveCount(0);
});

test('catálogo completo: permite explorar registros sem conhecer nome e procurar serviços públicos', async ({ page }, testInfo) => {
  await page.goto('./');
  const mobile = testInfo.project.name.includes('mobile');
  const panel = mobile
    ? page.getByRole('region', { name: 'Busca e lista do catálogo territorial' })
    : page.getByRole('complementary', { name: 'Painel de busca e catálogo territorial' });
  await panel.getByRole('button', { name: 'Explorar cadastros e serviços sem localização' }).click();
  const docs = panel.getByRole('region', { name: 'Cadastros sem geolocalização' });
  await expect(docs).toBeVisible();
  await expect(docs).toContainText('Catálogo complementar (101)');
  await expect(docs.getByRole('button', { name: 'Mostrar mais registros' })).toBeVisible();
  await docs.getByRole('button', { name: 'Mostrar mais registros' }).click();
  await expect(docs).toContainText('Mostrando 16 de 101');
  const search = panel.getByRole('searchbox', { name: mobile
    ? 'Buscar pontos em Planaltina, Goiás'
    : 'Buscar locais, órgãos e serviços em Planaltina, Goiás' });
  await search.fill('iptu');
  await expect(docs).toContainText('Emitir ou consultar IPTU');
  await expect(docs.getByRole('link',{name:'Abrir serviço oficial'})).toHaveAttribute('href',/planaltina.bsit-br.com.br/);
  await search.fill('MACHADO DE ASSIS');
  await expect(docs).toContainText('ESCOLA MUNICIPAL MACHADO DE ASSIS');
  await expect(docs).toContainText('Não geramos pinos nem rotas');
});
