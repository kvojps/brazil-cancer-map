import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';

// The contract of the phone decision (.scratch/ui-polimento/issues/02-celular-cabecalho-filtros-mapa.md).
const base = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
const RECIFE = '/municipio/261160-recife/';
const CHROMIUM = process.env.CHROMIUM_PATH ?? '/snap/bin/chromium';

let browser;
before(async () => {
  browser = await chromium.launch({ executablePath: CHROMIUM, headless: true, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
});
after(async () => { await browser?.close(); });

const box = (page, selector) => page.locator(selector).first().evaluate(element => {
  const { left, top, right, bottom, width, height } = element.getBoundingClientRect();
  return { left, top, right, bottom, width, height };
});
const open = async (options, path = '/') => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, ...options });
  const page = await context.newPage();
  await page.goto(base + path);
  if (options.javaScriptEnabled !== false) await page.locator('.view-controls:not([hidden])').waitFor();
  page.on('close', () => { void context.close(); });
  return page;
};
const noHorizontalScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const filtersReady = page => page.locator('#map-indicator:enabled').waitFor({ state: 'attached' });
const searchReady = page => page.waitForFunction(() => !document.querySelector('#municipality-search').disabled);
const isFocused = locator => locator.evaluate(element => element === document.activeElement);

for (const javaScriptEnabled of [true, false]) {
  for (const [width, height] of [[390, 844], [390, 664], [320, 568]]) {
    test(`the map fills everything under the notice at ${width} × ${height}, JavaScript ${javaScriptEnabled}`, async () => {
      const page = await open({ javaScriptEnabled, viewport: { width, height } });
      try {
        const notice = await box(page, '.construction-notice');
        const map = await box(page, '.map-frame');
        assert.equal(notice.top, 0);
        assert.equal(map.top, notice.bottom);
        assert.equal(map.bottom, height);
        assert.equal(map.left, 0);
        assert.equal(map.right, width);
        assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY), 'hidden');
        assert.equal(await page.evaluate(() => document.documentElement.scrollHeight), height, 'the screen has nothing past it');
        assert.equal(await page.locator('footer').isVisible(), false);
      } finally { await page.close(); }
    });
  }
}

test('header, filters, legend and Mapa/Lista float over the map, in their corners', async () => {
  const page = await open({ viewport: { width: 390, height: 664 } });
  try {
    await page.locator('.legend-corner:not([hidden])').waitFor();
    const map = await box(page, '.map-frame');
    const header = await box(page, '.site-header');
    const filters = await box(page, '.filters-toggle');
    const legend = await box(page, '.legend-corner');
    const view = await box(page, '.view-controls');
    assert.equal(header.top, map.top + 8);
    assert.equal(header.height, 44);
    assert.equal(filters.top, header.bottom + 8);
    assert.equal(filters.height, 44);
    assert.equal(legend.left, 8);
    assert.equal(legend.bottom, map.bottom - 8);
    assert.equal(view.right, map.right - 8);
    assert.ok(view.bottom > legend.top, 'both in the lower corners');
    assert.equal(overlaps(legend, view), false);
    assert.ok(view.height >= 44);
    const text = await page.locator('.legend-corner').innerText();
    for (const part of [/Tendência \d{4}–\d{4}/, /Melhorando/, /Piorando/, /Estável/, /Sem direção clara/, /Dado insuficiente/, /Faixa C/]) assert.match(text, part);
    await page.locator('.legend-corner-more').click();
    assert.match(await page.locator('#legend-full').innerText(), /Origem e período dos dados/);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#legend-full').isVisible(), false);
  } finally { await page.close(); }
});

