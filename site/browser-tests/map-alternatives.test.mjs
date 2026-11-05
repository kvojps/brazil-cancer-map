import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';

// Run against `npm run dev` or `npm run preview`; supply an installed Chromium.
const base = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
let browser;
before(async () => {
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH ?? '/snap/bin/chromium',
    headless: true,
    args: ['--no-sandbox'],
  });
});
after(async () => { await browser?.close(); });

async function waitForData(page) {
  await page.waitForFunction(() => document.querySelector('.indicator-table tbody')?.children.length > 0);
}

async function disableWebGL(page) {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.includes('webgl') ? null : getContext.call(this, type, ...args);
    };
  });
}

test('search, direct links and table work when WebGL fails', async () => {
  const page = await browser.newPage();
  try {
    await disableWebGL(page);
    await page.goto(`${base}/?tipo=breast&theme=dark`);
    await waitForData(page);
    await page.waitForFunction(() => document.querySelector('.map-status').textContent.includes('Não foi possível'));
    await page.locator('#municipality-search').fill('Recife PE');
    const result = page.locator('#municipality-results a');
    await result.waitFor();
    assert.match(await result.getAttribute('href'), /tipo=breast/);
    assert.match(await result.getAttribute('href'), /theme=dark/);
    await page.locator('#municipality-search').press('ArrowDown');
    assert.equal(await page.locator('#municipality-results button').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Enter');
    await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
    assert.match(await page.locator('#preview-heading').textContent(), /Recife/);
    await page.locator('.list-shortcut').click();
    await page.locator('.indicator-table select').selectOption('PE');
    assert.match(await page.locator('.table-count').textContent(), /185 municípios/);
    assert.match(await page.locator('.indicator-table tbody').textContent(), /Seu município e vizinhos/);
    await page.locator('#map-reading').selectOption('status');
    await waitForData(page);
    assert.equal(await page.locator('.table-mode').textContent(), 'Como está hoje');
  } finally { await page.close(); }
});

test('existing search results follow a later change of cancer type', async () => {
  const page = await browser.newPage();
  try {
    await disableWebGL(page);
    await page.goto(`${base}/?tipo=breast&theme=dark`);
    await waitForData(page);
    await page.locator('#municipality-search').fill('Recife PE');
    await page.locator('#municipality-results a').waitFor();
    await page.locator('#cancer-type').selectOption('lung');
    await waitForData(page);
    await page.waitForFunction(() => document.querySelector('#municipality-results a')?.href.includes('tipo=lung'), undefined, { timeout: 5000 });
    assert.match(await page.locator('#municipality-results a').getAttribute('href'), /theme=dark/);
  } finally { await page.close(); }
});

test('a pending map never blocks loading text alternatives', async () => {
  const page = await browser.newPage();
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  try {
    await page.route('**/municipalities.topojson', async route => { await pending; await route.abort(); });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await waitForData(page);
    assert.equal(await page.locator('#municipality-search').isEnabled(), true);
  } finally { release(); await page.close(); }
});

test('layer failure clears old results, retries and respects the selected cancer type', async () => {
  const page = await browser.newPage();
  let fail = true;
  try {
    await disableWebGL(page);
    await page.route('**/map/within_60_days/breast.json', route => fail ? route.fulfill({ status: 503, body: '' }) : route.continue());
    await page.goto(base);
    await waitForData(page);
    await page.locator('.list-shortcut').click();
    await page.locator('#cancer-type').selectOption('breast');
    await page.locator('#retry-data').waitFor();
    assert.equal(await page.locator('.indicator-table tbody tr').count(), 0);
    assert.match(await page.locator('#data-status').textContent(), /Não foi possível carregar/);
    fail = false;
    await page.locator('#retry-data').click();
    await waitForData(page);
    assert.equal(await page.locator('.indicator-table .cancer-type').textContent(), 'Mama');
    await page.locator('#cancer-type').selectOption('prostate');
    await waitForData(page);
    assert.match(await page.locator('.indicator-table tbody tr').first().textContent(), /Não se aplica/);
    await page.locator('#map-indicator').selectOption('mortality');
    await waitForData(page);
    assert.match(await page.locator('.indicator-table .status-note').textContent(), /mortalidade/i);
  } finally { await page.close(); }
});

test('municipality listing failure explains recovery and retry enables search', async () => {
  const page = await browser.newPage();
  let fail = true;
  try {
    await disableWebGL(page);
    await page.route('**/dados/municipalities.json', route => fail ? route.fulfill({ status: 503, body: '' }) : route.continue());
    await page.goto(base);
    await page.locator('#retry-data').waitFor();
    assert.match(await page.locator('#data-status').textContent(), /lista de municípios/);
    assert.equal(await page.locator('.municipality-index a[href*="261160-recife"]').count(), 1);
    fail = false;
    await page.locator('#retry-data').click();
    await waitForData(page);
    assert.equal(await page.locator('#municipality-search').isEnabled(), true);
  } finally { await page.close(); }
});

test('an uncomputable C55 adjustment is distinct from insufficient data in the table', async () => {
  const page = await browser.newPage();
  try {
    await disableWebGL(page);
    await page.route('**/map/mortality/cervix.json', async route => {
      const response = await route.fetch();
      const layer = await response.json();
      layer.municipalities['261160'] = {
        ...layer.municipalities['261160'], origin: 'municipality', trend: null,
        value: null, adjustment_note: 'Ajuste não calculável',
      };
      await route.fulfill({ json: layer });
    });
    await page.goto(`${base}/?indicador=mortality&tipo=cervix`);
    await waitForData(page);
    await page.locator('.list-shortcut').click();
    const row = page.locator('.indicator-table tbody tr').filter({ has: page.getByRole('link', { name: 'Recife', exact: true }) });
    assert.equal(await row.locator('td').nth(1).textContent(), 'Ajuste não calculável');
  } finally { await page.close(); }
});

for (const javaScriptEnabled of [false, true]) {
  for (const colorScheme of ['light', 'dark']) {
    for (const width of [320, 768, 1280]) {
      test(`alternatives fit at ${width}px in ${colorScheme}, JavaScript ${javaScriptEnabled}`, async () => {
        const page = await browser.newPage({ javaScriptEnabled, colorScheme, viewport: { width, height: 900 } });
        try {
          if (javaScriptEnabled) await disableWebGL(page);
          await page.goto(base);
          if (javaScriptEnabled) {
            await waitForData(page);
            await page.locator('.list-shortcut').click();
          }
          await page.locator('.municipality-index > summary').click();
          await page.locator('#municipalities-PE summary').click();
          const link = page.locator('#municipalities-PE a').filter({ hasText: /^Recife$/ });
          assert.match(await link.getAttribute('href'), /261160-recife/);
          for (const zoom of ['100%', '200%']) {
            await page.locator('body').evaluate((el, zoom) => { el.style.zoom = zoom; }, zoom);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `page overflow at zoom ${zoom}`);
          }
        } finally { await page.close(); }
      });
    }
  }
}

