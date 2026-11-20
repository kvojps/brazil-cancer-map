import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
let browser;
before(async () => {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/snap/bin/chromium', args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
});
after(async () => { await browser?.close(); });

test('logo resets list and municipal details, keeps theme and keyboard focus, and supports history', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(base + '/municipio/261160-recife/?tipo=breast&visualizacao=lista&theme=dark#acesso');
    await page.locator('.result-value').waitFor();
    const previous = page.url();
    const length = await page.evaluate(() => history.length);
    await page.setViewportSize({ width: 1280, height: 844 });
    const logo = page.locator('.identity');
    await logo.focus();
    await logo.press('Enter');
    assert.equal(page.url(), base + '/?theme=dark');
    await page.waitForFunction(() => document.querySelector('#municipality-preview').hidden);
    assert.equal(await page.locator('[data-map-view]').isVisible(), true);
    assert.equal(await page.locator('.identity').evaluate(node => node === document.activeElement && node.matches(':focus-visible')), true);
    assert.equal(await page.evaluate(() => history.length), length + 1);
    await logo.press('Enter');
    assert.equal(await page.evaluate(() => history.length), length + 1);
    await page.goBack();
    await page.waitForURL(previous);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).waitFor();
    await page.locator('.result-value').waitFor();
    assert.equal(await page.locator('.indicator-table').isVisible(), true);
    await page.goForward();
    await page.waitForURL(base + '/?theme=dark');
    assert.equal(await page.locator('#municipality-preview').isVisible(), false);
  } finally { await page.close(); }
});

for (const surface of ['search', 'filters', 'legend', 'menu']) {
  test(`logo closes ${surface} without moving keyboard focus to a hidden opener`, async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    try {
      await page.goto(base + '/municipio/261160-recife/?tipo=breast');
      await page.locator('.result-value').waitFor();
      const opener = { search: '.search-toggle', filters: '.filters-toggle', legend: '[data-panel-legend]', menu: '.site-menu summary' }[surface];
      await page.locator(opener).click();
      await page.locator('.identity').focus();
      await page.keyboard.press('Enter');
      await page.waitForURL(base + '/');
      await page.waitForFunction(() => document.querySelector('#municipality-preview').hidden);
      assert.equal(await page.locator('.identity').evaluate(node => node === document.activeElement && node.matches(':focus-visible')), true);
      assert.equal(await page.locator(':popover-open').count(), 0);
      assert.equal(await page.locator('.site-menu').getAttribute('open'), null);
      assert.equal(await page.locator('.site-header').getAttribute('data-search-open'), null);
      assert.equal(await page.locator('#cancer-type').inputValue(), 'all');
      assert.equal(await page.locator('#map-indicator').inputValue(), 'within_60_days');
      assert.equal(await page.locator('#map-reading').inputValue(), 'trend');
      await page.emulateMedia({ colorScheme: 'dark' });
      assert.equal(await page.locator('html').getAttribute('data-theme'), null, 'reset still follows the system');
    } finally { await page.close(); }
  });
}

test('a pending municipal response cannot undo a reset or take focus', async () => {
  const page = await browser.newPage({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let requested;
  const arrived = new Promise(resolve => { requested = resolve; });
  await page.route('**/profiles/PE.json', async route => { requested(); await gate; await route.continue(); });
  try {
    await page.goto(base + '/');
    await page.locator('#municipality-search:enabled').waitFor({ state: 'attached' });
    await page.locator('.search-toggle').click();
    await page.locator('#municipality-search').fill('Recife PE');
    await page.locator('#municipality-results button').click();
    await arrived;
    await page.locator('.identity').focus();
    await page.keyboard.press('Enter');
    await page.waitForURL(base + '/');
    const response = page.waitForResponse('**/profiles/PE.json');
    release();
    await (await response).finished();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.locator('#municipality-preview').isVisible(), false);
    assert.equal(page.url(), base + '/');
    assert.equal(await page.locator('.identity').evaluate(node => node === document.activeElement), true);
    await page.goBack();
    await page.locator('.result-value').waitFor();
    assert.match(page.url(), /261160-recife/);
  } finally { release(); await page.close(); }
});

test('main navigation links carry the home map state after Back, Forward and reset', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 844 } });
  try {
    await page.goto(base + '/?tipo=breast&visualizacao=lista&theme=dark');
    await page.locator('#cancer-type:enabled').waitFor();
    const methodology = page.locator('.site-header nav[aria-label="Navegação principal"] a', { hasText: 'Como calculamos' });
    const carried = async () => new URL(await methodology.evaluate(link => link.href)).searchParams;
    await page.locator('#cancer-type').selectOption('cervix');
    assert.equal((await carried()).get('tipo'), 'cervix');
    await page.goBack();
    await page.waitForFunction(() => new URL(location.href).searchParams.get('tipo') === 'breast');
    assert.equal((await carried()).get('tipo'), 'breast');
    assert.equal((await carried()).get('visualizacao'), 'lista');
    assert.equal((await carried()).get('theme'), 'dark');
    await page.goForward();
    await page.waitForFunction(() => new URL(location.href).searchParams.get('tipo') === 'cervix');
    assert.equal((await carried()).get('tipo'), 'cervix');
    await page.locator('.identity').click();
    await page.waitForURL(base + '/?theme=dark');
    assert.equal((await carried()).has('tipo'), false);
    assert.equal((await carried()).has('visualizacao'), false);
    assert.equal((await carried()).get('theme'), 'dark');
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  } finally { await page.close(); }
});

