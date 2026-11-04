import assert from 'node:assert/strict';
import { test } from 'node:test';
import { navigationUrl, readTheme } from '../src/shared/navigation.ts';

const current = new URL('https://example.org/?indicador=mammography&tipo=breast&modo=hoje&theme=dark');
test('municipality links carry type and theme while indicator and mode belong to the map', () => {
  assert.equal(navigationUrl(new URL('/municipio/1-example/#acesso', current), current).href,
    'https://example.org/municipio/1-example/?tipo=breast&theme=dark#acesso');
});

test('section links and methodology carry explicit theme and cancer type', () => {
  assert.equal(navigationUrl(new URL('/metodologia/#mammography', current), current).href,
    'https://example.org/metodologia/?tipo=breast&theme=dark#mammography');
  assert.equal(navigationUrl(new URL('#table', current), current).href,
    'https://example.org/?indicador=mammography&tipo=breast&modo=hoje&theme=dark#table');
});

test('invalid themes follow the system and invalid cancer selections use MVP defaults', () => {
  for (const theme of ['', 'invalid', 'DARK']) assert.equal(readTheme(new URLSearchParams({ theme })), null);
  assert.equal(readTheme(new URLSearchParams()), null);
  assert.equal(readTheme(new URLSearchParams('theme=light')), 'light');
  const invalid = new URL('https://example.org/?theme=bad&tipo=unknown&indicador=unknown&modo=bad');
  assert.equal(navigationUrl(new URL('/metodologia/#sources', current), invalid).href,
    'https://example.org/metodologia/#sources');
});

test('explicit cancer links override inherited type and return links retain map eligibility', () => {
  assert.equal(navigationUrl(new URL('/municipio/1-example/?tipo=cervix#acesso', current), current).href,
    'https://example.org/municipio/1-example/?tipo=cervix&theme=dark#acesso');
  const prostate = new URL('https://example.org/metodologia/?tipo=prostate&theme=light');
  assert.equal(navigationUrl(new URL('/', current), prostate).href,
    'https://example.org/?tipo=prostate&theme=light');
});

test('external resources and data downloads retain their own URL', () => {
  for (const path of ['https://example.net/?theme=light', '/dados/manifest.json']) {
    const url = new URL(path, current);
    assert.equal(navigationUrl(url, current).href, url.href);
  }
});

test('section links within an existing municipal map preserve its displayed selection', () => {
  const municipalMap = new URL('https://example.org/municipio/1-example/?indicador=mammography&tipo=breast&modo=hoje&theme=dark');
  assert.equal(navigationUrl(new URL('#acesso', municipalMap), municipalMap).href,
    'https://example.org/municipio/1-example/?indicador=mammography&tipo=breast&modo=hoje&theme=dark#acesso');
});
