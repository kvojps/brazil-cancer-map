import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

// The contract of the panel decision (.scratch/ui-polimento/issues/04-painel-meu-municipio.md).
const base = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
const CHROMIUM = process.env.CHROMIUM_PATH ?? '/snap/bin/chromium';
const BALSAS = '/municipio/210140-balsas/';
const ALCANTARA = '/municipio/210020-alcantara/';
const ARAIOSES = '/municipio/210090-araioses/';
const RECIFE = '/municipio/261160-recife/';
const WARNING = 'Muitos casos estão sem informação de tratamento; o resultado pode não representar toda a situação.';
const PHONE = { width: 390, height: 844 };

let browser;
before(async () => {
  browser = await chromium.launch({ executablePath: CHROMIUM, headless: true, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
});
after(async () => { await browser?.close(); });

const box = (page, selector) => page.locator(selector).first().evaluate(element => {
  const { left, top, right, bottom, width, height } = element.getBoundingClientRect();
  return { left, top, right, bottom, width, height };
});
const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const noHorizontalScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
const openPanel = async (path, viewport, options = {}) => {
  const context = await browser.newContext({ viewport, ...(viewport.width < 768 ? { hasTouch: true, isMobile: true } : {}), ...options });
  const page = await context.newPage();
  page.on('close', () => { void context.close(); });
  await page.goto(base + path);
  if (options.javaScriptEnabled !== false) await page.locator('.panel-result [class^="result-"]').first().waitFor();
  return page;
};
const toggle = page => page.locator('[data-toggle-profile]');
const result = page => page.locator('.panel-result');
/** The text of the block, read through the layout, as a person sees it. */
const blockText = page => result(page).innerText();

for (const colorScheme of ['light', 'dark']) {
  test(`Balsas, band C: the same block collapsed and open, with its number and the warning, in ${colorScheme}`, async () => {
    const page = await openPanel(BALSAS, PHONE, { colorScheme });
    try {
      const collapsed = await blockText(page);
      assert.match(collapsed, /69,1%/);
      assert.match(collapsed, /dos casos com quimio ou radio, em até 60 dias · 2024/);
      assert.match(collapsed, /Sem direção clara/);
      assert.match(collapsed, /Tendência 2015–2024/);
      assert.match(collapsed, /31,8% de todos os casos sem informação de tratamento, 2024/);
      assert.ok(collapsed.includes(`Faixa C. ${WARNING}`));
      assert.equal(await page.locator('.result-value').evaluate(element => getComputedStyle(element).fontSize), '32px');
      await toggle(page).click();
      assert.equal(await blockText(page), collapsed);
      assert.equal(await page.locator('[data-in-result] .card-figure').first().isVisible(), false, 'the number appears once');
    } finally { await page.close(); }
  });
}

test('Alcântara: the longest block keeps origin and warning at 320 × 568, with the name clear of the buttons', async () => {
  const page = await openPanel(ALCANTARA, { width: 320, height: 568 });
  try {
    const text = await blockText(page);
    assert.match(text, /Seu município e vizinhos — região de São Luís/);
    assert.ok(text.includes(WARNING));
    const sheet = await box(page, '#municipality-preview');
    assert.equal(sheet.bottom, 568);
    assert.ok(sheet.height <= 568 * .55, `compact form, ${sheet.height} px`);
    assert.equal(await page.locator('#municipality-preview').evaluate(element => element.scrollHeight <= element.clientHeight), true, 'nothing cut from the collapsed sheet');
    const name = await box(page, '#preview-heading');
    for (const selector of ['[data-panel-legend]', '.view-controls']) {
      const control = await box(page, selector);
      assert.equal(overlaps(control, name), false, selector);
      assert.ok(control.bottom <= sheet.top, selector);
      assert.ok(control.top >= (await box(page, '.filters-toggle')).bottom, `${selector} under Filtros`);
    }
    assert.equal(await noHorizontalScroll(page), true);
  } finally { await page.close(); }
});

test('Araioses: Dado insuficiente takes the place of the number, and the warning waits in the Eixo with the state and the Action', async () => {
  const page = await openPanel(ARAIOSES, PHONE);
  try {
    const text = await blockText(page);
    assert.match(text, /Dado insuficiente/);
    assert.match(text, /Poucos casos aqui para dizer a direção/);
    assert.equal(await page.locator('.result-value').count(), 0);
    assert.ok(!text.includes(WARNING));
    assert.match(await page.locator('.result-swatch').first().evaluate(element => element.style.background), /radial-gradient/);
    await toggle(page).click();
    const card = page.locator('#acesso [data-cancer-type="all"] .treatment-card');
    const open = await card.innerText();
    assert.ok(open.includes(WARNING));
    assert.match(open, /Tendência no seu estado/);
    assert.match(open, /Conheça seus direitos/);
  } finally { await page.close(); }
});

test('prostate: the short caveat collapsed, the whole one open, and no long box over the map', async () => {
  const page = await openPanel(`${RECIFE}?tipo=prostate`, PHONE);
  try {
    assert.match(await blockText(page), /Sem comparação com o prazo da lei: vigilância ativa pode ser a conduta correta/);
    assert.doesNotMatch(await blockText(page), /acompanhar o câncer antes de tratar/);
    assert.equal(await page.locator('#indicator-caveat').isVisible(), false);
    await toggle(page).click();
    assert.match(await blockText(page), /Na próstata, acompanhar o câncer antes de tratar \(vigilância ativa\) pode ser a conduta correta/);
    assert.doesNotMatch(await blockText(page), /Sem comparação com o prazo/);
    assert.doesNotMatch(await page.locator('#acesso [data-cancer-type="prostate"] .treatment-card').innerText(), /Situação em/);
    await page.setViewportSize({ width: 1280, height: 800 });
    assert.match(await blockText(page), /Na próstata/, 'the column has no short form');
    assert.equal(await page.locator('#indicator-caveat').isVisible(), true, 'on a desktop it hangs from the bar, clear of the map');
  } finally { await page.close(); }
});

test('on a phone only the caveat the panel carries leaves the map: mortality keeps its own', async () => {
  const page = await openPanel(`${RECIFE}?indicador=mortality`, PHONE);
  try {
    await page.locator('#indicator-caveat').waitFor();
    assert.match(await page.locator('#indicator-caveat').innerText(), /só Tendência/);
  } finally { await page.close(); }
});

test('a C55 adjustment keeps its number and origin in the block, without the dots', async () => {
  const page = await openPanel('/municipio/160040-mazagao/?tipo=cervix&indicador=mortality', PHONE);
  try {
    const text = await blockText(page);
    assert.match(text, /11,42 por 100 mil/);
    assert.match(text, /Ajuste não calculável/);
    assert.match(text, /Seu município e vizinhos/);
    assert.doesNotMatch(text, /Dado insuficiente/);
    assert.doesNotMatch(await page.locator('.panel-result .result-swatch').first().evaluate(element => element.style.background), /radial-gradient/);
  } finally { await page.close(); }
  const empty = await openPanel('/municipio/412800-ubirata/?tipo=cervix&indicador=mortality', PHONE);
  try {
    assert.match(await blockText(empty), /Ajuste não calculável/);
    assert.doesNotMatch(await blockText(empty), /Dado insuficiente/);
    assert.equal(await empty.locator('.result-value').count(), 0);
  } finally { await empty.close(); }
});

test('the period of the data stays in evidence in the open card, and the record quality beside the result', async () => {
  const page = await openPanel(BALSAS, { width: 1280, height: 800 });
  try {
    const card = await page.locator('#acesso [data-cancer-type="all"] .treatment-card').innerText();
    assertOrder(card, [/Período dos dados: \d{4}–\d{4}\. Último ano consolidado: 2024\./, /Situação em/, /Qualidade do registro no estado/, /Conheça seus direitos/], '60 dias');
  } finally { await page.close(); }
});

test('the number keeps its 32 px on an ordinary phone and on the low screen of the compact form', async () => {
  for (const viewport of [{ width: 390, height: 664 }, { width: 320, height: 568 }]) {
    const page = await openPanel(ALCANTARA, viewport);
    try {
      assert.equal(await page.locator('.result-value').evaluate(element => getComputedStyle(element).fontSize), '32px');
    } finally { await page.close(); }
  }
});

test('the sheet runs edge to edge, opens up to the notice and takes the floating controls off the scene', async () => {
  const page = await openPanel(BALSAS, PHONE);
  try {
    const collapsed = await box(page, '#municipality-preview');
    assert.deepEqual([collapsed.left, collapsed.right, collapsed.bottom], [0, 390, 844]);
    assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
    assert.equal(await page.locator('.site-header').isVisible(), true);
    await page.locator('.panel-result').click();
    assert.equal(await toggle(page).getAttribute('aria-expanded'), 'true', 'a tap on the sheet opens it');
    const open = await box(page, '#municipality-preview');
    const notice = await box(page, '.construction-notice');
    assert.ok(open.top >= notice.bottom, 'the notice is never covered');
    assert.equal(notice.top, 0);
    assert.equal(open.bottom, 844);
    for (const selector of ['.site-header', '.filters-toggle', '[data-panel-legend]', '.view-controls']) assert.equal(await page.locator(selector).isVisible(), false, selector);
    await toggle(page).click();
    assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
    assert.equal(await page.locator('.view-controls').isVisible(), true);
    assert.equal(new URL(page.url()).pathname, BALSAS, 'collapsing keeps the selection');
    await page.locator('[data-clear-profile]').click();
    assert.equal(new URL(page.url()).pathname, '/');
    assert.equal(await page.locator('#municipality-preview').isVisible(), false);
    assert.equal(await page.locator('.legend-corner').isVisible(), true, 'the corner legend is back');
    assert.equal(await page.locator('[data-panel-legend]').isVisible(), false);
    const controls = await box(page, '.view-controls');
    assert.ok(controls.bottom > 800, 'the controls return to the bottom corner');
  } finally { await page.close(); }
});

test('Filtros, menu and search take the place of the sheet while open', async () => {
  const page = await openPanel(BALSAS, PHONE);
  try {
    const sheet = page.locator('#municipality-preview');
    await page.locator('.filters-toggle').click();
    assert.equal(await sheet.isVisible(), false, 'Filtros');
    await page.getByRole('button', { name: 'Ver mapa' }).click();
    assert.equal(await sheet.isVisible(), true);
    await page.locator('.site-menu summary').click();
    assert.equal(await sheet.isVisible(), false, 'menu');
    await page.locator('.site-menu summary').click();
    await page.locator('.search-toggle').click();
    assert.equal(await sheet.isVisible(), false, 'search');
    await page.keyboard.press('Escape');
    assert.equal(await sheet.isVisible(), true);
  } finally { await page.close(); }
});

test('in the list the sheet stays, Mapa/Lista rest on it and the last rows end above it', async () => {
  const page = await openPanel(BALSAS, PHONE);
  try {
    await page.locator('[data-view="lista"]').click();
    await page.waitForFunction(() => document.querySelector('.indicator-table tbody')?.children.length > 0);
    assert.equal(await page.locator('[data-panel-legend]').isVisible(), false, 'no map to explain');
    const sheet = await box(page, '#municipality-preview');
    assert.ok((await box(page, '.view-controls')).bottom <= sheet.top);
    await page.locator('.indicator-table tbody tr').last().scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, document.querySelector('.indicator-table').getBoundingClientRect().bottom + scrollY - innerHeight));
    assert.ok((await box(page, '.indicator-table tbody tr:last-child')).bottom <= sheet.top + 1, 'the last row is reachable');
  } finally { await page.close(); }
});

