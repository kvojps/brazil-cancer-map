import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { chromium } from 'playwright-core';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
let browser;
before(async () => { browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/snap/bin/chromium', headless: true, args: ['--no-sandbox'] }); });
after(async () => { await browser?.close(); });
const select = (page, code) => page.evaluate(code => window.dispatchEvent(new CustomEvent('municipality-map-select', { detail: code })), code);
const ready = page => page.locator('#municipality-content .profile').waitFor({ state: 'attached' });

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
    for (const type of ['breast', 'cervix', 'prostate', 'colorectal', 'lung', 'all']) {
      await page.selectOption('#cancer-type', type);
      await page.locator(`[data-profile-type="${type}"][aria-current="true"]`).waitFor();
      assert.equal(await page.locator('[data-profile-axis]').count(), 4);
    }
    await page.locator('[data-collapse-profile]').click();
    assert.equal(new URL(page.url()).searchParams.get('municipio'), '261160');
    await page.locator('[data-reopen-profile]').click();
    assert.equal(await page.locator('#preview-heading').evaluate(el => el === document.activeElement), true);
    await page.locator('[data-clear-profile]').click();
    assert.equal(new URL(page.url()).searchParams.has('municipio'), false);
    assert.equal(await page.locator('#municipality-preview').isVisible(), false);
  } finally { await page.close(); }
});

test('a delayed previous municipality cannot overwrite the current selection', async () => {
  const page = await browser.newPage();
  let release;
  const delayed = new Promise(resolve => { release = resolve; });
  try {
    await page.route('**/municipio/120050-*', async route => { await delayed; await route.continue(); });
    await page.goto(base + '/');
    await page.locator('#municipality-search:enabled').waitFor();
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
  const page = await browser.newPage();
  try {
    await page.goto(base + '/?municipio=261160');
    await ready(page);
    await page.route('**/dados/profiles/AC.json', route => route.fulfill({ status: 503, body: '' }));
    await select(page, '120050');
    await page.getByRole('button', { name: 'Tentar carregar a consulta novamente' }).waitFor();
    assert.equal(await page.locator('#municipality-content .profile').count(), 0);
    assert.match(await page.locator('#municipality-content').textContent(), /Isso não significa dado insuficiente/);
    await page.unroute('**/dados/profiles/AC.json');
    await page.getByRole('button', { name: 'Tentar carregar a consulta novamente' }).click();
    await ready(page);
    assert.equal(await page.locator('#municipality-content .profile').getAttribute('data-code'), '120050');
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
          if (await page.locator('[data-toggle-profile]').getAttribute('aria-expanded') === 'false') await page.locator('[data-toggle-profile]').click();
          for (const zoom of ['100%', '200%']) {
            await page.locator('body').evaluate((el, zoom) => { el.style.zoom = zoom; }, zoom);
            await page.locator('[data-profile-axis]').evaluateAll(axes => axes.forEach(axis => { axis.open = true; }));
            assert.match(await page.locator('#acesso').textContent(), new RegExp(text));
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${code}, ${width}, ${zoom}`);
          }
          await page.locator('body').evaluate(el => { el.style.zoom = '100%'; });
        }
        await page.screenshot({ path: `/tmp/ticket37-${theme}-${code}.png` });
      }
      await page.locator('#prevencao').evaluate(el => { el.open = true; });
      assert.match(await page.locator('#prevencao').textContent(), /não est[áã]o? dispon[ií]ve|ainda não|não disponível/i);
    } finally { await page.close(); }
  });
}
