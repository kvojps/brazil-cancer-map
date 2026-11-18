import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
const recife = '/municipio/261160-recife/';
const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
let browser;

before(async () => {
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH ?? '/snap/bin/chromium',
    args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
  });
});
after(async () => { await browser?.close(); });

async function openConsultation(t, options, capabilities, path = recife) {
  const context = await browser.newContext(options);
  t.after(() => context.close());
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  await page.addInitScript(({ share, clipboard }) => {
    window.shareCalls = [];
    window.copiedLinks = [];
    Object.defineProperty(navigator, 'share', {
      value: share && (async data => {
        window.shareCalls.push(data);
        if (share === 'cancel') throw new DOMException('Cancelled', 'AbortError');
        if (share === 'fail') throw new DOMException('Unavailable', 'NotAllowedError');
      }),
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: clipboard && { async writeText(url) {
        window.copiedLinks.push(url);
        if (clipboard === 'deferred') {
          await new Promise((_, reject) => {
            window.rejectClipboard = () => reject(new DOMException('Unavailable', 'NotAllowedError'));
          });
        }
        if (clipboard === 'fail') throw new DOMException('Unavailable', 'NotAllowedError');
      } },
    });
  }, capabilities);
  await page.goto(base + path);
  await page.getByRole('heading', { name: 'Recife (PE)', exact: true }).waitFor();
  return page;
}

const shareButton = page => page.getByRole('button', { name: 'Compartilhar', exact: true });

function visit(page) {
  return page.evaluate(() => ({ url: location.href, length: history.length, state: history.state }));
}

test('native sharing sends the municipal route from the mobile summary and preserves the visit', async t => {
  const page = await openConsultation(t, phone, { share: 'success', clipboard: 'success' },
    recife + '?visualizacao=lista&theme=dark');
  const beforeShare = await visit(page);
  await shareButton(page).click();
  await page.waitForFunction(() => window.shareCalls.length === 1);
  assert.equal(await page.evaluate(() => window.shareCalls[0].url), base + recife);
  assert.deepEqual(await page.evaluate(() => window.copiedLinks), []);
  assert.deepEqual(await visit(page), beforeShare);
  assert.equal(await page.getByRole('button', { name: 'Ver detalhes', exact: true }).isVisible(), true);
});

test('without native sharing, mobile details copy the normalized selection after changing cancer type', async t => {
  const page = await openConsultation(t, phone, { share: null, clipboard: 'success' },
    recife + '?indicador=mammography&tipo=breast&modo=hoje&visualizacao=lista&theme=light#deteccao');
  const type = page.getByRole('combobox', { name: 'Tipo de câncer', exact: true });
  await type.selectOption('cervix');
  await page.waitForURL(url => url.searchParams.get('tipo') === 'cervix');
  const beforeShare = await visit(page);
  await shareButton(page).click();
  await page.getByRole('status').filter({ hasText: /^Link copiado$/ }).waitFor();
  assert.deepEqual(await visit(page), beforeShare);
  const [link] = await page.evaluate(() => window.copiedLinks);
  assert.equal(link, base + recife + '?tipo=cervix&modo=hoje');

  const recipient = await browser.newContext({ ...phone, colorScheme: 'dark' });
  t.after(() => recipient.close());
  const received = await recipient.newPage();
  received.setDefaultTimeout(10000);
  await received.goto(link);
  await received.getByRole('heading', { name: 'Recife (PE)', exact: true }).waitFor();
  await received.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
  await received.getByRole('button', { name: /Até 60 dias · Colo do útero · Como está hoje/i }).waitFor();
  assert.equal(await received.locator('[data-map-view]').isVisible(), true);
  assert.equal(await received.locator('html').getAttribute('data-theme'), null);
  assert.equal(await received.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches), true);
  assert.equal(received.url(), link);

  const noScript = await browser.newContext({ ...phone, javaScriptEnabled: false });
  t.after(() => noScript.close());
  const staticPage = await noScript.newPage();
  staticPage.setDefaultTimeout(10000);
  await staticPage.goto(link);
  await staticPage.getByRole('heading', { name: 'Recife (PE)', exact: true }).waitFor();
  await staticPage.getByText('Acesso ao tratamento', { exact: true }).first().waitFor();
  assert.equal(await shareButton(staticPage).count(), 0);
});