test('on a desktop the column has the name fixed on top, scrolls inside and has no control to collapse', async () => {
  const page = await openPanel(BALSAS, { width: 1280, height: 800 });
  try {
    const panel = page.locator('#municipality-preview');
    assert.equal((await box(page, '#municipality-preview')).width, 400);
    assert.equal(await toggle(page).isVisible(), false);
    assert.equal(await page.locator('[data-clear-profile]').isVisible(), true);
    assert.equal(await page.locator('[data-panel-legend]').isVisible(), false);
    assert.equal(await page.locator('[data-preview-content]').isVisible(), true);
    assert.equal(await page.locator('.result-value').evaluate(element => getComputedStyle(element).fontSize), '32px');
    const before = await box(page, '#preview-heading');
    await panel.evaluate(element => { element.scrollTop = 400; });
    assert.equal(await panel.evaluate(element => element.scrollTop), 400);
    assert.equal((await box(page, '#preview-heading')).top, before.top, 'the name stays');
    assert.equal(await page.evaluate(() => scrollY), 0);
    await page.setViewportSize({ width: 1921, height: 900 });
    assert.equal((await box(page, '#municipality-preview')).width, 480);
  } finally { await page.close(); }
});

test('closed Eixos carry their results, one opens at a time, and the Eixo of the indicator opens first', async () => {
  const page = await openPanel(BALSAS, { width: 1280, height: 800 });
  try {
    const opened = () => page.locator('[data-profile-axis][open]').evaluateAll(axes => axes.map(axis => axis.id));
    const results = id => page.locator(`#${id} .axis-results`);
    assert.deepEqual(await opened(), ['acesso']);
    assert.equal(await results('acesso').isVisible(), false, 'open, the block and the card already say it');
    assert.match(await results('deteccao').innerText(), /Mamografias[\s\S]*0,22 · Sem direção clara[\s\S]*Citopatológicos/);
    assert.match(await results('prevencao').innerText(), /Vacina HPV[\s\S]*Sem dado neste recorte[\s\S]*Fumantes na capital/);
    assert.match(await results('panorama').innerText(), /Mortalidade[\s\S]*por 100 mil · Piorando[\s\S]*Casos estimados na UF[\s\S]*9\.630 por ano/);
    assert.equal(await page.locator('#deteccao .result-swatch').first().evaluate(element => element.style.background.includes('repeating-linear-gradient')), false);
    await page.locator('#deteccao > summary').click();
    assert.deepEqual(await opened(), ['deteccao']);
    assert.equal(await results('acesso').isVisible(), true);
    assert.equal(await page.locator('#acesso .result-swatch').first().evaluate(element => element.style.background.includes('repeating-linear-gradient')), true, 'band C only on the 60 dias');
    await page.locator('#panorama > summary').click();
    await page.locator('#panorama [data-cancer-type="all"] [data-indicator="mortality"] a[href$="#prevencao"]').click();
    assert.deepEqual(await opened(), ['prevencao'], 'a link to an Eixo opens it');
    await page.goto(`${base}${BALSAS}?indicador=mortality`);
    await page.locator('.panel-result [class^="result-"]').first().waitFor();
    assert.deepEqual(await opened(), ['panorama']);
    assert.match(await blockText(page), /por 100 mil/);
  } finally { await page.close(); }
});

