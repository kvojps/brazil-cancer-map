import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';

// The contract of the pages decision (.scratch/ui-polimento/issues/06-lista-ufs-metodologia.md).
const base = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
const executablePath = process.env.CHROMIUM_PATH ?? '/snap/bin/chromium';
const PAGES = ['/municipios/', '/metodologia/'];
let browser;
before(async () => { browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] }); });
after(async () => { await browser?.close(); });

const fitsWidth = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
const isFocused = locator => locator.evaluate(element => element === document.activeElement);

for (const path of PAGES) {
  for (const javaScriptEnabled of [true, false]) {
    test(`${path} has a flat header in the flow, with a menu below 1024 px: JavaScript ${javaScriptEnabled}`, async () => {
      const page = await browser.newPage({ javaScriptEnabled });
      try {
        await page.goto(base + path);
        for (const [width, menu] of [[320, true], [768, true], [1023, true], [1024, false], [1280, false]]) {
          await page.setViewportSize({ width, height: 800 });
          await page.evaluate(() => scrollTo(0, 0));
          const header = page.locator('.site-header');
          const look = await header.evaluate(element => {
            const style = getComputedStyle(element);
            return { shadow: style.boxShadow, radius: style.borderTopLeftRadius, border: style.borderBottomWidth, position: style.position };
          });
          assert.deepEqual(look, { shadow: 'none', radius: '0px', border: '1px', position: 'relative' }, `${width} px`);
          assert.equal(await page.locator('.site-menu summary').isVisible(), menu, `${width} px menu`);
          assert.equal(await page.getByRole('navigation', { name: 'Navegação principal' }).isVisible(), !menu, `${width} px links`);
          assert.equal(await fitsWidth(page), true, `${width} px width`);
          const before = (await header.boundingBox()).y;
          await page.evaluate(() => scrollTo(0, 300));
          assert.ok((await header.boundingBox()).y < before, `${width} px: the header leaves with the page`);
        }
        await page.setViewportSize({ width: 390, height: 844 });
        await page.evaluate(() => scrollTo(0, 0));
        await page.locator('.site-menu summary').click();
        assert.equal(await page.locator('.site-menu > nav').getByRole('link', { name: 'Mapa', exact: true }).isVisible(), true);
      } finally { await page.close(); }
    });
  }

  test(`${path} no longer has the back link or the label above the title`, async () => {
    const page = await browser.newPage();
    try {
      await page.goto(base + path);
      assert.equal(await page.getByRole('link', { name: /Voltar ao mapa/ }).count(), 0);
      assert.equal(await page.locator('main').getByText(/^(Metodologia|Consulta municipal)$/).count(), 0);
      assert.equal(await page.locator('main h1').count(), 1);
    } finally { await page.close(); }
  });
}

test('the Mapa link returns from the directory to the theme, the filters and the selection', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(`${base}/municipio/261160-recife/?indicador=mammography&tipo=breast&modo=hoje&visualizacao=lista&theme=dark`);
    await page.locator('#municipality-search:enabled').waitFor();
    await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Municípios por UF', exact: true }).click();
    await page.waitForURL('**/municipios/**');
    const map = page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Mapa', exact: true });
    await map.click();
    // The dashboard normalizes the selection to its path.
    await page.waitForURL('**/municipio/261160-recife/**');
    const url = new URL(page.url());
    for (const [key, value] of Object.entries({ indicador: 'mammography', tipo: 'breast', modo: 'hoje', visualizacao: 'lista', theme: 'dark' })) assert.equal(url.searchParams.get(key), value, key);
  } finally { await page.close(); }
});

