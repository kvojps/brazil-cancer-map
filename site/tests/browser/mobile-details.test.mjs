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

for (const [width, height, textScale, view] of [[320, 568, 1, 'mapa'], [568, 320, 1, 'lista'], [320, 568, 2, 'lista'], [568, 160, 2, 'mapa']]) {
test(`${width}x${height}, ${textScale * 100}% CSS text, ${view}: mobile consultation controls have comfortable targets, spacing and a single close control`, async () => {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true });
  const button = name => page.getByRole('button', { name, exact: true });
  const assertControlLayout = async controls => {
    const boxes = [];
    for (const control of controls) {
      await control.scrollIntoViewIfNeeded();
      const box = await control.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44, `44px target: ${JSON.stringify(box)}`);
      assert.ok(box.x >= 0 && box.x + box.width <= width, 'control fits the viewport');
      assert.equal(await control.evaluate(el => el.scrollWidth <= el.clientWidth), true, 'complete label fits');
    }
    // Compare the resting layout before the independently scrolling regions move.
    await page.locator('#municipality-preview, .panel-bar, .panel-reading').evaluateAll(regions => {
      for (const region of regions) region.scrollTop = 0;
    });
    for (const control of controls) boxes.push(await control.boundingBox());
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const horizontal = Math.max(a.x - b.x - b.width, b.x - a.x - a.width);
      const vertical = Math.max(a.y - b.y - b.height, b.y - a.y - a.height);
      assert.ok(horizontal >= 7.9 || vertical >= 7.9, `8px spacing: ${JSON.stringify({ a, b })}`);
      if (vertical < 0 && horizontal >= 0) assert.ok(Math.abs(a.y - b.y) < 1, 'buttons on a row align at the top');
    }
  };
  try {
    await page.goto(base + '/municipio/510550-vila-bela-da-santissima-trindade/' + (view === 'lista' ? '?visualizacao=lista' : ''));
    await button('Ver detalhes').waitFor();
    if (textScale === 2) await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await assertControlLayout([button('Ver detalhes'), button('Compartilhar'), button('Legenda'), button('Limpar seleção')]);
    const detailsButton = await button('Ver detalhes').boundingBox();
    const shareButton = await button('Compartilhar').boundingBox();
    if (width === 320 && textScale === 2) {
      assert.ok(shareButton.y >= detailsButton.y + detailsButton.height, 'Share wraps on a narrow screen with enlarged text');
    } else {
      assert.equal(shareButton.y, detailsButton.y, 'Share sits alongside View details when there is room');
    }
    const fill = control => control.evaluate(el => getComputedStyle(el).backgroundColor);
    assert.notEqual(await fill(button('Ver detalhes')), 'rgba(0, 0, 0, 0)');
    assert.equal(await fill(button('Legenda')), 'rgba(0, 0, 0, 0)');
    assert.equal(await fill(button('Compartilhar')), 'rgba(0, 0, 0, 0)');
    assert.equal(await fill(button('Limpar seleção')), 'rgba(0, 0, 0, 0)');
    await button('Ver detalhes').click();
    const close = button('Fechar detalhes');
    assert.equal(await button('Limpar seleção').count(), 0);
    assert.equal(await button('Voltar ao mapa').count() + await button('Voltar à lista').count(), 0);
    assert.equal(await button('Menu').count(), 0);
    await assertControlLayout([close, button('Compartilhar'), button('Legenda'), page.getByRole('combobox', { name: 'Tipo de câncer', exact: true })]);
    const heading = await page.getByRole('heading', { name: 'Vila Bela da Santíssima Trindade (MT)', exact: true }).boundingBox();
    const cross = await close.boundingBox();
    const share = await button('Compartilhar').boundingBox();
    assert.ok(share.y >= heading.y + heading.height, 'Share sits below the municipality name');
    assert.ok(heading.x + heading.width <= cross.x && Math.abs(heading.y - cross.y) < 10, 'the close control sits to the right of the name');
    if (textScale === 2) {
      const type = page.getByRole('combobox', { name: 'Tipo de câncer', exact: true });
      for (const [value, label] of [['all', 'Todos os cânceres'], ['cervix', 'Colo do útero']]) {
        await type.selectOption(value);
        const visibleValue = page.getByText(label, { exact: true }).filter({ visible: true });
        await visibleValue.scrollIntoViewIfNeeded();
        const target = await type.boundingBox();
        const text = await visibleValue.evaluate(el => {
          const range = document.createRange();
          range.selectNodeContents(el);
          return [...range.getClientRects()].map(r => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom }));
        });
        assert.ok(text.length > 0);
        for (const line of text) assert.ok(line.left >= target.x && line.right <= target.x + target.width && line.top >= target.y && line.bottom <= target.y + target.height, 'selected label is fully visible inside its target');
      }
    }
    await close.click();
    assert.equal(await button('Ver detalhes').evaluate(el => el === document.activeElement), true);
    assert.match(new URL(page.url()).pathname, /510550-vila-bela-da-santissima-trindade/);
    await button('Limpar seleção').click();
    await page.waitForFunction(() => document.querySelector('#municipality-preview').hidden);
    assert.equal(new URL(page.url()).pathname, '/');
  } finally { await page.close(); }
});
}

