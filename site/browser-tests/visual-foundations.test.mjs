import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';

// The contract of the visual foundations decision (docs/ui-contract.md, section Fundamentos visuais).
const base = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
const PAGES = ['/', '/municipios/', '/metodologia/', '/municipio/261160-recife/'];
const NOTICE = 'Em construção. Este site ainda está sendo desenvolvido e os números não passaram por uma validação completa: podem conter erros e mudar.';
const COLORS = {
  light: { page: 'rgb(245, 245, 245)', noticeBg: 'rgb(23, 23, 23)', noticeText: 'rgb(250, 250, 250)', improving: 'rgb(15, 110, 107)', soft: 'rgb(239, 239, 239)', surface: 'rgb(255, 255, 255)', text: 'rgb(23, 23, 23)', chart: 'rgb(26, 86, 176)' },
  dark: { page: 'rgb(10, 10, 10)', noticeBg: 'rgb(245, 245, 245)', noticeText: 'rgb(23, 23, 23)', improving: 'rgb(53, 189, 182)', soft: 'rgb(42, 42, 42)', surface: 'rgb(26, 26, 26)', text: 'rgb(245, 245, 245)', chart: 'rgb(138, 180, 248)' },
};

let browser;
before(async () => {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/snap/bin/chromium', headless: true, args: ['--no-sandbox'] });
});
after(async () => { await browser?.close(); });

const style = (locator, property) => locator.evaluate((element, name) => getComputedStyle(element)[name], property);
const normalized = text => text.replace(/\s+/g, ' ').trim();

for (const javaScriptEnabled of [false, true]) {
  for (const colorScheme of ['light', 'dark']) {
    test(`the notice stays whole, inverted and visible when scrolled: ${colorScheme}, JavaScript ${javaScriptEnabled}`, async () => {
      const page = await browser.newPage({ javaScriptEnabled, colorScheme, viewport: { width: 1280, height: 600 } });
      try {
        for (const path of PAGES) {
          await page.goto(base + path);
          const notice = page.locator('.construction-notice');
          assert.equal(normalized(await notice.textContent()), NOTICE, path);
          assert.equal(await notice.locator('button, a').count(), 0, `${path}: nothing closes the notice`);
          assert.equal(await style(notice, 'backgroundColor'), COLORS[colorScheme].noticeBg, path);
          assert.equal(await style(notice, 'color'), COLORS[colorScheme].noticeText, path);
          for (const width of [320, 768, 1280]) {
            await page.setViewportSize({ width, height: 600 });
            await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
            const box = await notice.boundingBox();
            assert.equal(box.y, 0, `${path} at ${width}px`);
            assert.equal(await notice.evaluate(el => document.elementFromPoint(innerWidth / 2, el.getBoundingClientRect().height / 2) === el || el.contains(document.elementFromPoint(innerWidth / 2, el.getBoundingClientRect().height / 2))), true, `${path} at ${width}px: on top`);
          }
          await page.setViewportSize({ width: 1280, height: 600 });
        }
      } finally { await page.close(); }
    });

    test(`the theme follows the system preference: ${colorScheme}, JavaScript ${javaScriptEnabled}`, async () => {
      const page = await browser.newPage({ javaScriptEnabled, colorScheme });
      try {
        await page.goto(base + '/');
        assert.equal(await style(page.locator('html'), 'backgroundColor'), COLORS[colorScheme].page);
        const swatch = page.locator('.trend-legend .swatch').first();
        assert.equal(await style(swatch, 'backgroundColor'), COLORS[colorScheme].improving);
        await page.goto(base + '/municipio/261160-recife/');
        const chartLine = page.locator('.profile svg line[stroke-width="2"]').first();
        assert.equal(await style(chartLine, 'stroke'), COLORS[colorScheme].chart);
      } finally { await page.close(); }
    });
  }
}

test('an explicit theme overrides the system preference', async () => {
  for (const [colorScheme, theme] of [['light', 'dark'], ['dark', 'light']]) {
    const page = await browser.newPage({ colorScheme });
    try {
      await page.goto(`${base}/?theme=${theme}`);
      assert.equal(await style(page.locator('html'), 'backgroundColor'), COLORS[theme].page);
    } finally { await page.close(); }
  }
});