/** Each pattern appears in the order given, in what a person reads in the card. */
function assertOrder(text, patterns, where) {
  let position = -1;
  for (const pattern of patterns) {
    const found = text.slice(position + 1).search(pattern);
    assert.notEqual(found, -1, `${where}: ${pattern} after position ${position}`);
    position += 1 + found;
  }
}

test('every card follows the order of the decision: result, Action, series, then source and method', async () => {
  const page = await openPanel(BALSAS, { width: 1280, height: 800 }, { javaScriptEnabled: false });
  try {
    const card = selector => page.locator(selector).first().innerText();
    assertOrder(await card('[data-indicator="within_60_days"]'), [/Casos tratados com quimioterapia ou radioterapia: % que começou/, /Situação em/, /Referência/, /Tendência \d{4}/, /Sem informação de tratamento em/, /Conheça seus direitos/, /Série \d{4}/, /Ver a série em tabela/, /O que é este número/, /Como calculamos/], '60 dias');
    for (const indicator of ['mammography', 'cytopathology']) assertOrder(await card(`[data-indicator="${indicator}"]`), [/Situação em/, /Referência/, /Tendência \d{4}/, /Saiba mais/, /Série \d{4}/, /Ver a série em tabela/, /Fonte:/, /Como calculamos/], indicator);
    // No UF has HPV data published yet: only the order around the missing result can be read on a page.
    assertOrder(await card('[data-indicator="hpv"]'), [/Cobertura da vacina HPV/, /ainda não estão disponíveis/, /Tendência: série curta/, /Saiba mais/, /Como calculamos/], 'HPV');
    assertOrder(await card('[data-indicator="mortality"]'), [/Tendência \d{4}/, /Tendência do Brasil/, /Veja os caminhos/, /Série \d{4}/, /Ver a série em tabela/, /Fonte:/, /Como calculamos/], 'mortality');
    assertOrder(await card('article[aria-label="Tabagismo na capital"]'), [/capital do seu estado/, /Situação em/, /Referência/, /Tendência/, /Saiba mais/, /Série \d{4}/, /O que é este número/, /Como calculamos/], 'smoking');
    assertOrder(await card('article[aria-label="Casos novos estimados"]'), [/Na sua UF/, /Explore as orientações/, /O que é este número/, /Como calculamos/], 'estimated cases');
    assertOrder(await card('article.indicator-card'), [/Este eixo não tem indicador/, /Saiba mais/], 'alternative action');
  } finally { await page.close(); }
});