test('one finger moves the map and the screen stays put', async () => {
  const page = await open({ viewport: { width: 390, height: 664 } });
  try {
    await page.locator('.map-status').waitFor({ state: 'hidden', timeout: 60000 });
    await page.locator('.map canvas').waitFor();
    await page.waitForTimeout(1500);
    const clip = { x: 100, y: 200, width: 200, height: 250 };
    const initial = await page.screenshot({ clip });
    const touch = await page.context().newCDPSession(page);
    const point = (x, y) => ({ x, y, id: 1 });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(200, 400)] });
    for (let step = 1; step <= 8; step++) {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(200, 400 - step * 15)] });
    }
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(800);
    assert.equal(await page.evaluate(() => scrollY), 0, 'the page did not scroll');
    assert.notDeepEqual(await page.screenshot({ clip }), initial, 'the map moved');
  } finally { await page.close(); }
});

for (const javaScriptEnabled of [true, false]) {
  test(`the menu gathers pages, sources and code: JavaScript ${javaScriptEnabled}`, async () => {
    const page = await open({ javaScriptEnabled, viewport: { width: 320, height: 568 } });
    try {
      const menu = page.getByRole('navigation', { name: 'Menu' });
      assert.equal(await menu.isVisible(), false);
      await page.locator('.site-menu summary').click();
      for (const name of ['Mapa', 'Municípios por UF', 'Como calculamos', 'Fontes e condições de reutilização', 'Código-fonte']) {
        const link = menu.getByRole('link', { name, exact: true });
        assert.equal(await link.isVisible(), true, name);
        assert.ok((await link.boundingBox()).height >= 44, `${name}: touch target`);
      }
      // The explicit theme needs JavaScript; without it the site follows the system preference.
      assert.equal(await menu.locator('[data-theme-toggle]').isVisible(), javaScriptEnabled);
      assert.ok((await box(page, '.site-menu > nav')).bottom <= 568, 'the whole menu fits the screen');
    } finally { await page.close(); }
  });
}

test('the theme in the menu says what it does and switches', async () => {
  const page = await open({ colorScheme: 'light', viewport: { width: 390, height: 664 } });
  try {
    await page.locator('.site-menu summary').click();
    const toggle = page.getByRole('navigation', { name: 'Menu' }).locator('[data-theme-toggle]');
    assert.match(await toggle.innerText(), /Usar tema escuro/);
    await toggle.click();
    await page.waitForURL(/theme=dark/);
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await page.locator('.view-controls:not([hidden])').waitFor();
    await page.locator('.site-menu summary').click();
    assert.match(await page.getByRole('navigation', { name: 'Menu' }).locator('[data-theme-toggle]').innerText(), /Usar tema claro/);
  } finally { await page.close(); }
});

test('Filtros always names the current selection and its sheet changes the map live without being modal', async () => {
  const page = await open({ viewport: { width: 390, height: 844 } });
  try {
    await filtersReady(page);
    const toggle = page.locator('.filters-toggle');
    assert.match(await toggle.innerText(), /Filtros\s+Até 60 dias · Todos os cânceres · Tendência/);
    const sheet = page.locator('#map-filters');
    assert.equal(await sheet.isVisible(), false);
    await toggle.click();
    assert.equal(await sheet.isVisible(), true);
    const panel = await box(page, '#map-filters');
    assert.equal(panel.bottom, 844);
    assert.ok(panel.height <= 422, 'at most half of the screen');
    for (const selector of ['#map-indicator', '#map-reading', '#cancer-type']) {
      assert.equal((await box(page, selector)).height, 44, selector);
      assert.equal(await page.locator(selector).evaluate(element => element.tagName), 'SELECT');
    }
    await page.locator('#cancer-type').selectOption('breast');
    await page.waitForURL(/tipo=breast/);
    assert.match(await toggle.innerText(), /Até 60 dias · Mama · Tendência/);
    assert.equal(await sheet.isVisible(), true, 'stays open while the map changes');
    await page.locator('#map-reading').selectOption('status');
    await page.locator('.legend-corner [data-corner-mode="status"]').waitFor({ state: 'attached' });
    assert.match(await toggle.innerText(), /Mama · Como está hoje/);
    // Not modal: nothing dims or takes the taps over the rest of the map.
    assert.equal(await sheet.evaluate(element => element.matches(':modal')), false);
    assert.equal(await page.evaluate(() => document.elementFromPoint(200, 300).closest('.map') !== null), true);
    await page.getByRole('button', { name: 'Ver mapa' }).click();
    assert.equal(await sheet.isVisible(), false);
    assert.equal(await isFocused(toggle), true);
  } finally { await page.close(); }
});