for (const path of PAGES) {
  test(`${path} loads the municipality list only when the search is used`, async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const requests = [];
    page.on('request', request => requests.push(request.url()));
    try {
      await page.goto(base + path, { waitUntil: 'networkidle' });
      const input = page.locator('#municipality-search:enabled');
      await input.waitFor();
      assert.equal(requests.some(url => url.includes('municipalities.json')), false, 'nothing before the search');
      assert.equal(requests.some(url => url.includes('maplibre')), false, 'no map engine');
      const listing = page.waitForRequest(request => request.url().includes('municipalities.json'));
      await input.focus();
      await listing;
      assert.equal(requests.filter(url => url.includes('municipalities.json')).length, 1, 'on focus');
    } finally { await page.close(); }
  });

  test(`${path}: choosing a municipality opens the dashboard with the selection and the theme`, async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    try {
      await page.goto(`${base}${path}?theme=dark&tipo=breast`);
      const input = page.locator('#municipality-search:enabled');
      await input.fill('recife pe');
      const result = page.locator('#municipality-results').getByRole('link', { name: 'Recife (PE)' });
      await result.waitFor();
      assert.equal(await page.locator('#search-status').textContent(), '1 município encontrado.');
      assert.ok((await result.boundingBox()).height >= 40);
      await input.press('Enter');
      await page.waitForURL('**/municipio/261160-recife/**');
      const url = new URL(page.url());
      assert.equal(url.searchParams.get('theme'), 'dark');
      assert.equal(url.searchParams.get('tipo'), 'breast');
      await page.locator('#municipality-preview').waitFor();
    } finally { await page.close(); }
  });

  test(`${path}: on a phone the search opens from its icon and each result is a 44 px link`, async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
    try {
      await page.goto(base + path);
      await page.locator('#municipality-search:enabled').waitFor({ state: 'attached' });
      const toggle = page.locator('.search-toggle');
      await toggle.click();
      const input = page.locator('#municipality-search');
      assert.equal(await isFocused(input), true);
      await input.fill('olinda');
      const result = page.locator('#municipality-results').getByRole('link', { name: 'Olinda (PE)' });
      await result.waitFor();
      assert.ok((await result.boundingBox()).height >= 44);
      assert.equal(await fitsWidth(page), true);
      await input.press('ArrowDown');
      assert.equal(await isFocused(page.locator('#municipality-results a').first()), true);
      await page.keyboard.press('Escape');
      assert.equal(await input.isVisible(), false);
      assert.equal(await isFocused(toggle), true, 'focus returns to the icon');
    } finally { await page.close(); }
  });

  test(`${path}: a failed list says so and can be retried`, async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    let fail = true;
    await page.route('**/dados/municipalities.json', route => fail ? route.fulfill({ status: 503, body: '' }) : route.continue());
    try {
      await page.goto(base + path);
      const input = page.locator('#municipality-search:enabled');
      await input.fill('recife');
      const results = page.locator('#municipality-results');
      await results.getByText('Não foi possível carregar a busca.').waitFor();
      assert.match(await page.locator('#search-status').textContent(), /Não foi possível carregar a busca/);
      assert.equal(await results.getByRole('link', { name: 'Municípios por UF' }).isVisible(), true);
      fail = false;
      await results.getByRole('button', { name: 'Tentar novamente' }).click();
      await results.getByRole('link', { name: 'Recife (PE)' }).waitFor();
    } finally { await page.close(); }
  });

  for (const width of [320, 1280]) {
    test(`${path} without JavaScript leads the search to Municípios por UF at ${width} px`, async () => {
      const page = await browser.newPage({ javaScriptEnabled: false, viewport: { width, height: 800 } });
      try {
        await page.goto(base + path);
        assert.equal(await page.locator('#municipality-search').isVisible(), false, 'no field that cannot work');
        const link = page.getByRole('link', { name: 'Buscar município' });
        assert.equal(await link.isVisible(), true);
        assert.equal(await link.getAttribute('href'), '/municipios/');
        assert.equal(await fitsWidth(page), true);
      } finally { await page.close(); }
    });
  }
}