test('the notes about the interface and the panel actions that left stay out', async () => {
  const page = await openPanel(BALSAS, { width: 1280, height: 800 });
  try {
    const text = await page.locator('#municipality-preview').innerText();
    for (const gone of ['Consulta pronta', 'Meu município — dados sobre', 'Voltar ao mapa', 'Reabrir', 'Expandir consulta', 'Limpar seleção']) assert.ok(!text.includes(gone), gone);
    assert.equal(await page.getByText('Ir para Meu município').count(), 0);
    assert.equal((await page.locator('#preview-heading').innerText()), 'Balsas (MA)');
    await page.locator('.all-cancers-note summary').click();
    assert.match(await page.locator('.all-cancers-note').innerText(), /Cada eixo usa os registros adequados/);
    await page.locator('[data-panel-cancer-type]').selectOption('breast');
    await page.waitForFunction(() => new URL(location.href).searchParams.get('tipo') === 'breast');
    assert.equal(await page.locator('#cancer-type').inputValue(), 'breast');
    assert.equal(await page.locator('.all-cancers-note').isVisible(), false);
  } finally { await page.close(); }
});

test('selecting keeps the bars still, speaks only to screen readers and takes focus to the name', async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const search = await context.newPage();
  try {
    await search.goto(base + '/');
    await search.locator('#municipality-search:enabled').waitFor();
    const before = [await box(search, '.site-header'), await box(search, '.map-controls')];
    await search.locator('#municipality-search').fill('balsas ma');
    await search.getByRole('button', { name: 'Balsas (MA)', exact: true }).focus();
    await search.keyboard.press('Enter');
    await search.locator('.panel-result [class^="result-"]').first().waitFor();
    assert.deepEqual([await box(search, '.site-header'), await box(search, '.map-controls')], before);
    assert.equal(await search.locator('#preview-heading').evaluate(element => element === document.activeElement), true);
    const status = await box(search, '#search-status');
    assert.ok(status.width <= 1 && status.height <= 1, 'status is for screen readers only');
    assert.match(await search.locator('#search-status').textContent(), /Balsas \(MA\): 69,1%.*Sem direção clara.*Faixa C/);
    await search.keyboard.press('Tab');
    assert.equal(await search.locator('[data-clear-profile]').evaluate(element => element === document.activeElement), true, 'then to the only action on a desktop');
    assert.notEqual(await search.locator('[data-clear-profile]').evaluate(element => getComputedStyle(element).outlineStyle), 'none');
    await search.keyboard.press('Enter');
    assert.equal(await search.locator('#municipality-preview').isVisible(), false);
    assert.equal(await search.locator('#municipality-search').evaluate(element => element === document.activeElement), true, 'clearing gives focus back');
  } finally { await context.close(); }
});

