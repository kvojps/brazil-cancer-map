import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
let browser;
before(async () => {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/snap/bin/chromium', args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
});
after(async () => { await browser?.close(); });

const afterComposition = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

// Read the geography through the same hover labels available to a mouse user.
async function labelAt(page, point) {
  await page.mouse.move(point.x, point.y);
  await page.waitForTimeout(80);
  return page.locator('.map-tooltip strong').first().evaluateAll(elements => elements[0]?.textContent ?? null);
}

async function visibleSamples(page) {
  const box = await page.locator('.maplibregl-canvas').boundingBox();
  const samples = [];
  for (let y = box.y + 100; y < box.y + box.height - 120; y += 45) {
    for (let x = box.x + 45; x < box.x + box.width - 35; x += 45) {
      const point = { x, y };
      if (!await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName === 'CANVAS', point)) continue;
      const name = await labelAt(page, point);
      if (name) samples.push({ name, point });
    }
  }
  return samples;
}

test('canvas touch clears hover and successive selections preserve the visible geography on a hybrid device', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(`${base}/municipio/261160-recife/`);
    await page.locator('.map-status').waitFor({ state: 'hidden' });
    await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
    // Change the camera using the public zoom control before exploring neighbours.
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await page.waitForTimeout(400);
    await page.mouse.move(190, 280);
    await page.mouse.down();
    await page.mouse.move(215, 290, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    const samples = await visibleSamples(page);
    const places = new Map(samples.toReversed().map(({ name, point }) => [name, point]));
    assert.ok(places.size >= 2, 'at least two municipalities can be explored');
    const points = [...places].slice(0, 2);
    for (const [name, point] of [...points, points[0]]) {
      assert.equal(await labelAt(page, point), name, `the same screen position still represents ${name} at ${JSON.stringify(point)}`);
      await page.touchscreen.tap(point.x, point.y);
      await page.waitForFunction(name => document.querySelector('#preview-heading').textContent === name, name);
      await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
      assert.equal(await page.locator('.maplibregl-popup').count(), 0, 'touch removes the previous mouse tooltip');
      assert.equal(await page.locator('[data-toggle-profile]').getAttribute('aria-expanded'), 'false');
      // A real mouse movement after touch restores hover without a media-query change.
      await page.mouse.move(point.x + 2, point.y + 2);
      assert.equal(await labelAt(page, point), name);
    }
    const beforeReturn = [];
    for (const [, point] of points) beforeReturn.push(await labelAt(page, point));
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).click();
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    for (const [index, [, point]] of points.entries()) assert.equal(await labelAt(page, point), beforeReturn[index], 'returning from details preserves the camera');
    await page.locator('[data-view="lista"]').click();
    await page.locator('.indicator-table tbody tr').first().waitFor();
    await page.locator('[data-view="mapa"]').click();
    for (const [index, [, point]] of points.entries()) assert.equal(await labelAt(page, point), beforeReturn[index], 'switching visualizations preserves the camera');
    await page.locator('[data-view="lista"]').click();
    const alternate = points[1][0];
    await page.locator('.indicator-table select').selectOption('PE');
    await page.getByRole('link', { name: alternate.replace(/ \([A-Z]{2}\)$/, ''), exact: true }).click();
    await page.waitForFunction(name => document.querySelector('#preview-heading').textContent === name, alternate);
    await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
    await page.locator('[data-view="mapa"]').click();
    for (const [index, [, point]] of points.entries()) assert.equal(await labelAt(page, point), beforeReturn[index], 'a list selection preserves deliberate zoom and visible geography');

  } finally { await page.close(); }
});