test('the sheet gives way to the menu and the search, which it would otherwise cover', async () => {
  const page = await open({ viewport: { width: 320, height: 568 } });
  try {
    await searchReady(page);
    const sheet = page.locator('#map-filters');
    await page.locator('.filters-toggle').click();
    await page.locator('.site-menu summary').click();
    assert.equal(await sheet.isVisible(), false);
    const last = page.getByRole('navigation', { name: 'Menu' }).locator('[data-theme-toggle]');
    await last.click({ trial: true });
    await page.locator('.site-menu summary').click();
    await page.locator('.filters-toggle').click();
    await page.locator('.search-toggle').click();
    assert.equal(await sheet.isVisible(), false);
  } finally { await page.close(); }
});

test('Escape closes the sheet and returns to Filtros', async () => {
  const page = await open({ viewport: { width: 390, height: 664 } });
  try {
    await filtersReady(page);
    await page.locator('.filters-toggle').focus();
    await page.keyboard.press('Enter');
    await page.locator('#map-indicator').focus();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#map-filters').isVisible(), false);
    assert.equal(await isFocused(page.locator('.filters-toggle')), true);
  } finally { await page.close(); }
});

test('the sheet keeps Ver mapa in reach at 320 × 568', async () => {
  const page = await open({ viewport: { width: 320, height: 568 } });
  try {
    await page.locator('.filters-toggle').click();
    const sheet = await box(page, '#map-filters');
    assert.ok(sheet.height <= 284);
    assert.ok((await box(page, '.filters-close')).bottom <= 568);
    assert.ok(sheet.top >= (await box(page, '.filters-toggle')).bottom, 'the button that closes it stays visible');
  } finally { await page.close(); }
});

for (const colorScheme of ['light', 'dark']) {
  test(`without JavaScript the sheet opens with disabled selectors, a notice and the list by UF: ${colorScheme}`, async () => {
    const page = await open({ javaScriptEnabled: false, colorScheme, viewport: { width: 390, height: 664 } });
    try {
      assert.match(await page.locator('.filters-toggle').innerText(), /Até 60 dias · Todos os cânceres · Tendência/);
      assert.equal(await page.locator('.map-frame').getByRole('link', { name: 'Consulte os municípios por UF' }).isVisible(), true);
      assert.equal(await page.getByText('Carregando o mapa').isVisible(), false);
      await page.locator('.filters-toggle').click();
      for (const selector of ['#map-indicator', '#map-reading', '#cancer-type']) {
        assert.equal(await page.locator(selector).isVisible(), true, selector);
        assert.equal(await page.locator(selector).isDisabled(), true, selector);
      }
      const sheet = page.locator('#map-filters');
      assert.match(await sheet.innerText(), /precisam de JavaScript/);
      assert.equal(await sheet.getByRole('link', { name: 'Consulte os municípios por UF' }).isVisible(), true);
      assert.equal(await page.getByRole('button', { name: 'Ver mapa' }).isVisible(), false);
      await page.locator('.filters-toggle').click();
      assert.equal(await sheet.isVisible(), false);
      assert.equal(await page.locator('.search-toggle').getAttribute('href'), '/municipios/');
    } finally { await page.close(); }
  });
}