test('the sheet works by keyboard, with visible focus', async () => {
  const page = await openPanel(BALSAS, { width: 390, height: 664 });
  try {
    await toggle(page).focus();
    assert.equal(await toggle(page).getAttribute('aria-label'), 'Expandir Meu município');
    await page.keyboard.press('Enter');
    assert.equal(await toggle(page).getAttribute('aria-label'), 'Recolher Meu município');
    assert.equal(await page.locator('[data-preview-content]').isVisible(), true);
    assert.equal(await toggle(page).evaluate(element => element === document.activeElement), true, 'focus stays on the control');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('[data-clear-profile]').evaluate(element => element === document.activeElement), true);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('[data-panel-cancer-type]').evaluate(element => element === document.activeElement), true);
    assert.notEqual(await page.locator('[data-panel-cancer-type]').evaluate(element => getComputedStyle(element).outlineStyle), 'none');
  } finally { await page.close(); }
});

for (const [width, height] of [[195, 422], [320, 450], [640, 400]]) {
  test(`at ${width} × ${height}, as under 200% zoom, the panel is part of a plain page`, async () => {
    const page = await openPanel(ALCANTARA, { width, height });
    try {
      assert.equal(await page.locator('#municipality-preview').evaluate(element => getComputedStyle(element).position), 'static');
      assert.equal(await toggle(page).isVisible(), false);
      assert.equal(await page.locator('[data-preview-content]').isVisible(), true);
      assert.ok((await blockText(page)).includes(WARNING));
      assert.equal(await noHorizontalScroll(page), true);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForFunction(() => scrollY > 0);
      assert.equal((await box(page, '.construction-notice')).top, 0, 'the notice stays');
      assert.equal(await page.locator('footer').isVisible(), true);
    } finally { await page.close(); }
  });
}