for (const arrival of ['direct link', 'search', 'search retry']) {
  test(`${arrival} frames Recife itself in the useful map area`, async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    try {
      if (arrival === 'search retry') await page.route('**/profiles/PE.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
      await page.goto(base + (arrival === 'direct link' ? '/municipio/261160-recife/?tipo=breast&theme=dark' : '/?tipo=breast&theme=dark'));
      await page.locator('.map-status').waitFor({ state: 'hidden' });
      if (arrival.startsWith('search')) {
        await page.locator('.search-toggle').click();
        await page.locator('#municipality-search:enabled').fill('Recife PE');
        await page.locator('#municipality-results button').click();
      }
      if (arrival === 'search retry') {
        await page.getByRole('button', { name: 'Tentar novamente', exact: true }).waitFor();
        await page.unroute('**/profiles/PE.json');
        await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
      }
      await page.locator('#municipality-content .profile[data-code="261160"]').waitFor({ state: 'attached' });
      const samples = await visibleSamples(page);
      const recife = samples.filter(sample => sample.name === 'Recife (PE)');
      assert.ok(recife.length >= 3, `Recife occupies multiple visible map cells, rather than the entire UF being fitted (${recife.length})`);
      if (arrival === 'search retry') {
        const reference = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
        try {
          await reference.goto(`${base}/municipio/261160-recife/?tipo=breast&theme=dark`);
          await reference.locator('.map-status').waitFor({ state: 'hidden' });
          await reference.locator('#municipality-content .profile').waitFor({ state: 'attached' });
          for (const { name, point } of await visibleSamples(reference)) {
            assert.equal(await labelAt(page, point), name, 'retry frames against the loaded summary just like a successful arrival');
          }
        } finally { await reference.close(); }
      }
      assert.match(new URL(page.url()).pathname, /261160-recife/);
      assert.equal(new URL(page.url()).searchParams.get('tipo'), 'breast');
      assert.equal(new URL(page.url()).searchParams.get('theme'), 'dark');
      assert.equal(await page.locator('[data-toggle-profile]').getAttribute('aria-expanded'), 'false');
      assert.ok((await page.locator('[data-profile-result]').innerText()).trim(), 'the summary has a readable result');
      const selectedUrl = page.url();
      await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
      assert.equal(await page.locator('[data-profile-axis]').count(), 4);
      assert.equal(await page.locator('[data-preview-content]').isVisible(), true);
      await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).click();
      await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
      assert.equal(page.url(), selectedUrl, 'returning keeps the selected municipality and filters');
      for (const { name, point } of samples) assert.equal(await labelAt(page, point), name, 'returning keeps the arrival framing');
    } finally { await page.close(); }
  });
}

test('the first canvas touch opens only the collapsed sheet and paints a selection outline', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'light' });
  try {
    await page.goto(base);
    await page.locator('.map-status').waitFor({ state: 'hidden' });
    const samples = await visibleSamples(page);
    assert.ok(samples.length);
    const { name, point } = samples[Math.floor(samples.length / 2)];
    await page.mouse.move(0, 0);
    await page.touchscreen.tap(point.x, point.y);
    await page.waitForFunction(name => document.querySelector('#preview-heading').textContent === name, name);
    await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
    assert.equal(await page.locator('.maplibregl-popup').count(), 0);
    assert.equal(await page.locator('[data-toggle-profile]').getAttribute('aria-expanded'), 'false');
    assert.match(new URL(page.url()).pathname, /^\/municipio\/\d{6}-/);
    assert.equal(await page.evaluate(() => scrollY), 0, 'first touch preserves page scroll');
    assert.equal(await page.locator('#map-filters').evaluate(node => node.matches(':popover-open')), false);
    assert.equal(await page.locator('#map-indicator').isVisible(), false, 'permanent filters stay out of the floating composition');
    assert.equal(await page.locator('#preview-heading').evaluate(node => node === document.activeElement), false);
    // Hide only HTML overlays for this capture; the geographic outline must be painted in WebGL.
    const png = await page.locator('.maplibregl-canvas').screenshot({ style: '.site-header, .map-controls, .filters-toggle, .map-notes, .legend-corner, .view-controls, #municipality-preview, [data-panel-legend], .maplibregl-control-container { visibility: hidden !important; }' });
    const blackPixels = await page.evaluate(async base64 => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
      let count = 0;
      for (let i = 0; i < data.length; i += 4) if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0 && data[i + 3] === 255) count++;
      return count;
    }, png.toString('base64'));
    assert.ok(blackPixels > 4, 'the black selection outline is visible on the light map');
    assert.ok((await visibleSamples(page)).some(sample => sample.name === name), 'the selected municipality remains visible outside the sheet');
    assert.ok((await page.locator('[data-profile-result]').innerText()).trim(), 'the touch selection has a readable summary');
    const selectedUrl = page.url();
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    assert.equal(await page.locator('[data-profile-axis]').count(), 4);
    assert.equal(await page.locator('[data-preview-content]').isVisible(), true);
    await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).click();
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    assert.equal(page.url(), selectedUrl);
    assert.equal(await labelAt(page, point), name, 'returning preserves the touched territory at the same point');
  } finally { await page.close(); }
});