test('Forward restores the details reading axis and internal position after closing', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(base + RECIFE + '?visualizacao=lista');
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    await page.locator('#prevencao > summary').click();
    await page.locator('#prevencao [data-cancer-type="all"] .card-action').last().scrollIntoViewIfNeeded();
    const reading = await page.locator('.panel-reading').evaluate(el => el.scrollTop);
    assert.ok(reading > 100);
    const previous = page.url();
    const length = await page.evaluate(() => history.length);
    await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).click();
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    await page.goForward();
    await page.waitForURL(previous);
    await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).waitFor();
    await page.locator('.result-value').waitFor();
    await page.waitForFunction(position => document.querySelector('#prevencao').open && Math.abs(document.querySelector('.panel-reading').scrollTop - position) < 3, reading);
    assert.equal(await page.evaluate(() => history.length), length);
  } finally { await page.close(); }
});

test('history restores separate list positions, UF and expanded rows across map and logo', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(10000);
  try {
    await page.goto(base + '/?visualizacao=lista');
    await page.locator('.indicator-table select').selectOption('PE');
    const row = page.locator('tr[data-code="260960"]');
    await row.locator('button').click();
    await row.locator('a').scrollIntoViewIfNeeded();
    const top = await page.locator('.indicator-table .scroll').evaluate(el => el.scrollTop);
    await page.getByRole('button', { name: 'Mapa', exact: true }).click();
    await page.getByRole('button', { name: 'Lista', exact: true }).click();
    await page.locator('.indicator-table select').selectOption('RN');
    await page.locator('.identity').click();
    await page.waitForURL(base + '/');
    const length = await page.evaluate(() => history.length);
    await page.goBack();
    await page.waitForFunction(() => document.querySelector('.indicator-table select').value === 'RN');
    await page.goBack();
    await page.waitForFunction(() => document.querySelector('[data-map-view]').hidden === false);
    await page.goBack();
    await page.waitForFunction(position => document.querySelector('.indicator-table select').value === 'PE' && Math.abs(document.querySelector('.indicator-table .scroll').scrollTop - position) < 3, top);
    assert.equal(await row.locator('button').getAttribute('aria-expanded'), 'true');
    assert.equal(await page.evaluate(() => history.length), length);
  } finally { await page.close(); }
});