test('without JavaScript a municipality page scrolls to its profile and the footer', async () => {
  const page = await open({ javaScriptEnabled: false, viewport: { width: 390, height: 664 } }, RECIFE);
  try {
    await page.locator('#municipality-content .profile').scrollIntoViewIfNeeded();
    assert.ok(await page.evaluate(() => scrollY) > 0);
    assert.equal((await box(page, '.construction-notice')).top, 0);
    assert.equal(await page.locator('footer').isVisible(), true);
    assert.equal(await noHorizontalScroll(page), true);
  } finally { await page.close(); }
});

test('the search expands over the header and closes when a municipality is chosen', async () => {
  const page = await open({ viewport: { width: 390, height: 664 } });
  try {
    const input = page.locator('#municipality-search');
    await searchReady(page);
    assert.equal(await input.isVisible(), false);
    await page.locator('.search-toggle').click();
    assert.equal(await isFocused(input), true);
    const field = await box(page, '#municipality-search');
    const header = await box(page, '.site-header');
    assert.equal(field.left, header.left);
    assert.equal(field.right, header.right);
    assert.equal(field.height, 44);
    await input.fill('recife pe');
    assert.equal(await page.locator('#search-status').textContent(), '1 município encontrado.');
    const result = page.locator('#municipality-results button').first();
    assert.ok((await result.boundingBox()).height >= 44);
    await result.click();
    assert.equal(await input.isVisible(), false);
    assert.equal(await isFocused(page.locator('#preview-heading')), true, 'focus goes to the name of the municipality');
    await page.waitForURL(/\/municipio\/261160-recife\//);
    await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
    await page.locator('[data-clear-profile]').click();
    assert.equal(await isFocused(page.locator('.search-toggle')), true, 'clearing has somewhere visible to return');
  } finally { await page.close(); }
});

test('the search closes by its button and by Escape, and says when there is nothing', async () => {
  const page = await open({ viewport: { width: 320, height: 568 } });
  try {
    await searchReady(page);
    const input = page.locator('#municipality-search');
    await page.locator('.search-toggle').click();
    await page.getByRole('button', { name: 'Fechar a busca' }).click();
    assert.equal(await input.isVisible(), false);
    await page.locator('.search-toggle').click();
    await input.fill('zzzzz');
    assert.equal(await page.locator('#municipality-results').getByText('Nenhum município encontrado.').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await input.isVisible(), false);
    assert.equal(await isFocused(page.locator('.search-toggle')), true);
  } finally { await page.close(); }
});

// Chromium emulation shows no virtual keyboard, so the keyboard is a typical height over the same layout.
for (const [width, height, keyboard] of [[320, 568, 260], [360, 640, 280], [390, 844, 300]]) {
  test(`with a virtual keyboard open at ${width} × ${height} the field and results stay above it`, async () => {
    const page = await open({ viewport: { width, height } });
    try {
      await searchReady(page);
      await page.locator('.search-toggle').click();
      await page.locator('#municipality-search').fill('sao');
      assert.equal(await page.locator('#municipality-results').evaluate(element => getComputedStyle(element).overflowY), 'auto');
      assert.ok((await box(page, '#municipality-results')).bottom <= height - keyboard, 'all the results, scrolling inside');
      assert.equal(await page.evaluate(() => document.documentElement.scrollHeight), height);
    } finally { await page.close(); }
  });
}

test('the list scrolls normally with the notice on top, Mapa/Lista fixed and the footer at the end', async () => {
  const page = await open({ viewport: { width: 390, height: 664 } });
  try {
    await page.locator('[data-view="lista"]').click();
    await page.waitForFunction(() => document.querySelector('.indicator-table tbody')?.children.length > 0);
    const heading = await box(page, '#list-heading');
    assert.ok(heading.top >= (await box(page, '.filters-toggle')).bottom, 'the floating controls leave the list heading free');
    const fixed = await box(page, '.view-controls');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForFunction(() => scrollY > 0);
    assert.equal((await box(page, '.construction-notice')).top, 0);
    assert.deepEqual(await box(page, '.view-controls'), fixed);
    assert.ok((await box(page, 'footer')).bottom <= 665, 'the footer is reached');
    assert.equal(await noHorizontalScroll(page), true);
    await page.locator('[data-view="mapa"]').click();
    assert.equal(await page.evaluate(() => scrollY), 0, 'the map screen is back without scroll');
    assert.equal(await page.locator('footer').isVisible(), false);
  } finally { await page.close(); }
});

test('a caveat floats under Filtros and follows its height', async () => {
  const page = await open({ viewport: { width: 320, height: 568 } });
  try {
    await filtersReady(page);
    await page.locator('.filters-toggle').click();
    await page.locator('#cancer-type').selectOption('prostate');
    await page.locator('#map-indicator').selectOption('mortality');
    await page.getByRole('button', { name: 'Ver mapa' }).click();
    await page.locator('#indicator-caveat').waitFor();
    assert.ok((await box(page, '.map-notes')).top >= (await box(page, '.filters-toggle')).bottom);
    assert.equal(await noHorizontalScroll(page), true);
  } finally { await page.close(); }
});

test('the full legend is one button away above the sheet, and the notice is never covered', async () => {
  const page = await open({ viewport: { width: 390, height: 664 } }, RECIFE);
  try {
    await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
    const panel = await box(page, '#municipality-preview');
    assert.ok((await box(page, '.view-controls')).bottom <= panel.top, 'Mapa/Lista above the sheet');
    assert.ok((await box(page, '[data-panel-legend]')).bottom <= panel.top, 'Legenda above the sheet');
    assert.ok(panel.top >= (await box(page, '.construction-notice')).bottom, 'the notice is never covered');
    await page.locator('[data-panel-legend]').click();
    assert.match(await page.locator('#legend-full').innerText(), /Origem e período dos dados/);
  } finally { await page.close(); }
});

test('the collapsed panel leaves Filtros readable on a short screen', async () => {
  const page = await open({ viewport: { width: 320, height: 568 } }, RECIFE);
  try {
    await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
    const filters = await box(page, '.filters-toggle');
    assert.equal(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y).closest('.filters-toggle') !== null, { x: filters.left + 100, y: filters.bottom - 4 }), true);
    await page.locator('.filters-toggle').click();
    assert.equal(await page.locator('#map-filters').isVisible(), true);
  } finally { await page.close(); }
});

