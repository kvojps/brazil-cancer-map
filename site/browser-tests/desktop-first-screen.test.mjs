import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';

// The contract of the desktop decision (.scratch/ui-polimento/issues/05-desktop-tela-cheia.md).
const base = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
const RECIFE = '/municipio/261160-recife/';

let browser;
before(async () => {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/snap/bin/chromium', headless: true, args: ['--no-sandbox'] });
});
after(async () => { await browser?.close(); });

const box = (page, selector) => page.locator(selector).first().evaluate(element => {
  const { left, top, right, bottom, width, height } = element.getBoundingClientRect();
  return { left, top, right, bottom, width, height };
});
const open = async (options, path) => {
  const page = await browser.newPage(options);
  await page.goto(base + path);
  if (options.javaScriptEnabled !== false) await page.locator('.view-controls:not([hidden])').waitFor();
  return page;
};
const noHorizontalScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);

for (const javaScriptEnabled of [true, false]) {
  for (const [width, height, expected] of [[1280, 800, 653], [1440, 900, 753]]) {
    test(`the map is ${expected} px tall at ${width} × ${height}, with and without a municipality, JavaScript ${javaScriptEnabled}`, async () => {
      const page = await open({ javaScriptEnabled, viewport: { width, height } }, '/');
      try {
        assert.equal(Math.round((await box(page, '.map-frame')).height), expected, 'no selection');
        assert.equal(Math.round((await box(page, '.map-frame')).bottom), height, 'ends at the bottom of the window');
        await page.goto(base + RECIFE);
        if (javaScriptEnabled) await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
        const map = await box(page, '.map-frame');
        assert.equal(Math.round(map.height), expected, 'selected');
        assert.equal(Math.round(map.width), width - 400, 'only width is lost to the panel');
        const panel = await box(page, '#municipality-preview');
        assert.equal(panel.width, 400);
        assert.equal(panel.top, map.top);
        assert.equal(panel.bottom, map.bottom);
      } finally { await page.close(); }
    });
  }
}

test('at 1280 px the header is one 48 px row with brand, search, links and theme, and the filters one 56 px row', async () => {
  const page = await open({ viewport: { width: 1280, height: 800 } }, '/');
  try {
    assert.equal((await box(page, '.site-header')).height, 48);
    const order = await page.locator('.site-header').evaluate(header => ['.identity', '#municipality-search', 'nav[aria-label="Navegação principal"]', '.theme-switcher']
      .map(selector => header.querySelector(selector).getBoundingClientRect().left));
    assert.deepEqual(order, [...order].sort((a, b) => a - b));
    assert.equal(await page.locator('.map-controls #municipality-search').count(), 0);
    assert.equal((await box(page, '.map-controls')).height, 56);
    for (const [selector, width] of [['#map-indicator', 304], ['#map-reading', 160], ['#cancer-type', 176]]) {
      assert.equal((await box(page, selector)).width, width, selector);
      assert.equal((await box(page, selector)).height, 40, selector);
    }
    const label = await box(page, '.cancer-type-heading label');
    const select = await box(page, '#cancer-type');
    assert.ok(label.right <= select.left, 'label beside its select');
    const bar = await box(page, '.map-controls');
    assert.ok(bar.right - (await box(page, '.view-controls')).right === 16, 'Mapa/Lista at the far end');
  } finally { await page.close(); }
});

test('the repeated list link and titles leave the screen and stay for screen readers', async () => {
  const page = await open({ viewport: { width: 1280, height: 800 } }, '/');
  try {
    assert.equal(await page.getByText('Explorar em lista').count(), 0);
    assert.equal(await page.getByRole('heading', { level: 2, name: await page.locator('#map-indicator-heading').textContent() }).count(), 1);
    assert.ok((await box(page, '.map-heading')).width <= 1, 'title has no visible box');
    assert.match(await page.locator('.map-heading').textContent(), /Panorama territorial/);
  } finally { await page.close(); }
});

for (const javaScriptEnabled of [true, false]) {
  for (const colorScheme of ['light', 'dark']) {
    test(`the legend sits in the map corner and ⓘ opens the full legend: ${colorScheme}, JavaScript ${javaScriptEnabled}`, async () => {
      const page = await open({ javaScriptEnabled, colorScheme, viewport: { width: 1280, height: 800 } }, '/');
      try {
        const map = await box(page, '.map-frame');
        const legend = await box(page, '.legend-corner');
        assert.equal(legend.left, map.left);
        assert.equal(legend.bottom, map.bottom);
        const text = await page.locator('.legend-corner').innerText();
        for (const part of [/Tendência( \d{4}–\d{4})?/, /Melhorando/, /Piorando/, /Estável/, /Sem direção clara/, /Dado insuficiente/, /não um ranking/]) assert.match(text, part);
        assert.equal(await page.locator('#legend-full').isVisible(), false);
        await page.locator('.legend-corner-more').click();
        assert.equal(await page.locator('.legend .trend-legend h2').isVisible(), true);
        assert.match(await page.locator('#legend-full').innerText(), /Origem e período dos dados/);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#legend-full').isVisible(), false);
      } finally { await page.close(); }
    });
  }
}