test('an unobstructed touch near the canvas edge does not shift a visible municipal boundary', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(`${base}/municipio/261160-recife/`);
    await page.locator('.map-status').waitFor({ state: 'hidden' });
    await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
    const box = await page.locator('.maplibregl-canvas').boundingBox();
    await page.waitForTimeout(300);
    let edge;
    let name;
    for (let y = box.y + 140; y < box.y + 320; y += 20) {
      const point = { x: box.x + 10, y };
      const label = await labelAt(page, point);
      if (label) { edge = point; name = label; break; }
    }
    assert.ok(name, 'a municipality is reachable at the unobstructed edge');
    let left = edge.x;
    let right = box.x + box.width - 20;
    assert.notEqual(await labelAt(page, { x: right, y: edge.y }), name);
    // Locate a rendered boundary to one pixel, so even a small unsolicited pan is observable.
    while (right - left > 1) {
      const middle = Math.floor((left + right) / 2);
      if (await labelAt(page, { x: middle, y: edge.y }) === name) left = middle;
      else right = middle;
    }
    const boundary = [{ x: left, y: edge.y }, { x: right, y: edge.y }];
    const before = [await labelAt(page, boundary[0]), await labelAt(page, boundary[1])];
    await page.touchscreen.tap(edge.x, edge.y);
    await page.waitForFunction(name => document.querySelector('#preview-heading').textContent === name, name);
    await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
    for (let i = 0; i < boundary.length; i++) assert.equal(await labelAt(page, boundary[i]), before[i], 'the rendered boundary stays at the same pixel');
  } finally { await page.close(); }
});

test('rotation keeps the selected municipality and the explored zoom when returning to portrait', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(`${base}/municipio/261160-recife/?tipo=breast&theme=dark`);
    await page.locator('.map-status').waitFor({ state: 'hidden' });
    await page.locator('.result-value').waitFor();
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await page.waitForTimeout(400);
    const samples = await visibleSamples(page);
    assert.ok(samples.length > 2, 'the zoomed map shows geography to compare after rotation');
    const url = page.url();
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(400);
    assert.equal(await page.locator('#preview-heading').innerText(), 'Recife (PE)');
    assert.equal(page.url(), url);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    for (const { name, point } of samples) assert.equal(await labelAt(page, point), name, 'rotation does not refit the municipality or lose the explored zoom');
  } finally { await page.close(); }
});

