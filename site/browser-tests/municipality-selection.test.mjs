import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
let browser;
before(async () => {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/snap/bin/chromium', args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
});
after(async () => { await browser?.close(); });

test('municipal selections preserve list links without rewriting thousands of unchanged destinations', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(`${base}/?tipo=breast&theme=dark&visualizacao=lista`);
    await page.locator('.indicator-table tbody tr').first().waitFor({ state: 'attached' });
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      window.listLinkWrites = 0;
      new MutationObserver(records => { window.listLinkWrites += records.length; })
        .observe(document.querySelector('.indicator-table tbody'), { attributes: true, attributeFilter: ['href'], subtree: true });
    });
    for (const code of ['261160', '260960', '261160']) {
      await page.evaluate(code => window.dispatchEvent(new CustomEvent('municipality-map-select', { detail: code })), code);
      await page.locator(`#municipality-content .profile[data-code="${code}"]`).waitFor({ state: 'attached' });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await page.evaluate(() => window.listLinkWrites), 0, 'changing only the selected municipality leaves municipal destinations unchanged');
      const method = new URL(await page.locator('.site-header a[href*="/metodologia/"]').first().getAttribute('href'), base);
      assert.equal(method.searchParams.get('municipio'), code, 'return links follow the new selection');
      const list = new URL(await page.locator('.indicator-table tbody a').first().getAttribute('href'), base);
      assert.equal(list.searchParams.get('tipo'), 'breast');
      assert.equal(list.searchParams.get('theme'), 'dark');
    }
    // Newly inserted profile links still receive the context without rescanning the list.
    await page.evaluate(() => {
      const link = document.createElement('a');
      link.id = 'selection-context-check';
      link.href = '/metodologia/#dados-e-fontes';
      document.querySelector('[data-profile-slot]').append(link);
    });
    await page.waitForFunction(() => document.querySelector('#selection-context-check').href.includes('municipio=261160'));
    const inserted = new URL(await page.locator('#selection-context-check').getAttribute('href'), base);
    assert.equal(inserted.searchParams.get('tipo'), 'breast');
    assert.equal(inserted.searchParams.get('theme'), 'dark');
    assert.equal(await page.evaluate(() => window.listLinkWrites), 0);
    await page.locator('.indicator-table select').selectOption('PE');
    await page.locator('.indicator-table [data-row-toggle]').first().click();
    await page.locator('[data-view="mapa"]').click();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
    assert.equal(await page.locator('.indicator-table tbody tr').count(), 0, 'returning to the map removes hidden list rows');
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('municipality-map-select', { detail: '260960' })));
    await page.locator('.profile[data-code="260960"]').waitFor({ state: 'attached' });
    assert.equal(await page.locator('.indicator-table tbody tr').count(), 0, 'map selections keep hidden list rows out of the document');
    await page.locator('[data-view="lista"]').click();
    await page.locator('.indicator-table tbody tr').first().waitFor();
    assert.equal(await page.locator('.indicator-table select').inputValue(), 'PE');
    assert.equal(await page.locator('.indicator-table tbody tr').count(), 185);
    assert.equal(await page.locator('.indicator-table [data-row-toggle]').first().getAttribute('aria-expanded'), 'true');
  } finally { await page.close(); }
});
