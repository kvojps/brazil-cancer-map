import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { chromium } from 'playwright-core';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
let browser;
before(async () => { browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/snap/bin/chromium', headless: true, args: ['--no-sandbox'] }); });
after(async () => { await browser?.close(); });
const select = (page, code) => page.evaluate(code => window.dispatchEvent(new CustomEvent('municipality-map-select', { detail: code })), code);
const ready = page => page.locator('#municipality-content .profile').waitFor({ state: 'attached' });

test('the consultation shows the latest filters while the indicator layer is pending and through its recovery', { timeout: 60_000 }, async () => {
  const page = await browser.newPage();
  const profile = Promise.withResolvers();
  const layer = Promise.withResolvers();
  const profileRequested = Promise.withResolvers();
  const layerRequested = Promise.withResolvers();
  let layerAttempts = 0;
  let profileRequests = 0;
  let documentRequests = 0;
  try {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', {
        value: async ({ url }) => { window.sharedMunicipality = url; },
      });
    });
    await page.route(url => url.pathname === '/municipio/261160-recife/', route => {
      documentRequests++;
      return route.continue();
    });
    await page.route('**/dados/profiles/PE.json', async route => {
      profileRequests++;
      profileRequested.resolve();
      await profile.promise;
      await route.continue();
    });
    await page.route('**/map/mammography/breast.json', async route => {
      if (++layerAttempts > 1) return route.continue();
      layerRequested.resolve();
      await layer.promise;
      await route.fulfill({ status: 503, body: '' });
    });
    await page.goto(base + '/municipio/261160-recife/?visualizacao=lista');
    await profileRequested.promise;
    await page.selectOption('#cancer-type', 'breast');
    await page.selectOption('#map-indicator', 'mammography');
    await page.selectOption('#map-reading', 'status');
    await layerRequested.promise;
    await page.getByRole('button', { name: 'Compartilhar', exact: true }).click();
    assert.equal(await page.evaluate(() => window.sharedMunicipality),
      base + '/municipio/261160-recife/?indicador=mammography&tipo=breast&modo=hoje');

    profile.resolve();
    await ready(page);
    const result = page.locator('[data-profile-result]');
    assert.match(await result.textContent(), /mamografia/i);
    assert.match(await result.locator('.result-context').textContent(), /^Referência/);
    assert.equal(await page.locator('[data-panel-cancer-type]').inputValue(), 'breast');
    assert.equal(await page.locator('.indicator-table tbody tr').count(), 0);
    const resultBeforeLayer = await result.locator(':scope > :first-child').elementHandle();

    layer.resolve();
    const retry = page.locator('#retry-data');
    await retry.waitFor();
    assert.equal(await resultBeforeLayer.evaluate(node => node.isConnected), true, 'layer failure leaves the result in place');
    await retry.click();
    await page.locator('.indicator-table tbody tr').first().waitFor();
    assert.equal(await resultBeforeLayer.evaluate(node => node.isConnected), true, 'layer retry leaves the result in place');
    assert.equal(profileRequests, 1);
    assert.equal(documentRequests, 1, 'the direct document supplies the municipal HTML');
  } finally {
    profile.resolve();
    layer.resolve();
    await page.close();
  }
});

test('changing filters keeps the failed consultation until its own retry', async () => {
  const page = await browser.newPage();
  const layer = Promise.withResolvers();
  let profileAttempts = 0;
  let documentRequests = 0;
  let layerAttempts = 0;
  try {
    await page.route('**/municipio/261160-recife/', route => {
      documentRequests++;
      return route.continue();
    });
    await page.route('**/dados/profiles/PE.json', route => ++profileAttempts === 1
      ? route.fulfill({ status: 503, body: '' }) : route.continue());
    await page.route('**/map/mammography/breast.json', async route => {
      if (++layerAttempts > 1) return route.continue();
      await layer.promise;
      await route.fulfill({ status: 503, body: '' });
    });
    await page.goto(base + '/?visualizacao=lista');
    await page.locator('#municipality-search').fill('Recife PE');
    await page.getByRole('button', { name: 'Recife (PE)', exact: true }).click();
    const result = page.locator('[data-profile-result]');
    const profileRetry = result.getByRole('button', { name: 'Tentar novamente', exact: true });
    await profileRetry.waitFor();
    assert.equal(await result.getAttribute('data-kind'), 'error');
    const message = await result.locator('p').textContent();
    assert.match(message, /Não foi possível carregar a consulta municipal/);

    await page.selectOption('#cancer-type', 'breast');
    await page.selectOption('#map-indicator', 'mammography');
    await page.selectOption('#map-reading', 'status');
    layer.resolve();
    const layerRetry = page.locator('#retry-data');
    await layerRetry.waitFor();
    assert.equal(await result.locator('p').textContent(), message);
    assert.equal(profileAttempts, 1);
    const entry = await page.evaluate(() => ({ url: location.href, length: history.length, state: history.state }));

    await profileRetry.click();
    await ready(page);
    assert.match(await result.textContent(), /mamografia/i);
    assert.match(await result.locator('.result-context').textContent(), /^Referência/);
    assert.deepEqual(await page.evaluate(() => ({ url: location.href, length: history.length, state: history.state })), entry);
    assert.equal(profileAttempts, 2);
    assert.equal(documentRequests, 1);
    assert.equal(layerAttempts, 1);
    await layerRetry.click();
    await page.locator('.indicator-table tbody tr').first().waitFor();
    assert.equal(layerAttempts, 2);
    assert.equal(profileAttempts, 2);
  } finally {
    layer.resolve();
    await page.close();
  }
});