test('the corner legend follows the reading, and the caveat leaves when a municipality is selected', async () => {
  const page = await open({ viewport: { width: 1280, height: 800 } }, '/');
  try {
    await page.locator('#map-reading:enabled').selectOption('status');
    await page.locator('.legend-corner [data-corner-mode="status"]').waitFor();
    assert.match(await page.locator('.legend-corner').innerText(), /Situação em \d{4}[\s\S]*Alcançou/);
    assert.doesNotMatch(await page.locator('.legend-corner').innerText(), /Melhorando/);
    await page.goto(`${base}${RECIFE}`);
    await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
    assert.equal(await page.locator('.legend-corner-caveat').isVisible(), false);
  } finally { await page.close(); }
});

test('a dynamic caveat keeps the map height and leaves the panel uncovered', async () => {
  const page = await open({ viewport: { width: 1280, height: 800 } }, RECIFE);
  try {
    await page.locator('#cancer-type:enabled').selectOption('prostate');
    await page.locator('#map-indicator').selectOption('mortality');
    const caveat = page.locator('#indicator-caveat');
    await caveat.waitFor();
    assert.equal(Math.round((await box(page, '.map-frame')).height), 653);
    const note = await box(page, '.map-notes');
    assert.ok(note.right <= (await box(page, '#municipality-preview')).left, 'caveat stays over the map');
    assert.equal(note.top, (await box(page, '.map-frame')).top);
  } finally { await page.close(); }
});

test('from 768 to 1023 px the header keeps one row, the links move to the menu and filters take two rows', async () => {
  const page = await open({ viewport: { width: 768, height: 1024 } }, '/');
  try {
    assert.equal((await box(page, '.site-header')).height, 48);
    assert.equal(await page.locator('nav[aria-label="Navegação principal"]').isVisible(), false);
    const filters = await page.locator('#map-indicator, #map-reading, #cancer-type, .view-controls').evaluateAll(items => new Set(items.map(item => Math.round(item.getBoundingClientRect().top))).size);
    assert.equal(filters, 2, 'two rows of filters');
    await page.locator('.site-menu summary').click();
    const link = page.getByRole('navigation', { name: 'Menu' }).getByRole('link', { name: 'Como calculamos' });
    assert.equal(await link.isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await link.isVisible(), false);
    assert.equal(await page.locator('.site-menu summary').evaluate(element => element === document.activeElement), true);
    await page.goto(base + RECIFE);
    await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
    assert.equal(Math.round((await box(page, '.map-frame')).width), 368);
    assert.equal(await noHorizontalScroll(page), true);
  } finally { await page.close(); }
});

test('the menu opens without JavaScript', async () => {
  const page = await open({ javaScriptEnabled: false, viewport: { width: 800, height: 900 } }, '/');
  try {
    await page.locator('.site-menu summary').click();
    assert.equal(await page.getByRole('navigation', { name: 'Menu' }).getByRole('link', { name: 'Municípios por UF' }).isVisible(), true);
  } finally { await page.close(); }
});

test('without JavaScript the map area points to the list by UF', async () => {
  const page = await open({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } }, '/');
  try {
    assert.equal(await page.locator('.map-frame').getByRole('link', { name: 'Consulte os municípios por UF' }).isVisible(), true);
    assert.equal(await page.getByText('Carregando o mapa').isVisible(), false);
    assert.equal(await page.locator('.data-feedback').isVisible(), false);
  } finally { await page.close(); }
});

test('above 1920 px the panel is 480 px, the selectors do not stretch and only the map grows', async () => {
  const page = await open({ viewport: { width: 2200, height: 1100 } }, RECIFE);
  try {
    await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
    assert.equal((await box(page, '#municipality-preview')).width, 480);
    assert.equal((await box(page, '#map-indicator')).width, 304);
    assert.equal(Math.round((await box(page, '.map-frame')).width), 2200 - 480);
  } finally { await page.close(); }
});

test('the list takes the map area and scrolls inside by keyboard, with the bars and the panel in view', async () => {
  const page = await open({ viewport: { width: 1280, height: 800 } }, RECIFE);
  try {
    await page.locator('[data-view="lista"]').click();
    await page.waitForFunction(() => document.querySelector('.indicator-table tbody')?.children.length > 0);
    const list = await box(page, '.indicator-table');
    assert.equal(list.bottom, 800);
    assert.equal(list.top, (await box(page, '.map-controls')).bottom);
    assert.equal((await box(page, '#municipality-preview')).top, list.top);
    const rows = page.locator('.indicator-table .scroll');
    await rows.focus();
    await page.keyboard.press('PageDown');
    await page.waitForFunction(() => document.querySelector('.indicator-table .scroll').scrollTop > 0);
    assert.equal(await page.evaluate(() => scrollY), 0, 'the page stays put');
  } finally { await page.close(); }
});

