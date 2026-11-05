import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';

// The contract of the Lista decision (.scratch/ui-polimento/issues/06-lista-ufs-metodologia.md).
const base = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
const CHROMIUM = process.env.CHROMIUM_PATH ?? '/snap/bin/chromium';
const BALSAS = '/municipio/210140-balsas/';
const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

let browser;
before(async () => {
  browser = await chromium.launch({ executablePath: CHROMIUM, headless: true, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
});
after(async () => { await browser?.close(); });

const box = (page, selector) => page.locator(selector).first().evaluate(element => {
  const { left, top, right, bottom, width, height } = element.getBoundingClientRect();
  return { left, top, right, bottom, width, height };
});
const open = async (viewport, { path = '/', query = '', uf = 'MA', colorScheme = 'light' } = {}) => {
  const touch = viewport.width < 768;
  const context = await browser.newContext({ viewport, colorScheme, hasTouch: touch, isMobile: touch });
  const page = await context.newPage();
  page.on('close', () => { void context.close(); });
  await page.goto(`${base}${path}?visualizacao=lista${query}`);
  await page.waitForFunction(() => document.querySelector('.indicator-table tbody')?.children.length > 0);
  if (uf) await page.locator('.indicator-table select').selectOption(uf);
  return page;
};
const row = (page, name) => page.locator('.indicator-table tbody tr').filter({ has: page.getByRole('link', { name, exact: true }) });
const toggle = (page, name) => page.getByRole('button', { name: `Mais dados de ${name}`, exact: true });
const isNarrow = page => page.locator('.indicator-table thead').evaluate(element => getComputedStyle(element).position === 'absolute');
const noHorizontalScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
/** The data columns of a row that are on the screen. */
const visibleCells = (page, name) => row(page, name).locator('th, td').evaluateAll(cells => cells
  .filter(cell => cell.getBoundingClientRect().height > 0)
  .map(cell => cell.dataset.column));

test('narrow: a closed row has name, class with swatch, Faixa C and value, and the chevron opens the rest in place', async () => {
  const page = await open(PHONE);
  try {
    assert.equal(await isNarrow(page), true);
    assert.deepEqual(await visibleCells(page, 'Balsas'), ['name', 'trend', 'value', 'more']);
    const reading = row(page, 'Balsas').locator('[data-reading]');
    assert.match(await reading.innerText(), /Sem direção clara\s+Faixa C/);
    const swatch = await reading.locator('.row-swatch').evaluate(element => getComputedStyle(element).backgroundImage);
    assert.match(swatch, /repeating-linear-gradient/, 'the texture of the map');
    assert.equal(await row(page, 'Balsas').locator('[data-column="value"]').evaluate(element => getComputedStyle(element).fontSize), '20px');

    const control = toggle(page, 'Balsas');
    assert.equal(await control.getAttribute('aria-expanded'), 'false');
    assert.ok((await control.boundingBox()).height >= 44, 'a touch target');
    await control.click();
    assert.equal(await control.getAttribute('aria-expanded'), 'true');
    const opened = await row(page, 'Balsas').innerText();
    for (const expected of [/UF: MA/, /Situação: /, /Sem informação de tratamento: /, /Origem do dado: /, /Qualidade do registro na UF: Faixa C/]) {
      assert.match(opened, expected);
    }
    await control.click();
    assert.equal(await control.getAttribute('aria-expanded'), 'false');
    assert.deepEqual(await visibleCells(page, 'Balsas'), ['name', 'trend', 'value', 'more']);
  } finally { await page.close(); }
});

test('narrow: labels are real text, and a row stays open when the reading changes', async () => {
  const page = await open(PHONE);
  try {
    await toggle(page, 'Balsas').click();
    const label = row(page, 'Balsas').locator('[data-column="origin"] .cell-label');
    assert.equal(await label.textContent(), 'Origem do dado: ');
    assert.equal(await label.evaluate(element => getComputedStyle(element, '::before').content), 'none');
    await page.locator('.indicator-table select').selectOption('');
    await page.locator('.indicator-table select').selectOption('MA');
    assert.equal(await toggle(page, 'Balsas').getAttribute('aria-expanded'), 'true');
  } finally { await page.close(); }
});

test('the name opens Meu município from a row', async () => {
  const page = await open(PHONE);
  try {
    await page.getByRole('link', { name: 'Balsas', exact: true }).click();
    await page.waitForURL('**/municipio/210140-balsas/**');
    await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
    assert.match(await page.locator('#preview-heading').textContent(), /Balsas/);
  } finally { await page.close(); }
});

test('the form follows the width of the list, not of the window', async () => {
  const wideWindow = await open(DESKTOP, { path: BALSAS });
  try {
    assert.ok((await box(wideWindow, '.indicator-table')).width >= 640);
    assert.equal(await isNarrow(wideWindow), false, 'wide at 1280 px with the panel open');
  } finally { await wideWindow.close(); }
  const panelOpen = await open({ width: 768, height: 900 }, { path: BALSAS });
  try {
    assert.ok((await box(panelOpen, '.indicator-table')).width < 640);
    assert.equal(await isNarrow(panelOpen), true, 'narrow at 768 px with the panel open');
    await toggle(panelOpen, 'Balsas').click();
    assert.equal(await toggle(panelOpen, 'Balsas').getAttribute('aria-expanded'), 'true');
    assert.equal(await panelOpen.evaluate(() => scrollY), 0, 'rows scroll inside, also in this form');
  } finally { await panelOpen.close(); }
  const noPanel = await open({ width: 768, height: 900 });
  try {
    assert.equal(await isNarrow(noPanel), false, 'wide at 768 px with no panel');
  } finally { await noPanel.close(); }
  const justWide = await open({ width: 640, height: 900 });
  try {
    assert.equal((await box(justWide, '.indicator-table')).width, 640);
    assert.equal(await isNarrow(justWide), false, 'at exactly 640 px it is already wide');
  } finally { await justWide.close(); }
  const justNarrow = await open({ width: 639, height: 900 });
  try {
    assert.equal(await isNarrow(justNarrow), true);
  } finally { await justNarrow.close(); }
});

test('wide: a table scrolling inside the map area, with its header and municipality fixed, filters and panel in view', async () => {
  const page = await open(DESKTOP, { path: BALSAS, uf: '' });
  try {
    const list = await box(page, '.indicator-table');
    assert.equal(list.bottom, DESKTOP.height);
    assert.equal(list.top, (await box(page, '.map-controls')).bottom);
    const controls = await box(page, '.map-controls');
    const panel = await box(page, '#municipality-preview');
    await page.locator('.indicator-table .scroll').evaluate(element => { element.scrollTo(300, 900); });
    await page.waitForFunction(() => document.querySelector('.indicator-table .scroll').scrollTop > 0);
    assert.equal(await page.evaluate(() => scrollY), 0, 'the page stays put');
    assert.deepEqual(await box(page, '.map-controls'), controls);
    assert.deepEqual(await box(page, '#municipality-preview'), panel);
    const scroller = await box(page, '.indicator-table .scroll');
    assert.equal((await box(page, '.indicator-table thead th')).top, scroller.top, 'header fixed');
    const name = await page.locator('.indicator-table tbody th').nth(30).boundingBox();
    assert.equal(name.x, scroller.left, 'municipality fixed');
    assert.equal(await page.locator('.indicator-table [data-column="more"]').first().isVisible(), false, 'nothing to open: every field is in the table');
    assert.equal(await page.locator('.indicator-table thead').evaluate(element => getComputedStyle(element).position), 'static');
    const value = page.locator('.indicator-table tbody td[data-column="value"]').first();
    assert.equal(await value.evaluate(element => getComputedStyle(element).textAlign), 'right');
    assert.match(await value.evaluate(element => getComputedStyle(element).fontVariantNumeric), /tabular-nums/);
  } finally { await page.close(); }
});

test('wide at 1280 px with the panel open: no column is cut, the last ones in the inner scroll', async () => {
  const page = await open(DESKTOP, { path: BALSAS });
  try {
    const widths = await page.locator('.indicator-table thead th').evaluateAll(cells => cells
      .filter(cell => cell.getBoundingClientRect().width > 0)
      .map(cell => [cell.dataset.column, cell.getBoundingClientRect().width]));
    assert.deepEqual(widths.map(([column]) => column), ['name', 'uf', 'trend', 'status', 'note', 'value', 'missing', 'origin', 'quality']);
    for (const [column, width] of widths) assert.ok(width >= 40, `${column}: ${width}`);
    const scroller = page.locator('.indicator-table .scroll');
    await scroller.evaluate(element => { element.scrollLeft = element.scrollWidth; });
    const last = await box(page, '.indicator-table thead [data-column="quality"]');
    assert.ok(last.right <= (await box(page, '.indicator-table .scroll')).right + 1, 'the last column is reachable');
    assert.ok(last.right <= (await box(page, '#municipality-preview')).left + 1, 'and clear of the panel');
    assert.equal(await noHorizontalScroll(page), true);
  } finally { await page.close(); }
});

test('phone: UF and count stay fixed on scrolling, as do Mapa/Lista and the notice, and the rest leaves', async () => {
  const page = await open(PHONE, { uf: '' });
  try {
    const switcher = await box(page, '.view-controls');
    await page.evaluate(() => window.scrollTo(0, 3000));
    await page.waitForFunction(() => scrollY > 0);
    const notice = await box(page, '.construction-notice');
    assert.equal(notice.top, 0);
    assert.equal((await box(page, '.list-bar')).top, notice.bottom, 'the bar under the notice');
    assert.deepEqual(await box(page, '.view-controls'), switcher);
    assert.ok((await box(page, '.filters-toggle')).bottom <= 0, 'Filtros leave the view');
    assert.ok((await box(page, '.site-header')).bottom <= 0, 'the header leaves the view');
    assert.equal(await noHorizontalScroll(page), true);
  } finally { await page.close(); }
});

test('the period stays in view and the long paragraph is in Como ler esta lista, with the warning of band C', async () => {
  const page = await open(PHONE);
  try {
    assert.match(await page.locator('.table-lede').innerText(), /^Tendência de \d{4}–\d{4} · valor de \d{4}$/);
    const paragraph = page.locator('.table-description');
    assert.equal(await paragraph.isVisible(), false);
    assert.match(await paragraph.textContent(), /Na faixa C: Muitos casos estão sem informação de tratamento/);
    await page.getByText('Como ler esta lista').click();
    assert.equal(await paragraph.isVisible(), true);
    await page.locator('#map-reading').evaluate(element => { element.value = 'status'; element.dispatchEvent(new Event('change', { bubbles: true })); });
    await page.waitForFunction(() => /^Referência/.test(document.querySelector('.table-lede').textContent));
    assert.match(await page.locator('.table-lede').innerText(), /^Referência: .+ · valor de \d{4}$/);
  } finally { await page.close(); }
});

for (const [form, viewport] of [['narrow', PHONE], ['wide', DESKTOP]]) {
  test(`${form}: the browser still exposes a table, with each cell of a closed row answering to its column`, async () => {
    const page = await open(viewport);
    const session = await page.context().newCDPSession(page);
    try {
      await session.send('Accessibility.enable');
      const { nodes } = await session.send('Accessibility.getFullAXTree');
      const roles = nodes.filter(node => !node.ignored).map(node => node.role?.value);
      for (const role of ['table', 'rowgroup', 'row', 'columnheader', 'rowheader', 'cell']) assert.ok(roles.includes(role), `${role} in the tree`);
      const headers = page.getByRole('columnheader');
      assert.equal(await headers.filter({ hasText: 'Tendência' }).getAttribute('aria-colindex'), '3');
      const cells = row(page, 'Balsas').locator('th, td');
      assert.deepEqual(await cells.evaluateAll(all => all.map(cell => [cell.dataset.column, cell.getAttribute('aria-colindex')])), [
        ['name', '1'], ['uf', '2'], ['trend', '3'], ['status', '4'], ['note', '5'], ['value', '6'], ['missing', '7'], ['origin', '8'], ['quality', '9'], ['more', '10'],
      ]);
      assert.equal(await row(page, 'Balsas').locator('th').getAttribute('role'), 'rowheader');
      assert.equal(await page.locator('#list-heading').evaluate(element => element.getBoundingClientRect().height <= 1), true, 'the titles are for screen readers only');
      assert.equal(await page.locator('.indicator-table caption').evaluate(element => element.getBoundingClientRect().height <= 1), true);
    } finally { await page.close(); }
  });
}

test('a phone sheet covers neither the last rows nor Mapa/Lista, also with a row open', async () => {
  const page = await open(PHONE, { path: BALSAS });
  try {
    const sheet = await box(page, '#municipality-preview');
    assert.ok((await box(page, '.view-controls')).bottom <= sheet.top, 'Mapa/Lista above the sheet');
    const last = page.locator('.indicator-table tbody tr').last();
    await last.locator('[data-row-toggle]').evaluate(element => element.click());
    await page.evaluate(() => window.scrollTo(0, document.querySelector('.indicator-table').getBoundingClientRect().bottom + scrollY - innerHeight));
    await page.waitForFunction(() => scrollY > 0);
    assert.ok((await last.boundingBox()).y + (await last.boundingBox()).height <= (await box(page, '#municipality-preview')).top + 1, 'the last row ends above the sheet');
  } finally { await page.close(); }
});

test('the rows of the keyboard stay clear of the fixed parts', async () => {
  const page = await open(PHONE, { path: BALSAS, uf: 'MA' });
  try {
    const control = toggle(page, 'Balsas');
    await control.focus();
    const focused = await control.boundingBox();
    assert.ok(focused.y >= (await box(page, '.list-bar')).bottom - 1, 'not under the bar');
    assert.ok(focused.y + focused.height <= (await box(page, '#municipality-preview')).top + 1, 'not under the sheet');
    await page.keyboard.press('Enter');
    assert.equal(await control.getAttribute('aria-expanded'), 'true');
    assert.equal(await control.evaluate(element => element === document.activeElement), true);
    const outline = await control.evaluate(element => getComputedStyle(element).outlineStyle);
    assert.equal(outline, 'solid', 'focus is visible');
  } finally { await page.close(); }
});

test('at 320 px the bar stays on one line with all the UFs, and focus moving up never lands under it', async () => {
  const page = await open({ width: 320, height: 568 }, { uf: '' });
  try {
    const bar = await box(page, '.list-bar');
    assert.ok(bar.height <= 56, `the bar is ${bar.height} px tall`);
    assert.ok((await box(page, '.table-count')).height <= 24, 'the count on one line');
    assert.ok((await box(page, '.table-count')).right <= 320, 'and inside the screen');
    assert.equal(await page.locator('.list-bar label').evaluate(element => {
      const text = document.createRange();
      text.selectNodeContents(element.firstChild);
      return text.getClientRects().length;
    }), 1, 'UF on one line');
    const toggles = page.locator('.indicator-table [data-row-toggle]');
    await toggles.nth(12).focus();
    for (let step = 0; step < 12; step++) {
      await page.keyboard.press('Shift+Tab');
      const focused = await page.evaluate(() => {
        const { left, top, width, height } = document.activeElement.getBoundingClientRect();
        const hit = document.elementFromPoint(left + width / 2, top + height / 2);
        return hit === document.activeElement || document.activeElement.contains(hit);
      });
      assert.equal(focused, true, `step ${step}`);
    }
  } finally { await page.close(); }
});

test('rows are ordered by UF and name, never by value', async () => {
  const page = await open(PHONE, { uf: '' });
  try {
    const rows = await page.locator('.indicator-table tbody tr').evaluateAll(all => all.map(row => [
      row.querySelector('[data-column="uf"]').textContent.replace('UF: ', ''),
      row.querySelector('th').textContent,
    ]));
    const collator = new Intl.Collator('pt-BR');
    const sorted = [...rows].sort((a, b) => collator.compare(a[0], b[0]) || collator.compare(a[1], b[1]));
    assert.deepEqual(rows, sorted);
    const { municipalities } = await (await page.request.get(`${base}/dados/municipalities.json`)).json();
    assert.equal(rows.length, municipalities.length);
  } finally { await page.close(); }
});

test('prostate has no Situação, and mortality reads only as Tendência', async () => {
  const prostate = await open(PHONE, { query: '&tipo=prostate' });
  try {
    assert.deepEqual(await visibleCells(prostate, 'Balsas'), ['name', 'trend', 'value', 'more']);
    await toggle(prostate, 'Balsas').click();
    assert.match(await row(prostate, 'Balsas').innerText(), /Situação: Não se aplica/);
    assert.match(await prostate.locator('.table-lede').innerText(), /^Tendência de/);
  } finally { await prostate.close(); }
  const mortality = await open(PHONE, { query: '&indicador=mortality' });
  try {
    assert.deepEqual(await visibleCells(mortality, 'Balsas'), ['name', 'trend', 'value', 'more']);
    assert.match(await mortality.locator('.table-lede').innerText(), /^Tendência de/);
    await toggle(mortality, 'Balsas').click();
    const opened = await row(mortality, 'Balsas').innerText();
    assert.match(opened, /Situação: Não se aplica/);
    assert.doesNotMatch(opened, /Sem informação de tratamento|Qualidade do registro/, 'treatment fields only on treatment');
    assert.equal(await noHorizontalScroll(mortality), true);
    const value = row(mortality, 'Balsas').locator('[data-column="value"]');
    assert.equal(await value.locator('.value-unit').evaluate(element => getComputedStyle(element).display), 'block', 'the unit goes under the number');
    assert.match(await value.textContent(), /^\d+,\d+ por 100 mil$/);
  } finally { await mortality.close(); }
});

test('HPV has no Tendência: its row reads as Situação, without inventing a trend class', async () => {
  const page = await browser.newPage({ viewport: PHONE });
  try {
    // No UF has HPV published yet, so the layer is built here, on the real municipalities.
    const source = await (await page.request.get(`${base}/dados/map/within_60_days/all.json`)).json();
    await page.route('**/map/hpv/*.json', route => route.fulfill({ json: {
      ...source, indicator: 'hpv', period: { ...source.period, trend: [] }, quality: undefined, has_status: true,
      reference: { value: 90, label: 'meta' },
      municipalities: { 210140: { origin: 'municipality', trend: null, status: 'near', value: 72.4, status_note: null, without_treatment_info: null, quality_band: null, series_id: null } },
    } }));
    await page.goto(`${base}/?visualizacao=lista&indicador=hpv&modo=hoje`);
    await page.waitForFunction(() => document.querySelector('.indicator-table tbody')?.children.length > 0);
    await page.locator('.indicator-table select').selectOption('MA');
    assert.deepEqual(await visibleCells(page, 'Balsas'), ['name', 'status', 'value', 'more']);
    await toggle(page, 'Balsas').click();
    const opened = await row(page, 'Balsas').innerText();
    assert.match(opened, /Perto/);
    assert.match(opened, /Tendência: Série curta, ainda sem direção/);
    assert.doesNotMatch(await page.locator('.table-lede').innerText(), /Tendência/);
    assert.doesNotMatch(await page.locator('.table-description').textContent(), /Período da Tendência/, 'no empty sentence');
  } finally { await page.close(); }
});

test('a layer that fails to load leaves no rows and offers a new try', async () => {
  for (const viewport of [PHONE, DESKTOP]) {
    const page = await browser.newPage({ viewport });
    let fail = true;
    try {
      await page.route('**/map/within_60_days/breast.json', route => fail ? route.fulfill({ status: 503, body: '' }) : route.continue());
      await page.goto(`${base}/?visualizacao=lista&tipo=breast`);
      await page.locator('#retry-data').waitFor();
      assert.equal(await page.locator('.indicator-table tbody tr').count(), 0);
      assert.equal(await page.locator('.table-lede').isVisible(), false);
      assert.match(await page.locator('.table-count').innerText(), /Sem resultados/);
      assert.equal(await noHorizontalScroll(page), true);
      const message = await box(page, '.data-feedback');
      const bar = await box(page, '.list-bar');
      assert.ok(message.top >= bar.bottom || message.bottom <= bar.top, 'the message leaves the bar free');
      fail = false;
      await page.locator('#retry-data').click();
      await page.waitForFunction(() => document.querySelector('.indicator-table tbody')?.children.length > 0);
      assert.equal(await page.locator('.table-lede').isVisible(), true);
    } finally { await page.close(); }
  }
});

for (const colorScheme of ['light', 'dark']) {
  for (const [width, height] of [[320, 568], [768, 900], [1280, 800]]) {
    test(`no horizontal scroll outside the table at ${width} px in ${colorScheme}, with a row open`, async () => {
      for (const path of ['/', BALSAS]) {
        const page = await open({ width, height }, { path, colorScheme });
        try {
          if (await isNarrow(page)) await toggle(page, 'Alcântara').click();
          await page.getByText('Como ler esta lista').click();
          assert.equal(await noHorizontalScroll(page), true, path);
          await page.locator('body').evaluate(element => { element.style.zoom = '200%'; });
          assert.equal(await noHorizontalScroll(page), true, `${path} at 200%`);
        } finally { await page.close(); }
      }
    });
  }
}

test('without JavaScript the list is not offered and Municípios por UF is the way out', async () => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: PHONE });
  const page = await context.newPage();
  try {
    await page.goto(`${base}/?visualizacao=lista`);
    assert.equal(await page.locator('.indicator-table').isVisible(), false);
    assert.equal(await page.locator('.view-controls').isVisible(), false);
    const link = page.locator('a[href*="/municipios/"]').first();
    assert.equal(new URL(await link.getAttribute('href'), base).pathname, '/municipios/');
  } finally { await context.close(); }
});

