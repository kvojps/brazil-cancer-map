import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
const route = '/municipio/261160-recife/';
let browser;
before(async () => {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/snap/bin/chromium', headless: true, args: ['--no-sandbox'] });
});
after(async () => { await browser?.close(); });

test('static cancer links reach readable cards without JavaScript', async () => {
  const page = await browser.newPage({ javaScriptEnabled: false });
  try {
    await page.goto(base + route);
    const links = page.getByRole('navigation', { name: 'Tipo de câncer', exact: true }).getByRole('link');
    assert.equal(await links.count(), 6);
    for (const link of await links.all()) {
      await link.click();
      const target = page.locator(new URL(page.url()).hash);
      assert.equal(await target.isVisible(), true);
      assert.match(await target.textContent(), /Conheça seus direitos/);
    }
  } finally { await page.close(); }
});

test('direct types override a conflicting query and preserve theme and map context', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(`${base}${route}?tipo=breast&theme=dark&indicador=mortality#tipo-prostate`);
    await page.locator('[data-profile-type="prostate"][aria-current="true"]').waitFor();
    await page.locator('#acesso').evaluate(el => { el.open = true; });
    assert.equal(await page.locator('[data-cancer-type="breast"]').first().isVisible(), false);
    assert.equal(await page.locator('[data-cancer-type="prostate"]').first().isVisible(), true);
    assert.equal(await page.locator('.profile > [data-profile-axis]').count(), 4);
    assert.equal(new URL(page.url()).searchParams.get('tipo'), 'prostate');
    assert.equal(new URL(page.url()).searchParams.get('theme'), 'dark');
    await page.evaluate(() => { location.hash = 'tipo-cervix'; });
    await page.locator('[data-profile-type="cervix"][aria-current="true"]').waitFor();
    assert.equal(await page.locator('[data-cancer-type="cervix"]').first().isVisible(), true);
    await page.locator('[data-profile-type="lung"]').focus();
    await page.keyboard.press('Enter');
    await page.locator('[data-profile-type="lung"][aria-current="true"]').waitFor();
    await page.locator('#acesso').evaluate(el => { el.open = true; });
    const summary = page.locator('[data-cancer-type="lung"] details summary').first();
    await summary.focus();
    assert.notEqual(await summary.evaluate(el => getComputedStyle(el).outlineStyle), 'none');
    await page.keyboard.press('Enter');
    assert.equal(await summary.evaluate(el => el.parentElement.open), true);
  } finally { await page.close(); }
});

for (const javaScriptEnabled of [false, true]) {
  for (const colorScheme of ['light', 'dark']) {
    test(`municipality fits all widths and zoom in ${colorScheme}, JavaScript ${javaScriptEnabled}`, async () => {
      const page = await browser.newPage({ javaScriptEnabled, colorScheme });
      try {
        await page.goto(base + route);
        if (javaScriptEnabled) {
          await page.locator('[data-toggle-profile]:not([hidden])').waitFor();
          await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
          if (await page.locator('[data-toggle-profile]').getAttribute('aria-expanded') === 'false') await page.locator('[data-toggle-profile]').click();
        }
        for (const width of [320, 768, 1280]) {
          await page.setViewportSize({ width, height: 900 });
          for (const zoom of ['100%', '200%']) {
            await page.locator('body').evaluate((el, zoom) => { el.style.zoom = zoom; }, zoom);
            await page.locator('.profile details').evaluateAll(elements => elements.forEach(el => { el.open = true; }));
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${width}px, zoom ${zoom}`);
          }
        }
      } finally { await page.close(); }
    });
  }
}

test('native 200% browser zoom keeps the municipal profile readable in both themes', async () => {
  const extension = fileURLToPath(new URL('./zoom-extension', import.meta.url));
  for (const javaScriptEnabled of [false, true]) {
    for (const colorScheme of ['light', 'dark']) {
      const context = await chromium.launchPersistentContext('', {
        executablePath: process.env.CHROMIUM_PATH ?? '/snap/bin/chromium',
        headless: true, javaScriptEnabled, colorScheme,
        ignoreDefaultArgs: ['--disable-extensions'],
        args: ['--no-sandbox', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
      });
      try {
        const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
        const page = await context.newPage();
        await page.goto(base + route);
        if (javaScriptEnabled) {
          await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
          await page.locator('[data-toggle-profile]:not([hidden])').waitFor();
        }
        await page.locator('.profile details').evaluateAll(elements => elements.forEach(el => { el.open = true; }));
        await worker.evaluate(async base => {
          const tabs = await chrome.tabs.query({});
          const tab = tabs.find(tab => tab.url.startsWith(base));
          await chrome.tabs.setZoom(tab.id, 2);
        }, base);
        for (const width of [320, 768, 1280]) {
          await page.setViewportSize({ width, height: 900 });
          assert.equal(await page.evaluate(() => devicePixelRatio), 2);
          assert.equal(await page.evaluate(() => innerWidth), width / 2);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true,
            `native zoom overflow: ${width}px, ${colorScheme}, JavaScript ${javaScriptEnabled}`);
        }
      } finally { await context.close(); }
    }
  }
});