for (const source of ['/metodologia/', '/municipios/']) {
  test(`${source}: Mapa returns with context while the logo carries only the explicit theme`, async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    try {
      await page.goto(base + source + '?municipio=261160&tipo=breast&visualizacao=lista&theme=light');
      await page.locator('.site-menu summary').click();
      const map = page.locator('.site-menu nav').getByRole('link', { name: 'Mapa', exact: true });
      await map.click();
      await page.locator('.result-value').waitFor();
      assert.match(page.url(), /261160-recife/);
      assert.equal(new URL(page.url()).searchParams.get('visualizacao'), 'lista');
      assert.equal(new URL(page.url()).searchParams.get('tipo'), 'breast');
      await page.goBack();
      await page.locator('.identity').click();
      await page.waitForURL(base + '/?theme=light');
      assert.equal(await page.locator('#municipality-preview').isVisible(), false);
    } finally { await page.close(); }
  });
}

test('the logo remains a native root link without JavaScript', async () => {
  const page = await browser.newPage({ javaScriptEnabled: false });
  try {
    await page.goto(base + '/municipio/261160-recife/?tipo=breast#panorama');
    assert.equal(await page.locator('.identity').getAttribute('href'), '/');
    await page.locator('.identity').click();
    await page.waitForURL(base + '/');
    assert.equal(await page.locator('#municipality-preview').isVisible(), false);
  } finally { await page.close(); }
});

for (const cache of ['cold', 'warm']) {
  test(`logo after selection: ten ${cache} attempts reset the public dashboard`, async () => {
    let warmPage;
    try {
      if (cache === 'warm') {
        warmPage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
        await warmPage.goto(base + '/municipio/261160-recife/');
        await warmPage.locator('.result-value').waitFor();
      }
      for (let attempt = 0; attempt < 10; attempt++) {
        const page = warmPage ?? await browser.newPage({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
        try {
          await page.goto(base + '/');
          await page.locator('.search-toggle').click();
          await page.locator('#municipality-search:enabled').fill('Recife PE');
          await page.locator('#municipality-results button').click();
          await page.locator('.result-value').waitFor();
          await page.locator('.identity').click();
          await page.waitForURL(base + '/');
          assert.equal(await page.locator('#municipality-preview').isVisible(), false, `${cache} attempt ${attempt + 1}`);
          assert.equal(await page.locator('[data-map-view]').isVisible(), true);
          assert.equal(await page.locator('[data-filter-summary]').innerText(), 'Até 60 dias · Todos os cânceres · Tendência');
        } finally { if (!warmPage) await page.close(); }
      }
    } finally { await warmPage?.close(); }
  });
}

test('modified activation opens the reset destination natively and leaves the current query intact', async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(base + '/municipio/261160-recife/?tipo=breast&theme=dark');
    await page.locator('.result-value').waitFor();
    const previous = page.url();
    const opened = context.waitForEvent('page');
    await page.locator('.identity').click({ modifiers: ['Control'] });
    const other = await opened;
    await other.waitForURL(base + '/?theme=dark');
    assert.equal(page.url(), previous);
    assert.equal(await page.locator('#municipality-preview').isVisible(), true);
  } finally { await context.close(); }
});