test('Back during a new profile load restores the summary and rejects the obsolete arrival', async () => {
  const page = await browser.newPage({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(10000);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let requested;
  const started = new Promise(resolve => { requested = resolve; });
  try {
    await page.goto(base + RECIFE);
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    await page.route('**/dados/profiles/RN.json', async route => { requested(); await gate; await route.continue(); });
    await page.getByRole('link', { name: 'Buscar município', exact: true }).click();
    await page.locator('#municipality-search').fill('Natal RN');
    await page.locator('#municipality-results button').click();
    await started;
    assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
    await page.goBack();
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    const response = page.waitForResponse('**/dados/profiles/RN.json');
    release();
    await (await response).finished();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(new URL(page.url()).pathname, RECIFE);
    assert.equal(await page.locator('#preview-heading').innerText(), 'Recife (PE)');
    assert.equal(await page.locator('.profile').getAttribute('data-code'), '261160');
    assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
  } finally { release(); await page.close(); }
});

for (const failure of ['transport', 'invalid topology']) {
test(`${failure}: mesh failure recovers independently without history or opening municipal details`, async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(10000);
  let fail = true;
  try {
    await page.route('**/municipalities.topojson', route => fail ? route.fulfill(failure === 'transport' ? { status: 503, body: '' } : { json: { type: 'Topology', objects: {} } }) : route.continue());
    await page.goto(base + RECIFE + '?visualizacao=lista');
    await page.locator('.result-value').waitFor();
    await page.locator('.indicator-table select').selectOption('PE');
    const length = await page.evaluate(() => history.length);
    const url = page.url();
    await page.getByRole('button', { name: 'Mapa', exact: true }).click();
    await page.getByRole('button', { name: 'Tentar mapa novamente', exact: true }).waitFor();
    fail = false;
    await page.getByRole('button', { name: 'Tentar mapa novamente', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.map-status').hidden);
    assert.equal(await page.evaluate(() => history.length), length + 1);
    assert.equal(new URL(page.url()).pathname, new URL(url).pathname);
    assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
    assert.equal(await page.locator('.map canvas').count(), 1);
    await page.getByRole('button', { name: 'Lista', exact: true }).click();
    assert.equal(await page.locator('.indicator-table select').inputValue(), 'PE');
  } finally { await page.close(); }
});
}

test('retry after an anchored profile failure keeps the summary and history, while reload reveals the anchor', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(10000);
  let fail = true;
  try {
    await page.route('**/dados/profiles/PE.json', route => fail ? route.fulfill({ status: 503, body: '' }) : route.continue());
    await page.goto(base + RECIFE + '#prevencao');
    await page.getByRole('button', { name: 'Tentar novamente', exact: true }).waitFor();
    const legend = page.getByRole('button', { name: 'Legenda', exact: true });
    await legend.click();
    await page.getByRole('button', { name: 'Fechar legenda', exact: true }).click();
    assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
    const length = await page.evaluate(() => history.length);
    const url = page.url();
    fail = false;
    await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
    await page.locator('.result-value').waitFor();
    assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
    assert.equal(await page.evaluate(() => history.length), length);
    assert.equal(page.url(), url);
    await page.reload();
    await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).waitFor();
    assert.equal(await page.locator('#prevencao').getAttribute('open'), '');
  } finally { await page.close(); }
});

test('an anchor reached while the profile has failed stays collapsed after retry', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  let attempts = 0;
  try {
    await page.route('**/dados/profiles/PE.json', route => ++attempts === 1
      ? route.fulfill({ status: 503, body: '' }) : route.continue());
    await page.goto(base + RECIFE);
    const retry = page.locator('[data-profile-result]').getByRole('button', { name: 'Tentar novamente', exact: true });
    await retry.waitFor();
    await page.evaluate(() => new Promise(resolve => {
      window.addEventListener('hashchange', () => resolve(), { once: true });
      location.hash = 'prevencao';
    }));
    const entry = await page.evaluate(() => ({ url: location.href, length: history.length, state: history.state }));

    await retry.click();
    const details = page.locator('[data-toggle-profile]:not([hidden])');
    await details.waitFor({ state: 'attached' });
    assert.equal(await details.getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
    assert.deepEqual(await page.evaluate(() => ({ url: location.href, length: history.length, state: history.state })), entry);
    assert.equal(attempts, 2);
  } finally { await page.close(); }
});

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
    await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).click();
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
    const position = await page.locator('.indicator-table .scroll').evaluate(element => element.scrollTop);
    assert.ok(position > 100);
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).click();
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    assert.ok(Math.abs(await page.locator('.indicator-table .scroll').evaluate(element => element.scrollTop) - position) < 3, 'details keep the list position');
    await page.locator('[data-view="mapa"]').click();
    await page.locator('[data-view="lista"]').click();
    await page.waitForFunction(() => document.querySelector('.indicator-table tbody')?.children.length > 0);
    assert.ok(Math.abs(await page.locator('.indicator-table .scroll').evaluate(element => element.scrollTop) - position) < 3, 'each visualization keeps its position');
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
      await page.waitForFunction(({ path, type, expanded }) => location.pathname === path && new URLSearchParams(location.search).get('tipo') === type && document.querySelector('[data-close-details]').checkVisibility() === expanded, { path, type, expanded });
    }
  } finally { await page.close(); }
});

for (const height of [568, 844]) test(`municipal anchors at ${height} reach their axis without a synthetic history step`, async () => {
  const page = await browser.newPage({ viewport: { width: 390, height }, isMobile: true, hasTouch: true });
  try {
    await page.goto(base + '/municipios/');
    await page.goto(base + RECIFE + '#prevencao');
    await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).waitFor();
    assert.equal(await page.locator('#prevencao').getAttribute('open'), '');
    await page.waitForFunction(() => {
      const r = document.querySelector('#prevencao > summary').getBoundingClientRect();
      return r.top >= document.querySelector('.construction-notice').getBoundingClientRect().bottom && r.bottom <= innerHeight;
    });
    await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).click();
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    assert.equal(new URL(page.url()).pathname, RECIFE);
    assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
    assert.equal(new URL(page.url()).hash, '');
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
    await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).waitFor();
    assert.equal(await page.locator('#prevencao').getAttribute('open'), '');
    await page.waitForFunction(() => {
      const r = document.querySelector('#prevencao > summary').getBoundingClientRect();
      return r.top >= document.querySelector('.construction-notice').getBoundingClientRect().bottom && r.bottom <= innerHeight;
    });
    await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).click();
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