test('recovering useful height restores canvas exploration without exposing permanent filters', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 740 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(`${base}/municipio/261160-recife/?tipo=breast&theme=dark`);
    await page.locator('.map-status').waitFor({ state: 'hidden' });
    await page.locator('.result-value').waitFor();
    const samples = await visibleSamples(page);
    const recife = samples.find(sample => sample.name === 'Recife (PE)');
    assert.ok(recife, 'Recife is reachable on the canvas');
    const url = page.url();
    await page.setViewportSize({ width: 390, height: 390 });
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#municipality-preview')).position === 'static');
    await page.setViewportSize({ width: 390, height: 740 });
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#municipality-preview')).position === 'fixed', null, { timeout: 3000 });
    await page.touchscreen.tap(recife.point.x, recife.point.y);
    await page.waitForFunction(() => document.querySelector('[data-toggle-profile]').getAttribute('aria-expanded') === 'false');
    assert.equal(await page.locator('#preview-heading').innerText(), recife.name);
    assert.equal(page.url(), url);
    assert.equal(await page.evaluate(() => scrollY), 0);
    assert.equal(await page.locator('#map-filters').evaluate(node => node.matches(':popover-open')), false);
    assert.equal(await page.locator('#map-indicator').isVisible(), false);
    assert.equal(await page.locator('#preview-heading').evaluate(node => node === document.activeElement), false, 'canvas selection does not focus the heading');
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).click();
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).waitFor();
    assert.equal(page.url(), url);
    for (const { name, point } of samples) assert.equal(await labelAt(page, point), name, 'height recovery and details preserve the camera');
  } finally { await page.close(); }
});

for (const height of [568, 664, 740, 844]) {
  test(`first cold canvas touch reaches the loaded result at 390 × ${height}`, async () => {
    const page = await browser.newPage({ viewport: { width: 390, height }, isMobile: true, hasTouch: true });
    try {
      await page.goto(base);
      await page.locator('.map-status').waitFor({ state: 'hidden' });
      const samples = await visibleSamples(page);
      assert.ok(samples.length, 'a municipality is reachable without a prior selection');
      const { point } = samples[Math.floor(samples.length / 2)];
      await page.mouse.move(0, 0);
      await page.touchscreen.tap(point.x, point.y);
      await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
      await afterComposition(page);
      const arrival = await page.evaluate(() => {
        const heading = document.querySelector('#preview-heading');
        const result = document.querySelector('[data-profile-result]');
        return { top: heading.getBoundingClientRect().top, bottom: result.getBoundingClientRect().bottom,
          clearance: document.querySelector('.construction-notice').getBoundingClientRect().bottom,
          height: innerHeight, scroll: scrollY,
          canvasFocus: document.activeElement?.tagName === 'CANVAS' };
      });
      assert.match(new URL(page.url()).pathname, /^\/municipio\/\d{6}-/);
      assert.equal(await page.locator('#municipality-content .profile').getAttribute('data-code'), new URL(page.url()).pathname.split('/')[2].slice(0, 6));
      assert.ok(arrival.top >= arrival.clearance - 1 && arrival.top < arrival.height, JSON.stringify(arrival));
      assert.ok(arrival.bottom <= arrival.height, 'the current result is visible');
      assert.equal(await page.locator('[data-preview-content]').isVisible(), false, 'first touch keeps deliberate details in every composition');
      await page.getByRole('button', { name: 'Ver detalhes', exact: true }).tap();
      assert.equal(await page.locator('[data-preview-content]').isVisible(), true);
      await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).tap();
      assert.equal(await page.locator('[data-preview-content]').isVisible(), false);
      assert.equal(await page.locator('#map-filters').evaluate(node => node.matches(':popover-open')), false);
      assert.equal(arrival.scroll, 0);
      assert.equal(arrival.canvasFocus, true);
    } finally { await page.close(); }
  });
}