test('the theme control is left out when it could not work without JavaScript', async () => {
  const page = await browser.newPage({ javaScriptEnabled: false });
  try {
    await page.goto(base + '/');
    assert.equal(await page.locator('.theme-switcher').isVisible(), false);
  } finally { await page.close(); }
});

test('an anchor lands clear of the sticky notice', async () => {
  for (const width of [320, 768, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 700 } });
    try {
      await page.goto(`${base}/metodologia/#mamografia`);
      await page.waitForFunction(() => document.fonts.status === 'loaded');
      const target = await page.locator('[id="mamografia"]').boundingBox();
      const notice = await page.locator('.construction-notice').boundingBox();
      assert.ok(target.y >= notice.y + notice.height - 1, `${width}px: target at ${target.y}, notice ends at ${notice.height}`);
    } finally { await page.close(); }
  }
});

for (const [width, height] of [[1280, 40], [390, 44]]) {
  for (const colorScheme of ['light', 'dark']) {
    test(`controls are filled, borderless and ${height} px tall at ${width} px: ${colorScheme}`, async () => {
      const page = await browser.newPage({ colorScheme, viewport: { width, height: 900 } });
      try {
        await page.goto(base + '/');
        await page.locator('.view-controls:not([hidden]) button').first().waitFor();
        // On a phone the selectors and the search open from the header, one in place of the other.
        const opener = { '#map-indicator': '.filters-toggle', '#municipality-search': '.search-toggle' };
        for (const selector of ['#map-indicator', '#municipality-search', '.view-controls button[aria-pressed="false"]']) {
          if (width < 768 && opener[selector]) await page.locator(opener[selector]).click();
          const control = page.locator(selector).first();
          const box = await control.boundingBox();
          assert.equal(box.height, height, `${selector} height`);
          assert.equal(await style(control, 'borderTopWidth'), '0px', `${selector} border`);
          assert.equal(await style(control, 'borderTopLeftRadius'), '8px', `${selector} radius`);
          assert.equal(await style(control, 'backgroundColor'), COLORS[colorScheme].soft, `${selector} fill`);
        }
        const active = page.locator('.view-controls button[aria-pressed="true"]');
        assert.equal(await style(active, 'backgroundColor'), COLORS[colorScheme].text);
        assert.equal(await style(active, 'color'), COLORS[colorScheme].surface);
      } finally { await page.close(); }
    });
  }
}

test('Inter comes from this site, with the ≥ and tabular figures', async () => {
  const page = await browser.newPage();
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  try {
    await page.goto(base + '/');
    await page.evaluate(() => document.fonts.ready);
    const fonts = await page.evaluate(async () => {
      await document.fonts.load('16px "Inter Variable"');
      const measure = (text, family, numeric = 'tabular-nums') => {
        const span = document.createElement('span');
        span.style.cssText = `position:absolute;font:16px ${family};font-variant-numeric:${numeric}`;
        span.textContent = text;
        document.body.append(span);
        const width = span.getBoundingClientRect().width;
        span.remove();
        return width;
      };
      return {
        family: getComputedStyle(document.body).fontFamily,
        numeric: getComputedStyle(document.body).fontVariantNumeric,
        // A glyph the font lacks would fall back, and so differ between the two stacks.
        geSerif: measure('≥', '"Inter Variable", serif'),
        geMono: measure('≥', '"Inter Variable", monospace'),
        ones: measure('1111', '"Inter Variable"'),
        eights: measure('8888', '"Inter Variable"'),
        hyphen: measure('-', '"Inter Variable"'),
        hyphenProportional: measure('-', '"Inter Variable"', 'normal'),
        // MapLibre sets its own font on the map, which holds the tooltips.
        map: (() => {
          const map = document.createElement('div');
          map.className = 'maplibregl-map';
          document.body.append(map);
          const { fontFamily, fontVariantNumeric } = getComputedStyle(map);
          map.remove();
          return { fontFamily, fontVariantNumeric };
        })(),
        control: getComputedStyle(document.querySelector('#map-indicator')).fontVariantNumeric,
        controlWeight: getComputedStyle(document.querySelector('#map-indicator')).fontWeight,
      };
    });
    assert.match(fonts.family, /^"Inter Variable"/);
    assert.equal(fonts.numeric, 'tabular-nums');
    assert.match(fonts.map.fontFamily, /^"Inter Variable"/, 'the map uses Inter');
    assert.equal(fonts.map.fontVariantNumeric, 'tabular-nums', 'the map keeps tabular figures');
    assert.equal(fonts.control, 'tabular-nums', 'controls keep tabular figures');
    assert.equal(fonts.controlWeight, '500', 'controls use weight 500');
    assert.equal(fonts.geSerif, fonts.geMono, '≥ comes from Inter');
    assert.equal(fonts.ones, fonts.eights, 'figures are tabular');
    assert.equal(fonts.hyphen, fonts.hyphenProportional, 'only the figures turn tabular, not the punctuation of running text');
    const origin = new URL(base).origin;
    const fontRequests = requests.filter(url => /\.(woff2?|ttf|otf)(\?|$)|fonts\.g/.test(url));
    assert.ok(fontRequests.length > 0, 'the font was requested');
    assert.deepEqual(fontRequests.filter(url => !url.startsWith(origin)), [], 'no external font');
    const license = await page.request.get(`${base}/fonts/OFL.txt`);
    assert.equal(license.status(), 200);
    assert.match(await license.text(), /SIL Open Font License/);
  } finally { await page.close(); }
});

