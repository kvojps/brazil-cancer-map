import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
const message = 'Em construção. Dados ainda não validados; podem conter erros e mudar.';
let browser;
before(async () => {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? chromium.executablePath(), args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
});
after(async () => { await browser?.close(); });

// Every rendered text fragment must fit its viewport and all clipping ancestors.
async function assertReadable(locator) {
  assert.equal(await locator.evaluate(element => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node;
    let count = 0;
    while ((node = walker.nextNode())) {
      if (!node.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (!rect.width || !rect.height) continue;
        count++;
        if (rect.top < 0 || rect.bottom > innerHeight + 1 || rect.left < 0 || rect.right > innerWidth + 1) return false;
        for (let parent = node.parentElement; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
            const area = parent.getBoundingClientRect();
            if (rect.top < area.top - 1 || rect.bottom > area.bottom + 1) return false;
          }
        }
      }
    }
    return count > 0;
  }), true, 'all text fragments are visible without scrolling');
}

for (const [width, height] of [[320, 568], [390, 844]]) {
  test(`normal opening exposes the full notice at ${width}x${height}`, async () => {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true });
    try {
      await page.goto(base);
      await page.locator('#municipality-search:not([disabled])').waitFor({ state: 'attached' });
      const notice = page.locator('.construction-notice');
      assert.equal((await notice.innerText()).trim().replace(/\s+/g, ' '), message);
      await assertReadable(notice);
      assert.equal(await page.locator('.site-header').evaluate(el => el.getBoundingClientRect().top >= document.querySelector('.construction-notice').getBoundingClientRect().bottom), true, 'the header starts below the notice');
      await page.locator('.search-toggle').click();
      await page.keyboard.press('Escape');
      assert.equal(await notice.evaluate(el => el.scrollHeight <= el.clientHeight + 1), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), true);
    } finally { await page.close(); }
  });
}

test('reduced height offers a readable notice, closing and automatic recovery with focus', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(15000);
  try {
    await page.goto(`${base}/municipio/261160-recife/?tipo=breast`);
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    const url = page.url();
    const entries = await page.evaluate(() => history.length);
    await page.setViewportSize({ width: 568, height: 160 });
    const opener = page.getByRole('button', { name: 'Ler aviso', exact: true });
    await opener.waitFor();
    assert.ok((await opener.boundingBox()).height >= 44, 'the mobile touch target is at least 44px high');
    await assertReadable(page.locator('.notice-compact'));
    await opener.click();
    const reading = page.getByRole('dialog', { name: 'Aviso de construção' });
    await reading.waitFor();
    assert.equal((await reading.locator('p').innerText()).trim(), message);
    const close = reading.getByRole('button', { name: 'Fechar', exact: true });
    await assertReadable(close);
    await close.click();
    assert.equal(await opener.evaluate(el => document.activeElement === el), true);
    await assertReadable(page.locator('.notice-compact'));
    await opener.click();
    await page.keyboard.press('Escape');
    assert.equal(await opener.evaluate(el => document.activeElement === el), true);
    await opener.click();
    await page.setViewportSize({ width: 390, height: 844 });
    await opener.waitFor({ state: 'hidden' });
    await assertReadable(page.locator('.notice-message'));
    assert.equal(await reading.isVisible(), true, 'height recovery retains the open reading');
    assert.equal(await close.evaluate(el => document.activeElement === el), true);
    await close.click();
    assert.equal(await page.locator('.notice-message').evaluate(el => document.activeElement === el), true);
    await page.setViewportSize({ width: 568, height: 160 });
    await opener.waitFor();
    assert.equal(await opener.evaluate(el => document.activeElement === el), true, 'compacting returns focus from the full message to the invoker');
    assert.equal(page.url(), url);
    assert.equal(await page.evaluate(() => history.length), entries);
    assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), true);
  } finally { await page.close(); }
});