for (const action of ['retry', 'deliberate scroll', 'new selection', 'clear selection']) {
  test(`a delayed first touch respects ${action}`, async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true });
    let release;
    const held = new Promise(resolve => { release = resolve; });
    let requested;
    const started = new Promise(resolve => { requested = resolve; });
    try {
      await page.route('**/profiles/*.json', async route => {
        requested();
        await held;
        if (action === 'retry') await route.fulfill({ status: 503, body: 'Unavailable' });
        else await route.continue();
      });
      await page.goto(base);
      await page.locator('.map-status').waitFor({ state: 'hidden' });
      const samples = await visibleSamples(page);
      assert.ok(samples.length);
      const { point } = samples[Math.floor(samples.length / 2)];
      await page.mouse.move(0, 0);
      await page.touchscreen.tap(point.x, point.y);
      await started;
      if (action === 'clear selection') {
        await page.locator('[data-clear-profile]').click();
        const clearedUrl = page.url();
        release();
        await page.waitForLoadState('networkidle');
        assert.equal(await page.locator('#municipality-preview').isVisible(), false);
        assert.equal(await page.locator('.result-value').count(), 0);
        assert.equal(page.url(), clearedUrl);
        assert.equal(await page.evaluate(() => scrollY), 0);
        assert.equal(await page.locator('.search-toggle').evaluate(node => node === document.activeElement), true);
      } else if (action === 'deliberate scroll') {
        await page.setViewportSize({ width: 390, height: 390 });
        await page.mouse.move(20, 150);
        await page.mouse.wheel(0, 150);
        await page.waitForTimeout(200);
        const position = await page.evaluate(() => scrollY);
        assert.ok(position > 0, 'the person has scrolled before the profile arrives');
        release();
        await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
        await afterComposition(page);
        assert.ok(Math.abs(await page.evaluate(() => scrollY) - position) < 3, 'late data preserves deliberate reading');
        assert.equal(await page.locator('#preview-heading').evaluate(node => node === document.activeElement), false);
      } else if (action === 'new selection') {
        await page.locator('.search-toggle').click();
        await page.locator('#municipality-search').fill('Recife PE');
        await page.locator('#municipality-results button').click();
        release();
        await page.locator('#municipality-content .profile[data-code="261160"]').waitFor({ state: 'attached' });
        await afterComposition(page);
        assert.equal(await page.locator('#preview-heading').innerText(), 'Recife (PE)');
        assert.match(new URL(page.url()).pathname, /261160-recife/);
        const box = await page.locator('#preview-heading').boundingBox();
        assert.ok(box.y >= 74 && box.y < 664, 'only the current selection receives arrival');
      } else {
        release();
        await page.getByRole('button', { name: 'Tentar novamente', exact: true }).waitFor();
        await page.unroute('**/profiles/*.json');
        await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
        await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
        await afterComposition(page);
        const box = await page.locator('#preview-heading').boundingBox();
        assert.ok(box.y >= 74 && box.y < 664, 'retry reaches the result after layout changes');
        // Selecting the same place through search reuses the loaded profile and document.
        const url = page.url();
        const name = await page.locator('#preview-heading').innerText();
        await page.evaluate(() => scrollTo(0, 0));
        if (await page.locator('.search-toggle').isVisible()) await page.locator('.search-toggle').click();
        await page.locator('#municipality-search').fill(name);
        await page.getByRole('button', { name, exact: true }).click();
        await afterComposition(page);
        assert.equal(page.url(), url);
        assert.ok((await page.locator('#preview-heading').boundingBox()).y < 664, 'warm selection reaches the result');
      }
      assert.equal(await page.locator('#map-filters').evaluate(node => node.matches(':popover-open')), false);
    } finally { release(); await page.close(); }
  });
}

test('cold keyboard search reaches the result after Enter initiates selection', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(base);
    await page.locator('.search-toggle').click();
    await page.locator('#municipality-search:enabled').fill('Recife PE');
    await page.locator('#municipality-search').press('Enter');
    await page.locator('#municipality-content .profile[data-code="261160"]').waitFor({ state: 'attached' });
    await afterComposition(page);
    const box = await page.locator('#preview-heading').boundingBox();
    assert.ok(box.y >= 74 && box.y < 664, 'Enter does not cancel its own arrival');
    assert.equal(await page.locator('#preview-heading').evaluate(node => node === document.activeElement), true);
    assert.equal(await page.locator('#map-filters').evaluate(node => node.matches(':popover-open')), false);
    assert.equal(await page.evaluate(() => scrollY), 0);
  } finally { await page.close(); }
});