// A test-only extension calls Chrome's native tabs.setZoom API, exercising
// viewport/media-query changes as well as text scaling.
test('native 200% browser zoom keeps alternatives readable in both themes', async () => {
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
        if (javaScriptEnabled) await disableWebGL(page);
        await page.goto(base);
        if (javaScriptEnabled) {
          await waitForData(page);
          await page.locator('.list-shortcut').click();
        }
        await page.locator('.municipality-index > summary').click();
          await page.locator('#municipalities-PE summary').click();
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

test('list replaces the map and restores selection and filters through history', async () => {
  const page = await browser.newPage();
  try {
    await disableWebGL(page);
    await page.goto(`${base}/?tipo=breast&theme=dark`);
    await waitForData(page);
    await page.locator('.list-shortcut').click();
    assert.equal(await page.locator('.map-frame').isVisible(), false);
    assert.equal(await page.locator('.indicator-table').isVisible(), true);
    assert.equal(new URL(page.url()).searchParams.get('visualizacao'), 'lista');
    await page.locator('.indicator-table select').selectOption('PE');
    await page.screenshot({ path: '/tmp/ticket38-list.png' });
    await page.locator('.indicator-table a').filter({ hasText: /^Recife$/ }).click();
    await page.waitForURL('**/municipio/261160-recife/**');
    await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
    await page.locator('[data-view="mapa"]').click();
    assert.equal(await page.locator('.indicator-table').isVisible(), false);
    assert.match(await page.locator('#preview-heading').textContent(), /Recife/);
    await page.goBack();
    await page.locator('.indicator-table').waitFor();
    assert.equal(await page.locator('.indicator-table select').inputValue(), 'PE');
    assert.equal(await page.locator('#cancer-type').inputValue(), 'breast');
    await page.goForward();
    await page.locator('.map-frame').waitFor();
    assert.equal(await page.locator('.indicator-table').isVisible(), false);
  } finally { await page.close(); }
});

test('invalid state is corrected field by field and legacy queries become static municipal links', async () => {
  const page = await browser.newPage();
  try {
    await disableWebGL(page);
    await page.goto(`${base}/?municipio=261160&indicador=mortality&tipo=prostate&modo=hoje&visualizacao=invalid&theme=invalid`);
    await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
    const url = new URL(page.url());
    assert.equal(url.pathname, '/municipio/261160-recife/');
    assert.equal(url.searchParams.get('indicador'), 'mortality');
    assert.equal(url.searchParams.get('tipo'), 'prostate');
    for (const key of ['modo', 'municipio', 'theme', 'visualizacao']) assert.equal(url.searchParams.has(key), false, key);
    await page.locator('#municipality-search').fill('Olinda PE');
    await page.locator('#municipality-results button').click();
    await page.locator('.profile[data-code="260960"]').waitFor({ state: 'attached' });
    await page.goBack();
    await page.locator('.profile[data-code="261160"]').waitFor({ state: 'attached' });
    assert.match(await page.locator('#preview-heading').textContent(), /Recife/);
    const staticPage = await browser.newPage({ javaScriptEnabled: false });
    try {
      await staticPage.goto(page.url());
      assert.equal(await staticPage.locator('.profile[data-code="261160"]').count(), 1);
      assert.equal(await staticPage.locator('[data-profile-axis]').count(), 4);
      assert.equal(await staticPage.locator('[data-profile-type]').count(), 6);
    } finally { await staticPage.close(); }
  } finally { await page.close(); }
});

test('the index link from a selected document survives reload and preserves its native anchor', async () => {
  const page = await browser.newPage();
  try {
    await disableWebGL(page);
    await page.goto(`${base}/municipio/261160-recife/?visualizacao=lista&theme=dark`);
    await page.locator('#municipality-search:enabled').waitFor();
    await page.getByRole('link', { name: 'Consultar outro município no índice por UF' }).click();
    await page.locator('#municipality-search:enabled').waitFor();
    assert.equal(new URL(page.url()).pathname, '/');
    assert.equal(new URL(page.url()).searchParams.has('municipio'), false);
    await page.reload();
    await page.locator('#municipality-search:enabled').waitFor();
    assert.equal(new URL(page.url()).pathname, '/');
    assert.equal(await page.locator('.municipality-index').getAttribute('open'), '');
    assert.equal(await page.locator('#municipality-index-heading').isVisible(), true);
  } finally { await page.close(); }
});