for (const javaScriptEnabled of [true, false]) {
  for (const [width, height] of [[195, 422], [160, 450], [320, 450], [640, 400]]) {
    test(`at ${width} × ${height}, as under 200% zoom, the controls leave the map: JavaScript ${javaScriptEnabled}`, async () => {
      const page = await open({ javaScriptEnabled, viewport: { width, height } });
      try {
        const map = await box(page, '.map-frame');
        assert.ok(map.height >= 200, 'the map keeps a usable height');
        const others = ['.site-header', '#map-indicator', '#map-reading', '#cancer-type', '.legend-corner'];
        if (javaScriptEnabled) others.push('.view-controls');
        for (const selector of others) assert.equal(overlaps(await box(page, selector), map), false, selector);
        assert.equal(await page.locator('.filters-toggle').isVisible(), false, 'nothing to squeeze');
        assert.equal(await page.locator('#municipality-search').isVisible(), true);
        assert.equal(await noHorizontalScroll(page), true);
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForFunction(() => scrollY > 0);
        assert.equal((await box(page, '.construction-notice')).top, 0);
        assert.equal(await page.locator('footer').isVisible(), true);
      } finally { await page.close(); }
    });
  }
}

for (const colorScheme of ['light', 'dark']) {
  test(`Tab walks the floating controls in order, with visible focus and no scroll: ${colorScheme}`, async () => {
    const context = await browser.newContext({ colorScheme, viewport: { width: 390, height: 664 } });
    const page = await context.newPage();
    try {
      await page.goto(base + '/');
      await page.locator('.view-controls:not([hidden])').waitFor();
      await filtersReady(page);
      const expected = ['.site-menu summary', '.identity', '.search-toggle', '.filters-toggle', '[data-view="lista"]', '.legend-corner-more'];
      const reached = [];
      for (let presses = 0; presses < 30 && reached.length < expected.length; presses++) {
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
      assert.equal(await page.evaluate(() => scrollY), 0);
    } finally { await context.close(); }
  });
}

for (const javaScriptEnabled of [true, false]) {
  for (const colorScheme of ['light', 'dark']) {
    test(`no horizontal scroll at the phone sizes with the menu and sheet open: ${colorScheme}, JavaScript ${javaScriptEnabled}`, async () => {
      const page = await open({ javaScriptEnabled, colorScheme, viewport: { width: 320, height: 568 } });
      try {
        await page.locator('.site-menu summary').click();
        assert.equal(await noHorizontalScroll(page), true, 'menu');
        await page.locator('.site-menu summary').click();
        await page.locator('.filters-toggle').click();
        assert.equal(await noHorizontalScroll(page), true, 'sheet');
        for (const [width, height] of [[390, 844], [768, 1024], [1280, 800]]) {
          await page.setViewportSize({ width, height });
          assert.equal(await noHorizontalScroll(page), true, `${width}px`);
        }
      } finally { await page.close(); }
    });
  }
}

test('from 768 px there is no sheet: the selectors stay in the bar and the extra menu links leave', async () => {
  const context = await browser.newContext({ viewport: { width: 800, height: 900 } });
  const page = await context.newPage();
  try {
    await page.goto(base + '/');
    assert.equal(await page.locator('.filters-toggle').isVisible(), false);
    assert.equal(await page.locator('.search-toggle').isVisible(), false);
    assert.equal(await page.locator('#map-indicator').isVisible(), true);
    assert.equal(await page.locator('#municipality-search').isVisible(), true);
    assert.equal(await page.getByRole('button', { name: 'Ver mapa' }).isVisible(), false);
    await page.locator('.site-menu summary').click();
    assert.equal(await page.getByRole('navigation', { name: 'Menu' }).getByRole('link', { name: 'Código-fonte' }).isVisible(), false);
  } finally { await context.close(); }
});

// Native zoom changes the media queries too, which a smaller viewport alone only stands in for.
test('native 200% zoom on a phone takes the controls off the map in both themes, with and without JavaScript', async () => {
  const extension = fileURLToPath(new URL('./zoom-extension', import.meta.url));
  for (const javaScriptEnabled of [false, true]) {
    for (const colorScheme of ['light', 'dark']) {
      const context = await chromium.launchPersistentContext('', {
        executablePath: CHROMIUM,
        headless: true, javaScriptEnabled, colorScheme,
        ignoreDefaultArgs: ['--disable-extensions'],
        args: ['--no-sandbox', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
      });
      try {
        const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
        const page = await context.newPage();
        await page.goto(base + '/');
        await worker.evaluate(async base => {
          const tabs = await chrome.tabs.query({});
          await chrome.tabs.setZoom(tabs.find(tab => tab.url.startsWith(base)).id, 2);
        }, base);
        for (const [width, height] of [[390, 844], [320, 568]]) {
          await page.setViewportSize({ width, height });
          assert.equal(await page.evaluate(() => innerWidth), width / 2);
          const where = `${width} × ${height}, ${colorScheme}, JavaScript ${javaScriptEnabled}`;
          assert.equal(await noHorizontalScroll(page), true, where);
          assert.equal(await page.locator('.filters-toggle').isVisible(), false, where);
          const map = await box(page, '.map-frame');
          for (const selector of ['.site-header', '#map-indicator', '.legend-corner']) assert.equal(overlaps(await box(page, selector), map), false, `${selector}: ${where}`);
        }
      } finally { await context.close(); }
    }
  }
});
