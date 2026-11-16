import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
let browser;
before(async () => {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/snap/bin/chromium', args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
});
after(async () => { await browser?.close(); });

for (const view of ['mapa', 'lista']) {
  test(`${view}: temporary surfaces are exclusive and preserve selection, filters and focus`, async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    page.setDefaultTimeout(10000);
    try {
      await page.goto(`${base}/municipio/261160-recife/?visualizacao=${view}`);
      await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
      if (view === 'lista') {
        await page.locator('.indicator-table select').selectOption('PE');
        const row = page.locator('.indicator-table tr[data-code="260960"]');
        await row.locator('button[aria-expanded]').click();
      }
      const url = page.url();
      await page.locator('.search-toggle').focus();
      await page.keyboard.press('Enter');
      await page.locator('#municipality-search').fill('Olinda PE');
      await page.getByRole('button', { name: 'Olinda (PE)', exact: true }).waitFor();
      await page.locator('.filters-toggle').focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#municipality-search').isVisible(), false);
      assert.equal(await page.locator('#map-filters').evaluate(el => el.matches(':popover-open')), true);
      await page.locator('#cancer-type').selectOption('breast');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.filters-toggle').evaluate(el => el === document.activeElement), true);
      assert.equal(await page.locator('#municipality-preview').isVisible(), true);
      assert.match(await page.locator('#preview-heading').textContent(), /Recife/);
      assert.equal(new URL(page.url()).pathname, new URL(url).pathname);
      assert.equal(new URL(page.url()).searchParams.get('tipo'), 'breast');
      if (view === 'lista') {
        assert.equal(await page.locator('.indicator-table select').inputValue(), 'PE');
        assert.equal(await page.locator('.indicator-table tr[data-code="260960"] button[aria-expanded]').getAttribute('aria-expanded'), 'true');
      }
      await page.locator('.search-toggle').click();
      await page.getByRole('button', { name: 'Fechar a busca' }).click();
      assert.equal(await page.locator('.search-toggle').evaluate(el => el === document.activeElement), true);
      assert.equal(await page.locator('#municipality-preview').isVisible(), true);
      await page.locator('.search-toggle').click();
      await page.keyboard.press('Escape');
      if (view === 'mapa') {
        await page.locator('[data-panel-legend]').click();
        await page.locator('.filters-toggle').focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('#legend-full').isVisible(), false);
        await page.locator('.search-toggle').click();
        assert.equal(await page.locator('#map-filters').isVisible(), false);
        await page.keyboard.press('Escape');
        await page.locator('[data-panel-legend]').click();
        await page.getByRole('button', { name: 'Fechar legenda', exact: true }).click();
        assert.equal(await page.locator('[data-panel-legend]').evaluate(el => el === document.activeElement), true);
        await page.locator('[data-panel-legend]').click();
        await page.locator('.search-toggle').click();
        assert.equal(await page.locator('#legend-full').isVisible(), false);
        await page.keyboard.press('Escape');
      }
      await page.locator('.search-toggle').click();
      await page.locator('#municipality-search').fill('Olinda PE');
      await page.keyboard.press('Enter');
      await page.locator('.profile[data-code="260960"]').waitFor({ state: 'attached' });
      assert.equal(await page.locator('#municipality-search').isVisible(), false);
      assert.match(await page.locator('#preview-heading').textContent(), /Olinda/);
      assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
      assert.equal(await page.locator('#preview-heading').evaluate(el => el === document.activeElement), true);
      assert.equal(new URL(page.url()).searchParams.get('tipo'), 'breast');
    } finally { await page.close(); }
  });
}

test('Escape returns to the invoker after Tab leaves a nonmodal surface', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(10000);
  try {
    await page.goto(`${base}/municipio/261160-recife/`);
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    for (const [opener, surface] of [['.search-toggle', '.municipality-search'], ['.filters-toggle', '#map-filters']]) {
      await page.locator(opener).click();
      for (let count = 0; count < 20; count++) {
        await page.keyboard.press('Tab');
        if (!await page.locator(surface).evaluate(el => el.contains(document.activeElement))) break;
      }
      assert.equal(await page.locator(surface).evaluate(el => el.contains(document.activeElement)), false);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator(surface).isVisible(), false);
      assert.equal(await page.locator(opener).evaluate(el => el === document.activeElement), true);
    }
  } finally { await page.close(); }
});

test('details commands preserve reading and expose one surface with a visible return focus', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(5000);
  try {
    await page.goto(`${base}/municipio/261160-recife/`);
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    await page.locator('#prevencao > summary').click();
    await page.locator('#prevencao [data-cancer-type="all"] .card-action').first().scrollIntoViewIfNeeded();
    const position = await page.locator('.panel-reading').evaluate(el => el.scrollTop);
    const entries = await page.evaluate(() => history.length);
    for (const command of ['Buscar município', 'Filtros', 'Legenda']) {
      await page.locator('[data-details-menu]').click();
      await page.waitForFunction(() => document.querySelector('#details-menu').contains(document.activeElement));
      await page.locator('#details-menu').getByRole('button', { name: command, exact: true }).click();
      await page.waitForFunction(() => !document.querySelector('#details-menu').matches(':popover-open'));
      const surface = command === 'Buscar município' ? '.municipality-search' : command === 'Filtros' ? '#map-filters' : '#legend-full';
      await page.waitForFunction(selector => { const node = document.querySelector(selector); return node.checkVisibility({ visibilityProperty: true }) && node.contains(document.activeElement); }, surface);
      assert.equal(await page.locator('#prevencao').getAttribute('open'), '');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.activeElement?.matches('[data-details-menu]'));
      assert.equal(await page.locator('[data-details-menu]').isVisible(), true);
      assert.equal(await page.locator('.panel-reading').evaluate(el => el.scrollTop), position);
      assert.equal(await page.evaluate(() => history.length), entries);
    }
    await page.locator('[data-details-menu]').click();
    await page.locator('#details-menu').getByRole('button', { name: 'Fechar menu', exact: true }).click();
    await page.waitForFunction(() => document.activeElement?.matches('[data-details-menu]'));
    await page.locator('[data-details-menu]').click();
    await page.locator('.construction-notice').click();
    await page.waitForFunction(() => !document.querySelector('#details-menu').matches(':popover-open') && document.activeElement?.matches('[data-details-menu]'));
    assert.equal(await page.locator('.panel-reading').evaluate(el => el.scrollTop), position);
    await page.locator('.details-legend').click();
    await page.getByRole('button', { name: 'Fechar legenda', exact: true }).click();
    await page.waitForFunction(() => document.activeElement?.matches('.details-legend'));
    assert.equal(await page.evaluate(() => scrollY), 0);
    assert.equal(await page.locator('.panel-bar').evaluate(el => {
      const rect = el.getBoundingClientRect();
      return rect.top >= document.querySelector('.construction-notice').getBoundingClientRect().bottom && rect.bottom <= innerHeight;
    }), true);
    await page.locator('[data-details-menu]').click();
    await page.locator('#details-menu').getByRole('button', { name: 'Buscar município', exact: true }).click();
    await page.locator('#municipality-search').fill('Olinda PE');
    await page.locator('#municipality-search').press('Enter');
    await page.locator('.profile[data-code="260960"]').waitFor({ state: 'attached' });
    assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
    assert.equal(await page.locator('#preview-heading').evaluate(el => el === document.activeElement), true);
    assert.equal(await page.locator('#municipality-search').isVisible(), false);
  } finally { await page.close(); }
});
