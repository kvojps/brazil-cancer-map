import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
let browser;
before(async () => {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/snap/bin/chromium', args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
});
after(async () => { await browser?.close(); });

for (const theme of ['light', 'dark']) {
  test(`${theme}: chart labels remain at least 12 px in a narrow screen`, async () => {
    const page = await browser.newPage({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
    try {
      await page.goto(`${base}/municipio/261160-recife/?theme=${theme}`);
      await page.locator('.result-value').waitFor();
      const details = page.getByRole('button', { name: 'Ver detalhes', exact: true });
      if (await details.isVisible()) await details.press('Enter');
      for (const axis of ['acesso', 'deteccao', 'prevencao', 'panorama']) {
        const section = page.locator(`#${axis}`);
        if (await section.getAttribute('open') === null) await section.locator(':scope > summary').click();
        for (const chart of await section.locator('svg[role="img"]').all()) {
          if (!await chart.isVisible()) continue;
          await chart.scrollIntoViewIfNeeded();
          const labels = await chart.locator('text').evaluateAll(nodes => nodes.map(node => ({
            size: parseFloat(getComputedStyle(node).fontSize) * node.getScreenCTM().d,
            bounds: node.getBoundingClientRect().toJSON(),
            chart: node.ownerSVGElement.getBoundingClientRect().toJSON(),
          })));
          for (const label of labels) {
            assert.ok(label.size >= 12, `rendered font ${label.size}px must reach 12px`);
            assert.ok(label.bounds.left >= label.chart.left - 1 && label.bounds.right <= label.chart.right + 1, 'axis label stays inside the chart');
          }
        }
      }
      await page.locator('#acesso > summary').click();
      await page.locator('#acesso [data-cancer-type="all"]').getByText('Ver a série em tabela', { exact: true }).click();
      assert.ok(await page.locator('#acesso [data-cancer-type="all"] table').isVisible());
    } finally { await page.close(); }
  });
}

test('a long summary leaves the map useful by moving the consultation into page flow', async () => {
  const page = await browser.newPage({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(base + '/municipio/210020-alcantara/');
    await page.locator('.result-warning').waitFor();
    assert.equal(await page.locator('#municipality-preview').evaluate(node => getComputedStyle(node).position), 'static');
    await page.locator('[data-clear-profile]').scrollIntoViewIfNeeded();
    assert.ok(await page.locator('[data-clear-profile]').evaluate(node => { const r = node.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }));
    assert.match(await page.locator('[data-profile-result]').innerText(), /vizinhos/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  } finally { await page.close(); }
});

for (const theme of ['light', 'dark']) for (const [width, height] of [[390, 844], [320, 568], [844, 390], [568, 320], [390, 360]]) {
  test(`${theme} ${width}x${height}: search, last list row and panel actions remain reachable`, async () => {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true });
    try {
      await page.goto(`${base}/?visualizacao=lista&theme=${theme}`);
      await page.locator('.indicator-table select').selectOption('PE');
      const input = page.locator('#municipality-search');
      if (!await input.isVisible()) await page.locator('.search-toggle').click();
      await input.fill('Recife');
      await page.locator('#municipality-results button').first().waitFor();
      await input.press('Enter');
      await page.locator('.result-value').waitFor();
      const row = page.locator('.indicator-table tbody tr').last();
      const link = row.locator('a');
      await link.focus();
      await link.scrollIntoViewIfNeeded();
      const covered = await link.evaluate(node => {
        const r = node.getBoundingClientRect();
        return !node.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
      });
      assert.equal(covered, false, 'last row is not behind fixed surfaces');
      await page.locator('[data-clear-profile]').scrollIntoViewIfNeeded();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    } finally { await page.close(); }
  });
}

test('reducing the search viewport keeps its results and keyboard focus reachable', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(base + '/');
    await page.locator('.search-toggle').click();
    const input = page.locator('#municipality-search');
    await input.fill('Recife');
    await page.locator('#municipality-results button').first().waitFor();
    await page.setViewportSize({ width: 390, height: 360 });
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.municipality-search')).position === 'relative');
    assert.equal(await input.evaluate(node => node === document.activeElement), true);
    await input.press('Enter');
    await page.locator('.result-value').waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    assert.match(page.url(), /261160-recife/);
  } finally { await page.close(); }
});

test('a long caveat without municipal selection also moves the controls into page flow', async () => {
  const page = await browser.newPage({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(base + '/?tipo=prostate');
    await page.locator('#indicator-caveat').waitFor();
    assert.match(await page.locator('#indicator-caveat').innerText(), /vigilância ativa/);
    assert.equal(await page.locator('.map-controls').evaluate(node => getComputedStyle(node).position), 'relative');
    await page.locator('#indicator-caveat').scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  } finally { await page.close(); }
});
