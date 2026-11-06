import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { chromium } from 'playwright-core';

// Local gzip HTTP scenario, not evidence of compression at the deployment provider.
const root = resolve(process.argv[2] ?? 'dist');
const resources = [];
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.topojson': 'application/json', '.woff2': 'font/woff2' };
const server = createServer(async (request, response) => {
  try {
    const path = new URL(request.url, 'http://localhost').pathname;
    let file = resolve(root, `.${decodeURIComponent(path)}`);
    if (file !== root && !file.startsWith(root + sep)) throw new Error('Invalid path');
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const body = await readFile(file);
    const encoded = gzipSync(body);
    response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Content-Encoding': 'gzip', 'Content-Length': encoded.length, 'Cache-Control': 'public, max-age=3600' });
    resources.push({ path, bytes: body.length, gzip: encoded.length });
    response.end(encoded);
  } catch {
    response.writeHead(404);
    response.end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/snap/bin/chromium', args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const base = `http://127.0.0.1:${server.address().port}`;
  const external = [];
  page.on('request', request => { if (!request.url().startsWith(base) && /^https?:/.test(request.url())) external.push(request.url()); });
  await page.goto(base);
  await page.locator('.indicator-table tbody tr').first().waitFor({ state: 'attached' });
  await page.waitForFunction(() => {
    const status = document.querySelector('.map-status');
    return status.hidden || status.textContent.includes('Não foi possível');
  });
  await page.waitForLoadState('networkidle');
  const initial = resources.splice(0);
  const mapStatus = await page.locator('.map-status').evaluate(element => element.hidden ? 'ready' : element.textContent);
  await page.locator('#municipality-search').fill('Recife PE');
  await page.locator('#municipality-results button').first().click();
  await page.locator('#municipality-content .profile').waitFor({ state: 'attached' });
  await page.waitForLoadState('networkidle');
  const selection = resources.splice(0);
  console.log(JSON.stringify({ method: 'Fresh Chromium context, 1280x900, local HTTP gzip level 6; payload bytes exclude headers. Initial page then search and selection of Recife, same cache. Not deployment-provider transfer.', browser: browser.version(), mapStatus, externalRequests: external, initial, initialGzipBytes: initial.reduce((sum, item) => sum + item.gzip, 0), selection, selectionGzipBytes: selection.reduce((sum, item) => sum + item.gzip, 0) }, null, 2));
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