test('the silhouette of Brazil is the mark, in the color of the text', async () => {
  const page = await browser.newPage();
  try {
    for (const path of PAGES) {
      await page.goto(base + path);
      assert.doesNotMatch(await page.locator('header.site-header, footer').allTextContents().then(texts => texts.join(' ')), /◈/, path);
      const mark = page.locator('.identity svg');
      assert.equal(await mark.getAttribute('aria-hidden'), 'true', path);
      assert.equal(await style(mark, 'fill'), await style(page.locator('.identity'), 'color'), path);
      assert.equal(await page.locator('footer svg').count(), 1, `${path}: footer mark`);
    }
  } finally { await page.close(); }
});

for (const colorScheme of ['light', 'dark']) {
  for (const javaScriptEnabled of [false, true]) {
    test(`the keyboard reaches controls with a visible focus: ${colorScheme}, JavaScript ${javaScriptEnabled}`, async () => {
      const page = await browser.newPage({ colorScheme, javaScriptEnabled });
      try {
        await page.goto(base + '/municipios/');
        await page.keyboard.press('Tab');
        const skip = page.locator('.skip-link');
        assert.equal(await skip.evaluate(el => el === document.activeElement), true);
        assert.ok((await skip.boundingBox()).y >= 0, 'the skip link shows when focused');
        assert.equal(await style(skip, 'outlineStyle'), 'solid');
        assert.equal(await style(skip, 'outlineWidth'), '3px');
        assert.equal(await skip.evaluate(el => document.elementFromPoint(el.getBoundingClientRect().left + 4, el.getBoundingClientRect().top + 4) === el), true, 'the skip link is above the notice');
        await page.keyboard.press('Tab');
        assert.equal(await style(page.locator(':focus'), 'outlineStyle'), 'solid');
      } finally { await page.close(); }
    });
  }
}

for (const colorScheme of ['light', 'dark']) {
  for (const javaScriptEnabled of [false, true]) {
    test(`the directory fits all widths and zoom: ${colorScheme}, JavaScript ${javaScriptEnabled}`, async () => {
      const page = await browser.newPage({ javaScriptEnabled, colorScheme });
      try {
        await page.goto(base + '/municipios/');
        await page.locator('.municipality-index details').first().evaluate(el => { el.open = true; });
        for (const width of [320, 768, 1280]) {
          await page.setViewportSize({ width, height: 900 });
          for (const zoom of ['100%', '200%']) {
            await page.locator('body').evaluate((el, value) => { el.style.zoom = value; }, zoom);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${width}px, zoom ${zoom}`);
          }
        }
      } finally { await page.close(); }
    });
  }
}