for (const javaScriptEnabled of [true, false]) {
  test(`the UFs are rows with a rule that open natively, with 44 px targets: JavaScript ${javaScriptEnabled}`, async () => {
    const page = await browser.newPage({ javaScriptEnabled });
    try {
      await page.goto(base + '/municipios/');
      assert.equal(await page.locator('.municipality-index details').count(), 27);
      for (const width of [320, 768, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        const row = page.locator('#municipalities-PE');
        const look = await row.evaluate(element => {
          const style = getComputedStyle(element);
          return { background: style.backgroundColor, radius: style.borderTopLeftRadius, rule: style.borderBottomWidth };
        });
        assert.deepEqual(look, { background: 'rgba(0, 0, 0, 0)', radius: '0px', rule: '1px' }, `${width} px`);
        const summary = row.locator('summary');
        assert.ok((await summary.boundingBox()).height >= 44, `${width} px summary`);
        assert.match(await summary.textContent(), /PE.*Pernambuco.*185 municípios/);
        await summary.focus();
        assert.notEqual(await summary.evaluate(element => getComputedStyle(element).outlineStyle), 'none');
        await page.keyboard.press('Enter');
        const link = row.getByRole('link', { name: 'Recife', exact: true });
        assert.equal(await link.isVisible(), true, `${width} px opens`);
        assert.ok((await link.boundingBox()).height >= 44, `${width} px link`);
        assert.equal(await fitsWidth(page), true, `${width} px width`);
        await page.keyboard.press('Enter');
        assert.equal(await link.isVisible(), false, `${width} px closes`);
      }
    } finally { await page.close(); }
  });
}

const SECTIONS = ['60-dias', 'onde-se-tratar', 'mamografia', 'citopatologico', 'mortalidade', 'hpv', 'tabagismo', 'casos-estimados', 'dados-e-fontes', 'versoes-e-reproducao', 'reutilizacao-e-citacao'];
const indexToggle = page => page.locator('.methodology-index').getByRole('button', { name: /Nesta página/ });
const indexLinks = page => page.getByRole('navigation', { name: 'Nesta página' }).getByRole('link');

test('on the desktop the index stays beside a 44 rem column and marks the current section', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.goto(base + '/metodologia/');
    await page.locator('[aria-current]').waitFor({ state: 'attached' });
    assert.equal(await indexToggle(page).isVisible(), false);
    assert.equal(await page.locator('.methodology-index a[aria-current]').textContent(), 'Tratamento em até 60 dias');
    assert.equal((await page.locator('.methodology-reading').boundingBox()).width, 704);
    await page.locator('#mortalidade').evaluate(element => element.scrollIntoView());
    await page.waitForFunction(() => document.querySelector('.methodology-index a[aria-current]')?.textContent === 'Mortalidade');
    const index = await page.locator('.methodology-index').boundingBox();
    const notice = await page.locator('.construction-notice').boundingBox();
    assert.ok(index.y >= notice.y + notice.height, 'below the notice');
    assert.ok(index.y + index.height <= 800, 'all within the window');
    assert.equal(await page.locator('.methodology-index a[aria-current]').count(), 1);
  } finally { await page.close(); }
});

for (const width of [320, 390, 880]) {
  test(`at ${width} px the index is one fixed line that shows the current section`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 700 } });
    try {
      await page.goto(base + '/metodologia/');
      const toggle = indexToggle(page);
      await page.waitForFunction(() => document.querySelector('[data-index-current]')?.textContent);
      assert.match(await toggle.textContent(), /Nesta página\s*01 Tratamento em até 60 dias/);
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      assert.equal(await indexLinks(page).first().isVisible(), false);
      assert.ok((await toggle.boundingBox()).height >= 44);
      assert.equal(await fitsWidth(page), true);
      await page.locator('#mortalidade').evaluate(element => element.scrollIntoView());
      await page.waitForFunction(() => document.querySelector('[data-index-current]').textContent === '05 Mortalidade');
      const line = await page.locator('.methodology-index').boundingBox();
      const notice = await page.locator('.construction-notice').boundingBox();
      assert.ok(Math.abs(line.y - (notice.y + notice.height)) <= 1, `line at ${line.y}, notice ends at ${notice.y + notice.height}`);
    } finally { await page.close(); }
  });
}

