import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
const RECIFE = '/municipio/261160-recife/';
let browser;
before(async () => {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/snap/bin/chromium', args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
});
after(async () => { await browser?.close(); });

test('details are deliberate and Back/Forward traverse details before the municipal selection', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(base + RECIFE);
    await page.locator('.result-value').waitFor();
    await page.locator('.panel-result').click();
    assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    assert.equal(await page.locator('[data-preview-content]').isVisible(), true);
    assert.equal(await page.locator('[data-profile-axis]').count(), 4);
    await page.goBack();
    await page.waitForFunction(() => document.querySelector('#municipality-preview').hasAttribute('data-collapsed'));
    assert.equal(new URL(page.url()).pathname, RECIFE);
    await page.goForward();
    await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).click();
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Ver detalhes');
    assert.equal(new URL(page.url()).pathname, RECIFE);
  } finally { await page.close(); }
});

test('returning from list details and switching views preserve the exploration position', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(base + '/?visualizacao=lista&tipo=breast');
    await page.locator('.indicator-table select').selectOption('PE');
    const link = page.locator('.indicator-table tbody tr[data-code="260960"] a');
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await page.locator('.result-value').waitFor();
    const position = await page.evaluate(() => scrollY);
    assert.ok(position > 100);
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    await page.getByRole('button', { name: 'Voltar à lista', exact: true }).click();
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - position) < 3, 'details keep the list position');
    await page.locator('[data-view="mapa"]').click();
    await page.locator('[data-view="lista"]').click();
    await page.waitForFunction(() => document.querySelector('.indicator-table tbody')?.children.length > 0);
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - position) < 3, 'each visualization keeps its position');
    assert.equal(await page.locator('.indicator-table select').inputValue(), 'PE');
    assert.equal(new URL(page.url()).searchParams.get('tipo'), 'breast');
    assert.equal(new URL(page.url()).pathname, '/municipio/260960-olinda/');
  } finally { await page.close(); }
});

test('Back and Forward cross municipalities and filters without extra details entries', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(base + RECIFE);
    await page.locator('.result-value').waitFor();
    await page.locator('.filters-toggle').click();
    await page.locator('#cancer-type').selectOption('breast');
    await page.getByRole('button', { name: 'Ver mapa', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[data-panel-cancer-type]').value === 'breast');
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('municipality-map-select', { detail: '260960' })));
    await page.locator('.profile[data-code="260960"]').waitFor({ state: 'attached' });
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    for (const [path, type] of [['/municipio/260960-olinda/', 'breast'], [RECIFE, 'breast'], [RECIFE, null]]) {
      await page.goBack();
      await page.waitForFunction(({ path, type }) => location.pathname === path && new URLSearchParams(location.search).get('tipo') === type && document.querySelector('#municipality-preview').hasAttribute('data-collapsed'), { path, type });
    }
    for (const [path, type, expanded] of [[RECIFE, 'breast', false], ['/municipio/260960-olinda/', 'breast', false], ['/municipio/260960-olinda/', 'breast', true]]) {
      await page.goForward();
      await page.waitForFunction(({ path, type, expanded }) => location.pathname === path && new URLSearchParams(location.search).get('tipo') === type && document.querySelector('[data-toggle-profile]').getAttribute('aria-expanded') === String(expanded), { path, type, expanded });
    }
  } finally { await page.close(); }
});

for (const height of [568, 844]) test(`municipal anchors at ${height} reach their axis without a synthetic history step`, async () => {
  const page = await browser.newPage({ viewport: { width: 390, height }, isMobile: true, hasTouch: true });
  try {
    await page.goto(base + '/municipios/');
    await page.goto(base + RECIFE + '#prevencao');
    await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).waitFor();
    assert.equal(await page.locator('#prevencao').getAttribute('open'), '');
    await page.waitForFunction(() => {
      const r = document.querySelector('#prevencao > summary').getBoundingClientRect();
      return r.top >= document.querySelector('.construction-notice').getBoundingClientRect().bottom && r.bottom <= innerHeight;
    });
    await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).click();
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    assert.equal(new URL(page.url()).pathname, RECIFE);
    assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
    await page.goBack();
    assert.equal(new URL(page.url()).pathname, '/municipios/');
  } finally { await page.close(); }
});