test('selection loads four axes, filters all types and distinguishes returning from clearing', async () => {
  const page = await browser.newPage({ viewport: { width: 320, height: 900 } });
  try {
    await page.goto(base + '/?municipio=261160');
    await ready(page);
    const toggle = page.locator('[data-toggle-profile]');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator('#municipality-preview').evaluate(el => el.getBoundingClientRect().bottom <= innerHeight), true);
    await toggle.click();
    assert.equal(await page.locator('[data-profile-axis]').count(), 4);
    assert.equal(await page.locator('[data-profile-axis][open]').getAttribute('id'), 'acesso');
    await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).click();
    await toggle.waitFor();
    await page.locator('.filters-toggle').click();
    for (const type of ['breast', 'cervix', 'prostate', 'colorectal', 'lung', 'all']) {
      await page.selectOption('#cancer-type', type);
      await page.waitForFunction(type => document.querySelector('[data-panel-cancer-type]').value === type && !document.querySelector(`[data-profile-axis] [data-cancer-type="${type}"]`).hidden, type);
      assert.equal(await page.locator('[data-profile-axis]').count(), 4);
    }
    await page.getByRole('button', { name: 'Ver mapa' }).click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(new URL(page.url()).pathname, '/municipio/261160-recife/', 'collapsing keeps the selection');
    assert.equal(await page.locator('#preview-heading').isVisible(), true);
    await page.locator('[data-clear-profile]').click();
    assert.equal(new URL(page.url()).searchParams.has('municipio'), false);
    assert.equal(await page.locator('#municipality-preview').isVisible(), false);
  } finally { await page.close(); }
});

test('a delayed previous municipality cannot overwrite the current selection', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  let release;
  const delayed = new Promise(resolve => { release = resolve; });
  try {
    await page.route('**/municipio/120050-*', async route => { await delayed; await route.continue(); });
    await page.goto(base + '/');
    await page.locator('#municipality-search:enabled').waitFor({ state: 'attached' });
    await select(page, '120050');
    await select(page, '261160');
    await ready(page);
    release();
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('#municipality-content .profile').getAttribute('data-code'), '261160');
    assert.match(await page.locator('#preview-heading').textContent(), /Recife/);
  } finally { release(); await page.close(); }
});

test('profile failure clears old results and offers retry without claiming insufficient data', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(base + '/?municipio=261160');
    await ready(page);
    await page.route('**/dados/profiles/AC.json', route => route.fulfill({ status: 503, body: '' }));
    await select(page, '120050');
    await page.getByRole('button', { name: 'Tentar novamente' }).waitFor();
    assert.equal(await page.locator('#municipality-content .profile').count(), 0);
    assert.match(await page.locator('[data-profile-result]').textContent(), /Isso não significa dado insuficiente/);
    assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
    assert.equal(await page.locator('[data-map-view]').isVisible(), true);
    assert.equal(await page.locator('.result-value').count(), 0);
    await page.unroute('**/dados/profiles/AC.json');
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await ready(page);
    assert.equal(await page.locator('#municipality-content .profile').getAttribute('data-code'), '120050');
    assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
  } finally { await page.close(); }
});

for (const theme of ['light', 'dark']) {
  test(`published municipal, regional, insufficient and C results fit the integrated panel in ${theme}`, async () => {
    const page = await browser.newPage();
    try {
      await page.goto(`${base}/?theme=${theme}`);
      await page.locator('#municipality-search:enabled').waitFor();
      for (const [code, text] of [['120020', 'Dados do seu município'], ['120001', 'Seu município e vizinhos'], ['120034', 'Dado insuficiente'], ['210005', 'registro']]) {
        await select(page, code);
        await page.locator(`.profile[data-code="${code}"]`).waitFor({ state: 'attached' });
        for (const width of [320, 768, 1280]) {
          await page.setViewportSize({ width, height: 900 });
          if (await page.locator('[data-toggle-profile]').isVisible() && await page.locator('[data-toggle-profile]').getAttribute('aria-expanded') === 'false') await page.locator('[data-toggle-profile]').click();
          for (const zoom of ['100%', '200%']) {
            await page.locator('body').evaluate((el, zoom) => { el.style.zoom = zoom; }, zoom);
            await page.locator('[data-profile-axis]').evaluateAll(axes => axes.forEach(axis => { axis.removeAttribute('name'); axis.open = true; }));
            if (width >= 768) {
              const bounds = await page.evaluate(() => {
                const map = document.querySelector('.map-with-legend').getBoundingClientRect();
                const panel = document.querySelector('#municipality-preview');
                const rect = panel.getBoundingClientRect();
                panel.scrollTop = panel.scrollHeight;
                return { top: Math.abs(map.top - rect.top), bottom: Math.abs(map.bottom - rect.bottom), scrolled: panel.scrollTop > 0 };
              });
              assert.ok(bounds.top < 1 && bounds.bottom < 1, `panel aligns with map: ${JSON.stringify(bounds)}`);
              assert.ok(bounds.scrolled, 'expanded consultation scrolls inside the panel');
            }
            assert.match(await page.locator('#acesso').textContent(), new RegExp(text));
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${code}, ${width}, ${zoom}`);
          }
          await page.locator('body').evaluate(el => { el.style.zoom = '100%'; });
        }
        await page.screenshot({ path: `/tmp/ticket37-${theme}-${code}.png` });
      }
      await page.locator('#prevencao').evaluate(el => { el.open = true; });
      assert.match(await page.locator('#prevencao').textContent(), /Cobertura da vacina HPV[\s\S]*Situação em \d{4}/);
    } finally { await page.close(); }
  });
}