test('native 200% zoom at 1280 px, in both themes: the list fits and keeps the wide or narrow form of its width', async () => {
  const extension = fileURLToPath(new URL('./zoom-extension', import.meta.url));
  for (const colorScheme of ['light', 'dark']) {
    const context = await chromium.launchPersistentContext('', {
      executablePath: CHROMIUM, headless: true, colorScheme, viewport: DESKTOP,
      ignoreDefaultArgs: ['--disable-extensions'],
      args: ['--no-sandbox', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
    });
    try {
      const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
      const page = await context.newPage();
      await page.goto(`${base}/?visualizacao=lista`);
      await page.waitForFunction(() => document.querySelector('.indicator-table tbody')?.children.length > 0);
      await page.locator('.indicator-table select').selectOption('MA');
      await worker.evaluate(async base => {
        const tabs = await chrome.tabs.query({});
        await chrome.tabs.setZoom(tabs.find(tab => tab.url.startsWith(base)).id, 2);
      }, base);
      await page.waitForFunction(() => innerWidth === 640);
      assert.equal(await isNarrow(page), false, 'exactly 640 px of list');
      assert.equal(await noHorizontalScroll(page), true);
      const rows = page.locator('.indicator-table .scroll');
      assert.ok((await box(page, '.indicator-table .scroll')).height >= 200, 'room for the rows');
      await rows.focus();
      await page.keyboard.press('PageDown');
      await page.waitForFunction(() => document.querySelector('.indicator-table .scroll').scrollTop > 0);
    } finally { await context.close(); }
  }
});
