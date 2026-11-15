import { createServer } from 'node:http';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

// Local interaction diagnostic: CPU throttling and software WebGL do not emulate a physical phone.
const root = resolve(process.argv[2] ?? fileURLToPath(new URL('../dist/', import.meta.url)));
const cpuRate = Number(process.env.CPU_RATE ?? 4);
const budget = Number(process.env.SELECTION_SYNC_BUDGET_MS ?? 200);
if (!Number.isFinite(cpuRate) || cpuRate < 1 || !Number.isFinite(budget) || budget <= 0) throw new Error('Invalid CPU rate or selection budget');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.topojson': 'application/json' };
const server = createServer(async (request, response) => {
  try {
    let file = resolve(root, `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`);
    if (file !== root && !file.startsWith(root + sep)) throw new Error('Invalid path');
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    response.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
let browser;
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/snap/bin/chromium', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuRate });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector('#data-status')?.textContent === '');
  await page.waitForFunction(() => document.querySelector('.map-status')?.hidden, undefined, { timeout: 90000 });
  await page.evaluate(() => {
    window.selectionTasks = [];
    new PerformanceObserver(list => window.selectionTasks.push(...list.getEntries().map(entry => ({ start: entry.startTime, duration: entry.duration }))))
      .observe({ type: 'longtask' });
  });
  if (process.env.PROFILE_PATH) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.start'); }
  const results = [];
  for (const code of ['261160', '260960', '261160', '260960', '261160', '260960']) {
    const result = await page.evaluate(async code => {
      const start = performance.now();
      window.selectionTasks = [];
      // Exercise the same selection callback as a map tap, without depending on projected coordinates.
      window.dispatchEvent(new CustomEvent('municipality-map-select', { detail: code }));
      const sync = performance.now() - start;
      await new Promise((resolve, reject) => {
        const check = () => {
          if (document.querySelector('[data-profile-slot] .profile')?.dataset.code === code) resolve();
          else if (performance.now() - start > 10000) reject(new Error(`Selection timed out: ${code}`));
          else requestAnimationFrame(check);
        };
        check();
      });
      const ready = performance.now() - start;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return { code, sync, ready, twoFrames: performance.now() - start, tasks: window.selectionTasks };
    }, code);
    results.push(result);
    console.log(JSON.stringify(result));
  }
  if (process.env.PROFILE_PATH) {
    const { profile } = await cdp.send('Profiler.stop');
    await writeFile(process.env.PROFILE_PATH, JSON.stringify(profile));
  }
  const warmMaxSync = Math.max(...results.slice(2).map(result => result.sync));
  console.log(JSON.stringify({ browser: browser.version(), cpuRate, viewport: '390x844', warmMaxSync, budget, pass: warmMaxSync < budget }));
  if (warmMaxSync >= budget) process.exitCode = 1;
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