test('links between axes keep mobile details open without adding a step before collapse', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(base + RECIFE + '?indicador=mortality');
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    await page.locator('#panorama [data-cancer-type="all"] a[href$="#prevencao"]').last().click();
    assert.equal(await page.locator('[data-preview-content]').isVisible(), true, 'the destination stays visible');
    assert.equal(await page.locator('#prevencao').getAttribute('open'), '');
    await page.goBack();
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    assert.equal(new URL(page.url()).pathname, RECIFE);
    await page.goForward();
    await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).waitFor();
    assert.equal(await page.locator('#prevencao').getAttribute('open'), '');
    await page.waitForFunction(() => {
      const r = document.querySelector('#prevencao > summary').getBoundingClientRect();
      return r.top >= document.querySelector('.construction-notice').getBoundingClientRect().bottom && r.bottom <= innerHeight;
    });
    await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).click();
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
  } finally { await page.close(); }
});

test('an unavailable result is distinct from a load error and still offers the other axes', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await page.route('**/dados/profiles/PE.json', async route => {
      const response = await route.fetch();
      const data = await response.json();
      delete data.indicators.within_60_days.all.municipalities['261160'];
      await route.fulfill({ json: data });
    });
    await page.goto(base + RECIFE);
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    assert.match(await page.locator('[data-profile-result]').innerText(), /Sem dado neste recorte/);
    assert.doesNotMatch(await page.locator('[data-profile-result]').innerText(), /Dado insuficiente|Não foi possível/);
    assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    assert.equal(await page.locator('[data-profile-axis]').count(), 4);
  } finally { await page.close(); }
});

test('reloading a details history entry keeps its control and Back coherent', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(base + RECIFE);
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    await page.reload();
    await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).waitFor({ timeout: 5000 });
    await page.goBack();
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    assert.equal(new URL(page.url()).pathname, RECIFE);
  } finally { await page.close(); }
});

for (const [width, height] of [[390, 568], [390, 664], [390, 740], [390, 844], [664, 390]]) {
  test(`${width}x${height}: summary and deliberate details survive composition changes`, async () => {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true });
    try {
      await page.goto(base + RECIFE);
      await page.locator('.result-value').waitFor();
      assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
      await page.locator('.panel-result').tap();
      assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
      const toggle = page.getByRole('button', { name: 'Ver detalhes', exact: true });
      await toggle.press('Enter');
      await page.locator('#acesso [data-cancer-type="all"] .card-action').scrollIntoViewIfNeeded();
      await page.setViewportSize({ width: 390, height: 360 });
      await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).waitFor();
      assert.equal(await page.locator('[data-preview-content]').isVisible(), true);
      await page.setViewportSize({ width, height });
      await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).click();
      await toggle.waitFor();
      assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
      await page.goForward();
      await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).waitFor();
    } finally { await page.close(); }
  });
}

for (const height of [568, 844]) {
  test(`list return at ${height} restores the position before selection, UF and open rows`, async () => {
    const page = await browser.newPage({ viewport: { width: 390, height }, isMobile: true, hasTouch: true });
    try {
      await page.goto(base + '/?visualizacao=lista&tipo=breast');
      await page.locator('.indicator-table select').selectOption('PE');
      const row = page.locator('tr[data-code="260960"]');
      await row.locator('button').click();
      const link = row.locator('a');
      await link.scrollIntoViewIfNeeded();
      const position = await page.evaluate(() => scrollY);
      await link.tap();
      await page.locator('.result-value').waitFor();
      assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
      await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
      await page.locator('#acesso [data-cancer-type="breast"] .card-action').scrollIntoViewIfNeeded();
      await page.getByRole('button', { name: 'Voltar à lista', exact: true }).click();
      await page.waitForFunction(position => document.querySelector('#municipality-preview').hasAttribute('data-collapsed') && Math.abs(scrollY - position) < 3, position);
      assert.equal(await page.locator('.indicator-table select').inputValue(), 'PE');
      assert.equal(await row.locator('button').getAttribute('aria-expanded'), 'true');
      assert.equal(new URL(page.url()).pathname, '/municipio/260960-olinda/');
    } finally { await page.close(); }
  });
}

