import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
const trendLabels = { improving: 'Melhorando', worsening: 'Piorando', stable: 'Estável', no_clear_direction: 'Sem direção clara' };
const statusLabels = { reached: 'Alcançou', near: 'Perto', far: 'Longe' };
let browser;
before(async () => { browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/snap/bin/chromium', args: ['--no-sandbox'] }); });
after(async () => { await browser?.close(); });

for (const colorScheme of ['light', 'dark']) {
  test(`every published map selection has text classes and origin without WebGL: ${colorScheme}`, async t => {
    const page = await browser.newPage({ colorScheme });
    try {
      await page.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          return type.includes('webgl') ? null : original.call(this, type, ...args);
        };
      });
      const manifest = await (await page.request.get(`${base}/dados/manifest.json`)).json();
      for (const indicator of ['within_60_days', 'mammography', 'cytopathology', 'hpv', 'mortality']) {
        for (const cancerType of Object.keys(manifest.indicators[indicator])) {
          const layer = await (await page.request.get(`${base}/dados/map/${indicator}/${cancerType}.json`)).json();
          const modes = indicator === 'hpv' ? ['status'] : layer.has_status ? ['trend', 'status'] : ['trend'];
          for (const mode of modes) {
            await t.test(`${indicator}/${cancerType}/${mode}`, async () => {
              await page.goto(`${base}/?indicador=${indicator}&tipo=${cancerType}&modo=${mode}&visualizacao=lista`);
              await page.locator('.indicator-table tbody tr').first().waitFor({ state: 'attached' });
              await page.locator('.indicator-table select').selectOption('PE');
              const row = page.locator('tr[data-code="261160"]');
              const entry = layer.municipalities['261160'];
              const expected = entry.adjustment_note && mode === 'trend' && !entry.trend ? 'Ajuste não calculável'
                : (mode === 'status' ? statusLabels[entry.status] : trendLabels[entry.trend]) ?? 'Dado insuficiente';
              assert.ok((await row.locator('[data-reading]').textContent()).includes(expected));
              const origin = await row.locator('[data-column="origin"]').textContent();
              assert.match(origin, entry.adjustment_note ? /Ajuste não calculável/ : entry.origin === 'municipality' ? /próprio município/ : entry.origin === 'immediate_region' ? /município e vizinhos/ : /Poucos casos/);
              assert.equal(await page.locator('.latest-year').textContent(), String(layer.period.latest));
              if (indicator === 'mortality') assert.match(await page.locator('.status-note').textContent(), /sem Situação/);
              if (indicator === 'hpv') assert.equal(await row.locator('[data-reading]').getAttribute('data-column'), 'status');
              if (entry.status_note) assert.ok((await row.textContent()).includes(entry.status_note));
            });
          }
        }
      }
    } finally { await page.close(); }
  });
}