test('the open index covers the text, and closes on a choice, with Esc and on leaving it', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await page.goto(base + '/metodologia/');
    const toggle = indexToggle(page);
    await page.waitForFunction(() => document.querySelector('[data-index-current]')?.textContent);
    await page.locator('#mamografia').evaluate(element => element.scrollIntoView());
    const before = await page.evaluate(() => [document.documentElement.scrollHeight, scrollY]);

    await toggle.focus();
    await page.keyboard.press('Enter');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(await indexLinks(page).count(), 11);
    assert.deepEqual(await page.evaluate(() => [document.documentElement.scrollHeight, scrollY]), before, 'over the text');
    const list = await page.locator('.methodology-index ol').boundingBox();
    assert.ok(list.y + list.height <= 844, 'the list fits the window');
    await page.keyboard.press('Tab');
    assert.equal(await isFocused(indexLinks(page).first()), true, 'the list follows its button');
    assert.ok((await indexLinks(page).first().boundingBox()).height >= 44);

    await page.keyboard.press('Escape');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(await isFocused(toggle), true, 'Esc returns to the button');
    assert.equal(await toggle.evaluate(element => getComputedStyle(element).outlineStyle), 'solid', 'visible focus');

    await page.keyboard.press('Enter');
    await indexLinks(page).nth(4).focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => location.hash === '#mortalidade');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false', 'a choice closes it');
    await page.waitForFunction(() => document.activeElement === document.querySelector('#mortalidade'));
    assert.equal(await page.locator('#mortalidade h2').evaluate(element => getComputedStyle(element).outlineStyle), 'solid', 'visible focus');
    assert.equal(await page.locator('[data-index-current]').textContent(), '05 Mortalidade');

    await page.keyboard.press('Shift+Tab');
    await toggle.click();
    await page.mouse.click(195, 700);
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false', 'a click outside closes it');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await indexLinks(page).last().focus();
    await page.keyboard.press('Tab');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false', 'leaving by Tab closes it');
  } finally { await page.close(); }
});

test('without JavaScript the index stays in the flow, whole and without a current section', async () => {
  const page = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    await page.goto(base + '/metodologia/');
    assert.equal(await indexToggle(page).isVisible(), false);
    assert.equal(await page.getByRole('heading', { name: 'Nesta página' }).isVisible(), true);
    assert.equal(await page.locator('.methodology-index').evaluate(element => getComputedStyle(element).position), 'static');
    for (const link of await indexLinks(page).all()) assert.equal(await link.isVisible(), true);
    assert.equal(await page.locator('[aria-current]').count(), 0);
  } finally { await page.close(); }
});

for (const javaScriptEnabled of [true, false]) {
  for (const [width, height] of [[320, 568], [390, 844], [768, 900], [1280, 800]]) {
    test(`the 11 anchors land below the notice and the index at ${width} px: JavaScript ${javaScriptEnabled}`, async () => {
      const page = await browser.newPage({ javaScriptEnabled, viewport: { width, height } });
      try {
        for (const [position, id] of SECTIONS.entries()) {
          await page.goto('about:blank');
          await page.goto(`${base}/metodologia/#${id}`);
          await page.evaluate(() => document.fonts?.ready);
          const clear = await page.evaluate(() => {
            const notice = document.querySelector('.construction-notice').getBoundingClientRect().bottom;
            const index = document.querySelector('.methodology-index');
            const sticky = getComputedStyle(index).position === 'sticky' && index.getBoundingClientRect().width > innerWidth / 2;
            return sticky ? Math.max(notice, index.getBoundingClientRect().bottom) : notice;
          });
          const heading = await page.locator(`[id="${id}"] h2`).boundingBox();
          assert.ok(heading.y >= clear - 1, `${id}: heading at ${heading.y}, clear from ${clear}`);
          assert.ok(heading.y + heading.height <= height, `${id}: heading in the window, at ${heading.y}`);
          // The last sections cannot scroll any higher: the page ends first.
          if (position < 8) assert.ok(heading.y <= clear + 64, `${id}: lands at the top, at ${heading.y} under ${clear}`);
          assert.equal(await page.evaluate(() => scrollY > 0), true, `${id}: the page scrolled`);
        }
      } finally { await page.close(); }
    });
  }
}