test('deliberate scrolling during an anchored load cancels late positioning', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 568 }, isMobile: true, hasTouch: true });
  let release;
  const held = new Promise(resolve => { release = resolve; });
  let requested;
  const started = new Promise(resolve => { requested = resolve; });
  try {
    await page.route('**/dados/profiles/PE.json', async route => { requested(); await held; await route.continue(); });
    await page.goto(base + RECIFE + '#prevencao');
    await started;
    await page.keyboard.press('Control+Home');
    const position = await page.evaluate(() => scrollY);
    assert.equal(position, 0, 'the user has returned to the start during loading');
    release();
    await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).waitFor();
    assert.equal(await page.locator('#prevencao').getAttribute('open'), '');
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - position) < 3, 'loading respects the deliberate reading position');
  } finally { release(); await page.close(); }
});

test('a new search selection supersedes an anchor still loading', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 568 }, isMobile: true, hasTouch: true });
  let release;
  const held = new Promise(resolve => { release = resolve; });
  let requested;
  const started = new Promise(resolve => { requested = resolve; });
  try {
    await page.route('**/dados/profiles/PE.json', async route => { requested(); await held; await route.continue(); });
    await page.goto(base + RECIFE + '#prevencao');
    await started;
    if (await page.locator('.search-toggle').isVisible()) await page.locator('.search-toggle').click();
    await page.locator('#municipality-search').fill('Olinda PE');
    await page.locator('#municipality-search').press('Enter');
    release();
    await page.locator('.profile[data-code="260960"]').waitFor({ state: 'attached' });
    assert.equal(await page.locator('#preview-heading').innerText(), 'Olinda (PE)');
    assert.equal(new URL(page.url()).hash, '', 'new selection discards the superseded anchor');
    assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    await page.reload();
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
  } finally { release(); await page.close(); }
});

test('reloading an axis inside a deliberate details entry preserves its return history', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 568 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(base + '/municipios/');
    await page.goto(base + RECIFE + '?indicador=mortality');
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    await page.locator('#panorama [data-cancer-type="all"] a[href$="#prevencao"]').last().click();
    await page.reload();
    await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).click();
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    await page.goBack();
    assert.equal(new URL(page.url()).pathname, '/municipios/', 'return consumes the existing details entry');
  } finally { await page.close(); }
});

test('details keep the reading axis for type changes and follow an actual indicator change', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(5000);
  try {
    await page.goto(base + RECIFE);
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    assert.equal(await page.locator('#preview-heading').evaluate(el => el === document.activeElement), true);
    await page.locator('#prevencao > summary').click();
    await page.locator('[data-panel-cancer-type]').selectOption('prostate');
    await page.waitForFunction(() => document.querySelector('#cancer-type').value === 'prostate');
    assert.equal(await page.locator('#prevencao').getAttribute('open'), '');
    assert.equal(await page.locator('[data-preview-content]').isVisible(), true);
    await page.locator('[data-details-menu]').click();
    await page.locator('#details-menu').getByRole('button', { name: 'Filtros', exact: true }).click();
    await page.locator('#map-indicator').selectOption('mortality');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.querySelector('#panorama').open);
    assert.equal(await page.locator('[data-preview-content]').isVisible(), true);
    await page.locator('[data-details-menu]').click();
    await page.locator('#details-menu').getByRole('button', { name: 'Filtros', exact: true }).click();
    await page.locator('#cancer-type').selectOption('breast');
    await page.locator('#map-indicator').selectOption('mammography');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.querySelector('#deteccao').open);
    await page.locator('#prevencao > summary').click();
    await page.locator('[data-panel-cancer-type]').selectOption('prostate');
    await page.waitForFunction(() => document.querySelector('#acesso').open && document.querySelector('#map-indicator').value === 'within_60_days');
    assert.equal(await page.locator('[data-preview-content]').isVisible(), true);
    await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).click();
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
    assert.equal(new URL(page.url()).pathname, RECIFE);
  } finally { await page.close(); }
});