test('native 200% zoom on a phone keeps the plain page and the warning in both themes', async () => {
  const extension = fileURLToPath(new URL('./zoom-extension', import.meta.url));
  for (const colorScheme of ['light', 'dark']) {
    const context = await chromium.launchPersistentContext('', {
      executablePath: CHROMIUM, headless: true, colorScheme,
      ignoreDefaultArgs: ['--disable-extensions'],
      args: ['--no-sandbox', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
    });
    try {
      const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
      const page = await context.newPage();
      await page.goto(base + ALCANTARA);
      await page.locator('.panel-result [class^="result-"]').first().waitFor();
      await worker.evaluate(async base => {
        const tabs = await chrome.tabs.query({});
        await chrome.tabs.setZoom(tabs.find(tab => tab.url.startsWith(base)).id, 2);
      }, base);
      await page.setViewportSize({ width: 390, height: 844 });
      assert.equal(await page.evaluate(() => innerWidth), 195);
      assert.equal(await page.locator('#municipality-preview').evaluate(element => getComputedStyle(element).position), 'static', colorScheme);
      assert.ok((await blockText(page)).includes(WARNING), colorScheme);
      assert.equal(await noHorizontalScroll(page), true, colorScheme);
    } finally { await context.close(); }
  }
});

for (const colorScheme of ['light', 'dark']) {
  test(`without JavaScript a phone reads the municipality as a plain page, with the links of the types: ${colorScheme}`, async () => {
    for (const [width, height] of [[320, 568], [390, 844]]) {
      const page = await openPanel(ALCANTARA, { width, height }, { javaScriptEnabled: false, colorScheme });
      try {
        assert.equal(await page.locator('.map-frame').isVisible(), false);
        assert.equal(await page.locator('.filters-toggle').isVisible(), false);
        assert.equal(await page.locator('#preview-heading').innerText(), 'Alcântara (MA)');
        const heading = await box(page, '#preview-heading');
        assert.equal(overlaps(await box(page, '.site-header'), heading), false, 'nothing floats over the name');
        assert.equal(await page.getByRole('navigation', { name: 'Tipo de câncer', exact: true }).getByRole('link').count(), 6);
        assert.equal(await page.locator('[data-profile-axis][open]').count(), 4, 'all the Eixos, as anchors reach them');
        assert.equal(await page.locator('[data-toggle-profile]').isVisible(), false);
        assert.equal(await page.locator('[data-clear-profile]').isVisible(), false);
        assert.ok((await page.locator('#acesso [data-cancer-type="all"] .treatment-card').innerText()).includes(WARNING));
        assert.match(await page.locator('#acesso [data-cancer-type="all"] .card-figure').innerText(), /58,6%/);
        assert.equal(await noHorizontalScroll(page), true);
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForFunction(() => scrollY > 0);
        assert.equal(await page.locator('footer').isVisible(), true);
      } finally { await page.close(); }
    }
  });
}

for (const javaScriptEnabled of [true, false]) {
  for (const colorScheme of ['light', 'dark']) {
    test(`the hard cases have no horizontal scroll at 320, 768 and 1280 px: ${colorScheme}, JavaScript ${javaScriptEnabled}`, async () => {
      for (const path of [BALSAS, ALCANTARA, ARAIOSES, `${RECIFE}?tipo=prostate`]) {
        const page = await openPanel(path, { width: 1280, height: 800 }, { javaScriptEnabled, colorScheme });
        try {
          await page.locator('.profile details').evaluateAll(elements => elements.forEach(element => { element.removeAttribute('name'); element.open = true; }));
          for (const width of [320, 768, 1280]) {
            await page.setViewportSize({ width, height: 800 });
            assert.equal(await noHorizontalScroll(page), true, `${path}, ${width} px`);
            assert.equal(await page.locator('#municipality-preview').evaluate(element => element.scrollWidth <= element.clientWidth + 1), true, `${path}, inside the panel, ${width} px`);
          }
        } finally { await page.close(); }
      }
    });
  }
}