for (const theme of ['light', 'dark']) {
  test(`200% CSS text at 568x160 keeps compact text, close and complete reading reachable (${theme})`, async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    try {
      await page.goto(`${base}/municipio/261160-recife/?theme=${theme}`);
      await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
      await page.setViewportSize({ width: 568, height: 160 });
      const opener = page.getByRole('button', { name: 'Ler aviso', exact: true });
      await opener.waitFor();
      await assertReadable(page.locator('.notice-compact'));
      assert.equal(await opener.evaluate(el => getComputedStyle(el).fontSize), '28px');
      await opener.hover();
      const contrast = await new AxeBuilder({ page }).include('.construction-notice').withRules(['color-contrast']).analyze();
      assert.deepEqual(contrast.violations.map(item => item.id), [], 'the compact notice retains contrast while hovered');
      await opener.focus();
      await page.keyboard.press('Enter');
      const reading = page.getByRole('dialog', { name: 'Aviso de construção' });
      const close = reading.getByRole('button', { name: 'Fechar', exact: true });
      await close.focus();
      await assertReadable(close);
      assert.equal(await close.evaluate(el => el.matches(':focus-visible')), true);
      const scroll = reading.locator('.notice-reading-scroll');
      assert.equal(await scroll.evaluate(el => el.clientHeight > 0), true);
      await page.keyboard.press('Tab');
      assert.equal(await scroll.evaluate(el => document.activeElement === el), true, 'keyboard reaches the scrollable reading');
      await page.keyboard.press('End');
      await page.waitForFunction(() => document.querySelector('.notice-reading-scroll').scrollTop > 0);
      // Read the start and the final words within the bounded scroll area.
      for (const end of [false, true]) {
        assert.equal(await scroll.evaluate((el, end) => {
          el.scrollTop = end ? el.scrollHeight : 0;
          const text = el.querySelector('p').firstChild;
          const range = document.createRange();
          range.setStart(text, end ? text.length - 6 : 0);
          range.setEnd(text, end ? text.length : 2);
          const rect = range.getBoundingClientRect();
          const area = el.getBoundingClientRect();
          return rect.top >= area.top - 1 && rect.bottom <= area.bottom + 1;
        }, end), true, 'the text can be read at both ends');
      }
      await assertReadable(close);
      await page.keyboard.press('Escape');
      assert.equal(await opener.evaluate(el => document.activeElement === el && el.matches(':focus-visible')), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), true);
    } finally { await context.close(); }
  });
}

test('notice reading replaces search, Menu, filters and legend over details without changing context', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(15000);
  try {
    await page.goto(`${base}/municipio/261160-recife/?tipo=breast&visualizacao=lista`);
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    await page.locator('#prevencao > summary').click();
    await page.setViewportSize({ width: 568, height: 280 });
    const opener = page.getByRole('button', { name: 'Ler aviso', exact: true });
    await opener.waitFor();
    const url = page.url();
    const entries = await page.evaluate(() => history.length);
    const reading = page.getByRole('dialog', { name: 'Aviso de construção' });
    const position = await page.locator('.panel-reading').evaluate(el => { el.scrollTop = 80; return el.scrollTop; });
    for (const command of ['Buscar município', 'Filtros', 'Legenda']) {
      await page.locator('[data-details-menu]').click();
      await page.locator('#details-menu').getByRole('button', { name: command, exact: true }).click();
      await opener.click();
      await reading.waitFor();
      assert.equal(await page.locator('.site-header').getAttribute('data-search-open'), null);
      assert.equal(await page.locator('#map-filters').isVisible(), false);
      assert.equal(await page.locator('#legend-full').isVisible(), false);
      assert.equal(await page.locator('#details-menu').isVisible(), false);
      assert.equal(await page.locator('.site-menu').getAttribute('open'), null);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.panel-reading').evaluate(el => el.scrollTop), position);
      assert.equal(await page.locator('#prevencao').getAttribute('open'), '');
      assert.equal(page.url(), url);
      assert.equal(await page.evaluate(() => history.length), entries);
    }
    await page.getByRole('button', { name: 'Voltar à lista', exact: true }).click();
    await page.locator('.site-menu > summary').click();
    await opener.click();
    await reading.waitFor();
    assert.equal(await page.locator('.site-menu').getAttribute('open'), null);
    await page.keyboard.press('Escape');
    await opener.focus();
    await page.setViewportSize({ width: 390, height: 844 });
    await opener.waitFor({ state: 'hidden' });
    assert.equal(await page.locator('.notice-message').evaluate(el => document.activeElement === el), true, 'recovery moves focus from the disappearing invoker');
  } finally { await page.close(); }
});

test('transition boundary retains full text at 312px and compacts at 311px with a stable return', async () => {
  const page = await browser.newPage({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(base);
    await page.locator('#municipality-search:not([disabled])').waitFor({ state: 'attached' });
    await page.evaluate(() => document.fonts.ready);
    const opener = page.getByRole('button', { name: 'Ler aviso', exact: true });
    for (const height of [312, 311, 312]) {
      await page.setViewportSize({ width: 320, height });
      await page.waitForFunction(compact => document.documentElement.hasAttribute('data-notice-compact') === compact, height === 311);
      await page.waitForTimeout(100);
      assert.equal(await opener.isVisible(), height === 311);
      await assertReadable(page.locator(height === 311 ? '.notice-compact' : '.notice-message'));
    }
  } finally { await page.close(); }
});

for (const scenario of [
  { width: 1280, height: 800, path: '/', javaScriptEnabled: true },
  { width: 568, height: 160, path: '/', javaScriptEnabled: false },
  { width: 320, height: 568, path: '/metodologia/', javaScriptEnabled: true },
]) {
  test(`full notice remains on ${scenario.path} at ${scenario.width}px, JavaScript ${scenario.javaScriptEnabled}`, async () => {
    const page = await browser.newPage({ viewport: { width: scenario.width, height: scenario.height }, javaScriptEnabled: scenario.javaScriptEnabled });
    try {
      await page.goto(base + scenario.path);
      await assertReadable(page.locator('.notice-message'));
      assert.equal(await page.getByRole('button', { name: 'Ler aviso', exact: true }).isVisible(), false);
    } finally { await page.close(); }
  });
}