test('a window too short for the notice and the line lets the line scroll away', async () => {
  const page = await browser.newPage({ viewport: { width: 160, height: 284 } });
  try {
    await page.goto(base + '/metodologia/#mamografia');
    await page.waitForFunction(() => document.querySelector('[data-index-current]')?.textContent);
    assert.equal(await page.locator('.methodology-index').evaluate(element => getComputedStyle(element).position), 'relative');
    assert.equal(await fitsWidth(page), true);
  } finally { await page.close(); }
});

for (const colorScheme of ['light', 'dark']) {
  test(`the reading page has no boxes around its sections: ${colorScheme}`, async () => {
    const page = await browser.newPage({ colorScheme, viewport: { width: 1280, height: 800 } });
    try {
      await page.goto(base + '/metodologia/');
      const section = page.locator('#mamografia');
      assert.equal(await section.evaluate(element => getComputedStyle(element).backgroundColor), 'rgba(0, 0, 0, 0)');
      assert.equal(await section.locator('h2').evaluate(element => getComputedStyle(element).borderTopWidth), '1px');
      assert.equal(await page.locator('.methodology-index').evaluate(element => getComputedStyle(element).backgroundColor), 'rgba(0, 0, 0, 0)');
    } finally { await page.close(); }
  });
}

test('the keyboard never leaves focus under the fixed line', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await page.goto(base + '/metodologia/#hpv');
    await page.waitForFunction(() => document.querySelector('[data-index-current]')?.textContent);
    const link = page.locator('#mamografia a').first();
    const line = await page.locator('.methodology-index').boundingBox();
    // Already in the window, but in the band behind the line: the browser would not move it by itself.
    await link.evaluate((element, top) => scrollBy(0, element.getBoundingClientRect().top - top), line.y + 4);
    await link.focus();
    assert.ok((await link.boundingBox()).y >= line.y + line.height, 'a link reached from below stays clear of the line');
    const before = await page.evaluate(() => scrollY);
    await indexToggle(page).focus();
    assert.equal(await page.evaluate(() => scrollY), before, 'focusing the line does not move the page');
  } finally { await page.close(); }
});

for (const [width, height] of [[844, 390], [640, 400]]) {
  test(`at ${width} × ${height} px the line stays fixed`, async () => {
    const page = await browser.newPage({ viewport: { width, height } });
    try {
      await page.goto(base + '/metodologia/#mamografia');
      await page.waitForFunction(() => document.querySelector('[data-index-current]')?.textContent);
      assert.equal(await page.locator('.methodology-index').evaluate(element => getComputedStyle(element).position), 'sticky');
    } finally { await page.close(); }
  });
}

test('the anchors of the dashboard keep their own clearance', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.goto(base + '/municipio/261160-recife/');
    await page.locator('#municipality-search:enabled').waitFor();
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollPaddingTop), '64px');
  } finally { await page.close(); }
});

for (const colorScheme of ['light', 'dark']) {
  test(`the open index fits every width and 200% zoom: ${colorScheme}`, async () => {
    const page = await browser.newPage({ colorScheme });
    try {
      await page.goto(base + '/metodologia/');
      await page.waitForFunction(() => document.querySelector('[data-index-current]')?.textContent);
      for (const width of [320, 768, 1280]) {
        for (const zoom of [1, 2]) {
          // Half the window is what the page gets under the browser's zoom of 200%.
          await page.setViewportSize({ width: width / zoom, height: 900 / zoom });
          const toggle = indexToggle(page);
          if (await toggle.isVisible()) {
            await toggle.click();
            assert.equal(await fitsWidth(page), true, `${width} px, ${zoom}x, index open`);
            await page.keyboard.press('Escape');
          }
          assert.equal(await fitsWidth(page), true, `${width} px, ${zoom}x`);
        }
      }
    } finally { await page.close(); }
  });
}
