import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

// Public-browser evidence runner for #51. Each attempt retains its own outcome.
const base = process.env.SITE_URL ?? 'http://127.0.0.1:4328';
const output = process.env.MOBILE_REPORT_DIR ?? '/tmp/mobile-navigation-evidence';
const arrival = process.env.MOBILE_ARRIVAL ?? 'search';
assert.ok(['search', 'canvas'].includes(arrival));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/snap/bin/chromium',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const records = [];
const composed = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
async function select(page) {
  if (arrival === 'canvas') {
    const box = await page.locator('.maplibregl-canvas').boundingBox();
    let point;
    for (let y = box.y + 120; !point && y < box.y + box.height - 140; y += 50) {
      for (let x = box.x + 40; x < box.x + box.width - 30; x += 50) {
        await page.mouse.move(0, 0);
        await composed(page);
        await page.mouse.move(x, y);
        await composed(page);
        if (await page.locator('.map-tooltip strong').count()) { point = { x, y }; break; }
      }
    }
    assert.ok(point, 'a municipality is reachable through public canvas hover');
    await page.mouse.move(0, 0);
    await page.touchscreen.tap(point.x, point.y);
    await page.locator('.profile').waitFor({ state: 'attached' });
    await composed(page);
    return;
  }
  await page.locator('.search-toggle').tap();
  await page.locator('#municipality-search:enabled').fill('Recife PE');
  await page.locator('#municipality-results button').tap();
  await page.locator('.profile[data-code="261160"]').waitFor({ state: 'attached' });
  await composed(page);
}
async function snapshot(page) {
  return page.evaluate(() => {
    const rect = selector => {
      const element = document.querySelector(selector);
      const r = element.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, position: getComputedStyle(element).position };
    };
    return {
      url: location.href, viewport: [innerWidth, innerHeight], scroll: [scrollX, scrollY],
      document: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
      focus: document.activeElement?.id || document.activeElement?.tagName,
      heading: rect('#preview-heading'), notice: rect('.construction-notice'),
      filters: rect('#map-filters'), popover: document.querySelector('#map-filters').matches(':popover-open'),
      details: document.querySelector('[data-preview-content]').getBoundingClientRect().height > 0,
    };
  });
}
try {
  for (const [width, height] of [[320, 568], [390, 844]]) {
    for (const cache of ['cold', 'warm']) {
      for (let attempt = 1; attempt <= 10; attempt++) {
        const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true });
        const page = await context.newPage();
        const cached = [];
        const resources = [];
        page.on('response', response => {
          if (/\/profiles\/|\/municipio\//.test(response.url())) resources.push({ url: response.url(), status: response.status() });
        });
        const session = await context.newCDPSession(page);
        await session.send('Network.enable');
        session.on('Network.requestServedFromCache', event => cached.push(event.requestId));
        const record = { width, height, cache, arrival, attempt, scenarios: [] };
        records.push(record);
        try {
          await page.goto(base + '/?theme=dark');
          await page.locator('.map-status').waitFor({ state: 'hidden' });
          if (cache === 'warm') {
            await select(page);
            await page.locator('.identity').tap();
            await page.waitForFunction(() => location.pathname === '/' && document.querySelector('#data-status').textContent === '');
            await page.locator('.map-status').waitFor({ state: 'hidden' });
            await composed(page);
            if (arrival === 'canvas') {
              // Prime the target after country framing, then keep that camera.
              await select(page);
              record.primedUrl = page.url();
              await page.locator('[data-clear-profile]').tap();
              await page.waitForFunction(() => location.pathname === '/');
              await composed(page);
            }
          }
          const cacheStart = cached.length;
          const resourceStart = resources.length;
          await select(page);
          const selection = await snapshot(page);
          record.scenarios.push({ scenario: 'first selection', observed: selection });
          assert.equal(selection.focus, arrival === 'canvas' ? 'CANVAS' : 'preview-heading');
          assert.deepEqual(selection.scroll, [0, 0]);
          assert.ok(selection.document[0] <= width && selection.document[1] <= height);
          assert.ok(selection.heading.top >= selection.notice.bottom && selection.heading.bottom <= height);
          assert.equal(selection.popover, false, 'filters stay closed until requested');
          assert.equal(selection.filters.bottom - selection.filters.top, 0, 'no permanent filters in the document flow');
          assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
          await page.locator('.filters-toggle').tap();
          await page.locator('#map-filters').waitFor({ state: 'visible' });
          await composed(page);
          const filters = await snapshot(page);
          record.scenarios.push({ scenario: 'filters', observed: filters });
          assert.equal(filters.popover, true);
          assert.ok(filters.filters.top >= filters.notice.bottom && filters.filters.bottom <= height);
          assert.deepEqual(filters.scroll, [0, 0]);
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('.filters-toggle').evaluate(e => e === document.activeElement), true);
          await page.locator('.identity').tap();
          await page.waitForFunction(() => location.pathname === '/' && document.querySelector('#data-status').textContent === '');
          await composed(page);
          record.scenarios.push({ scenario: 'logo after selection', observed: await snapshot(page) });
          assert.equal(new URL(page.url()).search, '?theme=dark');
          assert.equal(await page.locator('#municipality-preview').isVisible(), false);
          assert.equal(await page.locator('[data-view="mapa"]').getAttribute('aria-pressed'), 'true');
          record.cacheEventsDuringSequence = cached.length - cacheStart;
          record.profileResponsesDuringSequence = resources.slice(resourceStart);
          if (cache === 'warm') {
            if (record.primedUrl) assert.equal(record.scenarios[0].observed.url, record.primedUrl);
            assert.equal(record.profileResponsesDuringSequence.length, 0, 'warm selection reuses prepared profile and document');
          }
          record.status = 'passed';
        } catch (error) {
          record.status = 'failed';
          record.error = String(error.stack ?? error);
          await page.screenshot({ path: `${output}/${width}-${cache}-${attempt}.png`, fullPage: true }).catch(() => {});
        } finally {
          await context.close();
          await writeFile(`${output}/attempts.json`, JSON.stringify({ base, browser: browser.version(), records }, null, 2) + '\n');
          console.log(`${width}x${height} ${cache} ${attempt}/10: ${record.status}`);
        }
      }
    }
  }
} finally { await browser.close(); }
assert.equal(records.filter(record => record.status === 'failed').length, 0, `see ${output}/attempts.json`);