test('cancelling native sharing returns to the same consultation without copying', async t => {
  const page = await openConsultation(t, phone, { share: 'cancel', clipboard: 'success' });
  await shareButton(page).waitFor();
  const beforeShare = await visit(page);
  await shareButton(page).press('Enter');
  await page.waitForFunction(() => window.shareCalls.length === 1);
  assert.deepEqual(await page.evaluate(() => window.copiedLinks), []);
  assert.deepEqual(await visit(page), beforeShare);
  assert.equal(await shareButton(page).evaluate(button => button === document.activeElement), true);
  assert.equal(await page.getByText('Link copiado', { exact: true }).count(), 0);
  assert.equal(await page.getByRole('textbox', { name: 'Link da consulta municipal' }).count(), 0);
});

test('when native sharing and clipboard fail, desktop exposes a focused, selected, read-only link', async t => {
  const page = await openConsultation(t, { viewport: { width: 1280, height: 800 } },
    { share: 'fail', clipboard: 'fail' }, recife + '?indicador=mammography&tipo=breast&theme=dark');
  const heading = await page.getByRole('heading', { name: 'Recife (PE)', exact: true }).boundingBox();
  const share = await shareButton(page).boundingBox();
  assert.ok(share.x >= heading.x + heading.width && share.y < heading.y + heading.height);
  const beforeShare = await visit(page);
  await shareButton(page).click();
  const field = page.getByRole('textbox', { name: 'Link da consulta municipal' });
  await field.waitFor();
  const url = base + recife + '?indicador=mammography&tipo=breast';
  assert.deepEqual(await page.evaluate(() => window.copiedLinks), [url]);
  assert.equal(await field.inputValue(), url);
  assert.deepEqual(await field.evaluate(input => ({
    focused: input === document.activeElement,
    readOnly: input.readOnly,
    selection: input.value.slice(input.selectionStart, input.selectionEnd),
  })), { focused: true, readOnly: true, selection: url });
  assert.deepEqual(await visit(page), beforeShare);
});

test('manual copying stays available and focused across a change of layout', async t => {
  const page = await openConsultation(t, phone, { share: null, clipboard: 'deferred' });
  await shareButton(page).press('Enter');
  await page.waitForFunction(() => window.rejectClipboard);
  await page.setViewportSize({ width: 1280, height: 800 });
  await shareButton(page).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.rejectClipboard());
  const field = page.getByRole('textbox', { name: 'Link da consulta municipal' });
  await field.waitFor();
  assert.equal(await field.inputValue(), base + recife);
  assert.equal(await field.evaluate(input => input === document.activeElement), true);
  await page.setViewportSize({ width: 568, height: 160 });
  const details = page.getByRole('button', { name: 'Ver detalhes', exact: true });
  await details.waitFor();
  assert.equal(await field.evaluate(input => input === document.activeElement), true);
  await page.waitForFunction(() => {
    const field = document.activeElement;
    if (!(field instanceof HTMLInputElement) || !field.readOnly) return false;
    const { top, bottom } = field.getBoundingClientRect();
    return top >= -1 && bottom <= innerHeight + 1;
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await field.scrollIntoViewIfNeeded();
  assert.equal(await field.evaluate(input => input === document.activeElement), true);

  await page.setViewportSize(phone.viewport);
  await details.press('Enter');
  await shareButton(page).focus();
  await page.goBack();
  await details.waitFor();
  assert.equal(await details.evaluate(button => button === document.activeElement), true);
});
