import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
let browser;
before(async () => {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/snap/bin/chromium', args: ['--no-sandbox'] });
});
after(async () => { await browser?.close(); });

// Scan the public documents and the enhanced list; interaction coverage lives in the other browser suites.
for (const colorScheme of ['light', 'dark']) {
  for (const javaScriptEnabled of [false, true]) {
    test(`no serious accessibility violations: ${colorScheme}, JavaScript ${javaScriptEnabled}`, { timeout: 240000 }, async t => {
      const context = await browser.newContext({ colorScheme, javaScriptEnabled });
      const page = await context.newPage();
      const session = await context.newCDPSession(page);
      try {
        for (const path of ['/', '/municipios/', '/metodologia/', '/municipio/261160-recife/', '/municipio/210020-alcantara/', '/municipio/210090-araioses/']) {
          await t.test(path, async () => {
            if (!javaScriptEnabled) await session.send('Emulation.setScriptExecutionDisabled', { value: true });
            await page.goto(base + path);
            await page.evaluate(() => document.fonts.ready);
            if (javaScriptEnabled && (path === '/' || path.startsWith('/municipio/'))) {
              await page.locator('.indicator-table tbody tr').first().waitFor({ state: 'attached' });
              await page.locator('[data-view="lista"]').click();
              await page.locator('.indicator-table tbody tr').first().waitFor();
              await page.locator('.indicator-table select').selectOption('PE');
              if (path !== '/') {
                await page.locator('[data-profile-result][data-kind]').waitFor({ state: 'attached' });
                await page.locator('[data-view="mapa"]').click();
              }
            }
            // Open native disclosures so hidden content is audited too.
            await page.locator('main details:not(.municipality-index details)').evaluateAll(elements => {
              for (const element of elements) element.open = true;
            });
            if (path === '/municipios/') await page.locator('#municipalities-PE').evaluate(element => { element.open = true; });
            // axe needs timers. Re-enable execution only after the no-script document has loaded;
            // scripts skipped during navigation are not replayed. The next navigation disables it again.
            if (!javaScriptEnabled) await session.send('Emulation.setScriptExecutionDisabled', { value: false });
            // These pages have no frames. Keep the analysis in this document, including its no-script state.
            const results = await new AxeBuilder({ page }).setLegacyMode().analyze();
            if (process.env.A11Y_REPORT_DIR) {
              await mkdir(process.env.A11Y_REPORT_DIR, { recursive: true });
              const name = `${colorScheme}-${javaScriptEnabled ? 'script' : 'static'}-${path.replaceAll('/', '_') || 'home'}.json`;
              await writeFile(resolve(process.env.A11Y_REPORT_DIR, name), JSON.stringify(results, null, 2));
            }
            t.diagnostic(`${path}: axe ${results.testEngine.version}; ${results.violations.length} violations, ${results.incomplete.length} checks need review`);
            const violations = results.violations.filter(item => ['serious', 'critical'].includes(item.impact) || item.id === 'landmark-unique');
            assert.deepEqual(violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map(node => node.target) })), [], path);
          });
        }
      } finally { await context.close(); }
    });
  }
}
