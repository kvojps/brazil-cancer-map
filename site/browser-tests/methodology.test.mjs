import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
const executablePath = process.env.CHROMIUM_PATH ?? '/snap/bin/chromium';
let browser;
before(async () => { browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] }); });
after(async () => { await browser?.close(); });

for (const javaScriptEnabled of [false, true]) {
  for (const colorScheme of ['light', 'dark']) {
    test(`methodology sections, keyboard and contained tables: ${colorScheme}, JavaScript ${javaScriptEnabled}`, async () => {
      const page = await browser.newPage({ javaScriptEnabled, colorScheme });
      try {
        await page.goto(base + '/metodologia/');
        const links = page.getByRole('navigation', { name: 'Nesta página' }).getByRole('link');
        assert.equal(await links.count(), 10);
        for (const link of await links.all()) {
          await link.focus();
          await page.keyboard.press('Enter');
          const target = page.locator(`[id="${new URL(page.url()).hash.slice(1)}"]`);
          assert.equal(await target.isVisible(), true);
          assert.match(await target.getByRole('heading', { level: 2 }).textContent(), /^\d{2}\s/);
        }
        const summary = page.locator('.methodology summary').first();
        await summary.focus();
        await page.keyboard.press('Enter');
        assert.equal(await summary.evaluate(el => el.parentElement.open), true);
        assert.notEqual(await summary.evaluate(el => getComputedStyle(el).outlineStyle), 'none');
        await page.locator('.methodology details').evaluateAll(elements => elements.forEach(el => { el.open = true; }));
        for (const width of [320, 768, 1280]) {
          await page.setViewportSize({ width, height: 900 });
          for (const zoom of ['100%', '200%']) {
            await page.locator('body').evaluate((el, zoom) => { el.style.zoom = zoom; }, zoom);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${width}, ${zoom}`);
          }
        }
      } finally { await page.close(); }
    });
  }
}

test('methodology return link preserves the selected list and theme', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(base + '/metodologia/?indicador=mammography&tipo=breast&modo=hoje&municipio=261160&visualizacao=lista&theme=dark#mamografia');
    await page.getByRole('link', { name: /Voltar ao mapa/ }).waitFor();
    const back = new URL(await page.getByRole('link', { name: /Voltar ao mapa/ }).getAttribute('href'), base);
    for (const [key, value] of Object.entries({ indicador: 'mammography', tipo: 'breast', modo: 'hoje', municipio: '261160', visualizacao: 'lista', theme: 'dark' })) assert.equal(back.searchParams.get(key), value);
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  } finally { await page.close(); }
});

test('methodology fits native 200% zoom with and without JavaScript in both themes', async () => {
  const extension = fileURLToPath(new URL('./zoom-extension', import.meta.url));
  for (const javaScriptEnabled of [false, true]) {
    for (const colorScheme of ['light', 'dark']) {
      const context = await chromium.launchPersistentContext('', {
        executablePath, headless: true, javaScriptEnabled, colorScheme,
        ignoreDefaultArgs: ['--disable-extensions'],
        args: ['--no-sandbox', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
      });
      try {
        const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
        const page = await context.newPage();
        await page.goto(base + '/metodologia/');
        await page.locator('.methodology details').evaluateAll(elements => elements.forEach(el => { el.open = true; }));
        await worker.evaluate(async base => {
          const tab = (await chrome.tabs.query({})).find(tab => tab.url.startsWith(base));
          await chrome.tabs.setZoom(tab.id, 2);
        }, base);
        for (const width of [320, 768, 1280]) {
          await page.setViewportSize({ width, height: 900 });
          assert.equal(await page.evaluate(() => devicePixelRatio), 2);
          assert.equal(await page.evaluate(() => innerWidth), width / 2);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${width}, ${colorScheme}, JS ${javaScriptEnabled}`);
        }
      } finally { await context.close(); }
    }
  }
});