test('the panel scrolls inside by keyboard, and the footer is reached past the first screen', async () => {
  const page = await open({ viewport: { width: 1280, height: 800 } }, RECIFE);
  try {
    await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
    const panel = page.locator('#municipality-preview');
    await panel.focus();
    assert.equal(await panel.evaluate(element => element === document.activeElement), true);
    await page.keyboard.press('PageDown');
    await page.waitForFunction(() => document.querySelector('#municipality-preview').scrollTop > 0);
    assert.equal(await page.evaluate(() => scrollY), 0);
    await page.goto(base + '/');
    assert.ok((await box(page, 'footer')).top >= 800, 'the footer is outside the first screen');
    await page.keyboard.press('End');
    await page.waitForFunction(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 1);
    const footer = await box(page, 'footer');
    assert.ok(footer.bottom <= 801, 'footer in view');
    assert.equal((await box(page, '.construction-notice')).top, 0, 'the notice stays');
  } finally { await page.close(); }
});

test('a window shorter than the minimum scrolls the page and keeps the composition', async () => {
  const page = await open({ viewport: { width: 1280, height: 400 } }, '/');
  try {
    assert.equal(Math.round((await box(page, '.map-frame')).bottom), 520);
    assert.equal(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight), true);
  } finally { await page.close(); }
});

for (const javaScriptEnabled of [true, false]) {
  for (const colorScheme of ['light', 'dark']) {
    test(`the home map has no horizontal scroll at every width and zoom: ${colorScheme}, JavaScript ${javaScriptEnabled}`, async () => {
      for (const path of ['/', RECIFE]) {
        const page = await open({ javaScriptEnabled, colorScheme }, path);
        try {
          for (const width of [320, 768, 1024, 1280]) {
            await page.setViewportSize({ width, height: 900 });
            for (const zoom of ['100%', '200%']) {
              await page.locator('body').evaluate((element, value) => { element.style.zoom = value; }, zoom);
              assert.equal(await noHorizontalScroll(page), true, `${path}, ${width}px, zoom ${zoom}`);
            }
            await page.locator('body').evaluate(element => { element.style.zoom = '100%'; });
          }
        } finally { await page.close(); }
      }
    });
  }
}

for (const colorScheme of ['light', 'dark']) {
  test(`Tab walks header, bar, legend, panel and footer in reading order, with visible focus: ${colorScheme}`, async () => {
    const page = await open({ colorScheme, viewport: { width: 1280, height: 800 } }, RECIFE);
    try {
      await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
      await page.locator('#municipality-search:enabled').waitFor();
      const expected = ['#municipality-search', '#map-indicator', '[data-view="lista"]', '.legend-corner-more', '#municipality-preview', 'footer a'];
      const reached = [];
      for (let presses = 0; presses < 120 && reached.length < expected.length; presses++) {
        await page.keyboard.press('Tab');
        const focus = await page.evaluate(selector => {
          const element = document.activeElement;
          return { matches: element.matches(selector), visible: element.matches(':focus-visible') && getComputedStyle(element).outlineStyle !== 'none' };
        }, expected[reached.length]);
        if (focus.matches) {
          assert.equal(focus.visible, true, expected[reached.length]);
          reached.push(expected[reached.length]);
        }
      }
      assert.deepEqual(reached, expected);
      assert.ok((await box(page, 'footer a')).bottom <= 800, 'focus brought the footer into view');
    } finally { await page.close(); }
  });
}

test('a search with no match says so on screen', async () => {
  const page = await open({ viewport: { width: 1280, height: 800 } }, '/');
  try {
    await page.locator('#municipality-search:enabled').fill('zzzzz');
    assert.equal(await page.locator('#municipality-results').getByText('Nenhum município encontrado.').isVisible(), true);
  } finally { await page.close(); }
});

// Native zoom changes the media queries too, which the CSS zoom above does not.
test('native 200% zoom keeps the first screen usable in both themes, with and without JavaScript', async () => {
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
        await page.goto(base + RECIFE);
        await worker.evaluate(async base => {
          const tabs = await chrome.tabs.query({});
          await chrome.tabs.setZoom(tabs.find(tab => tab.url.startsWith(base)).id, 2);
        }, base);
        for (const [width, height] of [[640, 900], [1536, 864], [2560, 1440]]) {
          await page.setViewportSize({ width, height });
          assert.equal(await page.evaluate(() => innerWidth), width / 2);
          const where = `${width}px, ${colorScheme}, JavaScript ${javaScriptEnabled}`;
          assert.equal(await noHorizontalScroll(page), true, where);
          if (width / 2 < 768) continue;
          const bar = await box(page, '.map-controls');
          const map = await box(page, '.map-frame');
          assert.ok(map.top >= bar.bottom - 1, `map under the bar: ${where}`);
          assert.ok(map.height >= 192, `map keeps its floor: ${where}`);
        }
      } finally { await context.close(); }
    }
  }
});
