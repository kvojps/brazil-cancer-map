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
    await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).click();
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
    const position = await page.evaluate(() => scrollY);
    assert.ok(position > 100);
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    await page.getByRole('button', { name: 'Voltar à lista', exact: true }).click();
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - position) < 3, 'details keep the list position');
    await page.locator('[data-view="mapa"]').click();
    await page.locator('[data-view="lista"]').click();
    await page.waitForFunction(() => document.querySelector('.indicator-table tbody')?.children.length > 0);
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - position) < 3, 'each visualization keeps its position');
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
      await page.waitForFunction(({ path, type, expanded }) => location.pathname === path && new URLSearchParams(location.search).get('tipo') === type && document.querySelector('[data-toggle-profile]').getAttribute('aria-expanded') === String(expanded), { path, type, expanded });
    }
  } finally { await page.close(); }
});

test('municipal anchors reach their axis and returning keeps the selected municipality', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(base + RECIFE + '#prevencao');
    await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).waitFor();
    assert.equal(await page.locator('#prevencao').getAttribute('open'), '');
    await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).click();
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    assert.equal(new URL(page.url()).pathname, RECIFE);
    assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
  } finally { await page.close(); }
});