test('closing reloaded anchored details during loading keeps the summary and restores its focus', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(8000);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  try {
    await page.goto(base + RECIFE + '#prevencao');
    const close = page.getByRole('button', { name: 'Fechar detalhes', exact: true });
    await close.waitFor();
    await page.route('**/dados/profiles/PE.json', async route => { await gate; await route.continue(); });
    await page.reload();
    await close.click();
    assert.equal(new URL(page.url()).hash, '');
    release();
    const details = page.getByRole('button', { name: 'Ver detalhes', exact: true });
    await details.waitFor();
    assert.equal(await details.evaluate(el => el === document.activeElement), true);
  } finally { release(); await page.close(); }
});

test('reloading a details history entry keeps its control and Back coherent', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(base + RECIFE);
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    await page.reload();
    await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).waitFor({ timeout: 5000 });
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
      await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).waitFor();
      assert.equal(await page.locator('[data-preview-content]').isVisible(), true);
      await page.setViewportSize({ width, height });
      await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).click();
      await toggle.waitFor();
      assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
      await page.goForward();
      await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).waitFor();
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
      const position = await page.locator('.indicator-table .scroll').evaluate(element => element.scrollTop);
      await link.tap();
      await page.locator('.result-value').waitFor();
      assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
      await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
      await page.locator('#acesso [data-cancer-type="breast"] .card-action').scrollIntoViewIfNeeded();
      await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).click();
      await page.waitForFunction(position => document.querySelector('#municipality-preview').hasAttribute('data-collapsed') && Math.abs(document.querySelector('.indicator-table .scroll').scrollTop - position) < 3, position);
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
    await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).waitFor();
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
    await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).click();
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
    await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).click();
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    assert.equal(new URL(page.url()).searchParams.get('tipo'), 'prostate', 'closing preserves the changed type');
    await page.getByRole('button', { name: /^Filtros/ }).click();
    await page.locator('#cancer-type').selectOption('breast');
    await page.locator('#map-indicator').selectOption('mammography');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#deteccao').open);
    await page.locator('#prevencao > summary').click();
    await page.locator('[data-panel-cancer-type]').selectOption('prostate');
    await page.waitForFunction(() => document.querySelector('#acesso').open && document.querySelector('#map-indicator').value === 'within_60_days');
    assert.equal(await page.locator('[data-preview-content]').isVisible(), true);
    await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).click();
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
    assert.equal(new URL(page.url()).pathname, RECIFE);
  } finally { await page.close(); }
});

for (const theme of ['light', 'dark']) test(`extreme height with 200% CSS text keeps reading and commands reachable (${theme})`, async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(5000);
  const reachable = async locator => {
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    assert.ok(box && box.y >= 0 && box.y < 160 && box.y + Math.min(box.height, 20) <= 160);
  };
  try {
    await page.goto(base + RECIFE + `?theme=${theme}&tipo=prostate`);
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    const url = page.url();
    const historyLength = await page.evaluate(() => history.length);
    await page.setViewportSize({ width: 568, height: 160 });
    await page.waitForFunction(() => document.documentElement.scrollHeight <= innerHeight + 1);
    const noticeOpener = page.getByRole('button', { name: 'Ler aviso', exact: true });
    await reachable(noticeOpener);
    await noticeOpener.click();
    const noticeReading = page.getByRole('dialog', { name: 'Aviso de construção' });
    assert.match(await noticeReading.innerText(), /podem conter erros e mudar/);
    await reachable(noticeReading.getByRole('button', { name: 'Fechar', exact: true }));
    await page.keyboard.press('Escape');
    await reachable(page.getByRole('button', { name: 'Ver detalhes', exact: true }));
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    await reachable(page.getByRole('button', { name: 'Fechar detalhes', exact: true }));
    const legend = page.getByRole('button', { name: 'Legenda', exact: true });
    await reachable(legend);
    await legend.click();
    await page.locator('#legend-full button').last().scrollIntoViewIfNeeded();
    await page.keyboard.press('Escape');
    const reading = page.locator('.panel-reading');
    await page.locator('#acesso [data-cancer-type="prostate"] .card-action').last().scrollIntoViewIfNeeded();
    const position = await reading.evaluate(el => el.scrollTop);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.documentElement.scrollHeight <= innerHeight + 1);
    assert.equal(page.url(), url);
    assert.equal(await page.evaluate(() => history.length), historyLength + 1);
    const restored = await reading.evaluate(el => ({ top: el.scrollTop, max: el.scrollHeight - el.clientHeight }));
    assert.ok(Math.abs(restored.top - Math.min(position, restored.max)) < 3, JSON.stringify({ position, restored }));
    await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).click();
    assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
  } finally { await page.close(); }
});
