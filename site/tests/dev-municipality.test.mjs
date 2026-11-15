import { execFileSync } from 'node:child_process';
import { test } from 'node:test';

test('dev serves municipal selections within the default 2 GiB heap', () => {
  execFileSync(process.execPath, ['--max-old-space-size=2048', '--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import { dev } from 'astro';

    const server = await dev({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
    try {
      for (const [slug, code, name] of [
        ['261160-recife', '261160', 'Recife'],
        ['355030-sao-paulo', '355030', 'São Paulo'],
        ['261160-recife', '261160', 'Recife'],
      ]) {
        const response = await fetch('http://127.0.0.1:' + server.address.port + '/municipio/' + slug + '/');
        assert.equal(response.status, 200);
        const html = await response.text();
        assert.ok(html.includes('data-code="' + code + '"'));
        assert.ok(html.includes(name));
        for (const axis of ['Acesso ao tratamento', 'Detecção precoce', 'Prevenção', 'Panorama']) {
          assert.ok(html.includes('>' + axis + '</summary>'));
        }
      }
    } finally {
      await server.stop();
    }
  `], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, NODE_OPTIONS: '' },
    timeout: 60_000,
    stdio: 'pipe',
    maxBuffer: 1024 * 1024,
  });
});
