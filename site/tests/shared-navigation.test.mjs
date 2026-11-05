import assert from 'node:assert/strict';
import { test } from 'node:test';
import { navigationUrl, readTheme } from '../src/shared/navigation.ts';

const current = new URL('https://example.org/?indicador=mammography&tipo=breast&modo=hoje&theme=dark');
test('municipality links carry map context for return without filtering the profile axes', () => {
  assert.equal(navigationUrl(new URL('/municipio/1-example/#acesso', current), current).href,
    'https://example.org/municipio/1-example/?indicador=mammography&tipo=breast&modo=hoje&theme=dark#acesso');
});

test('section links and methodology carry explicit theme and cancer type', () => {
  assert.equal(navigationUrl(new URL('/metodologia/#mammography', current), current).href,
    'https://example.org/metodologia/?indicador=mammography&tipo=breast&modo=hoje&theme=dark#mammography');
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
    'https://example.org/municipio/1-example/?indicador=mammography&tipo=cervix&modo=hoje&theme=dark#acesso');
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

test('preview to profile and return preserve selection, map context and theme', () => {
 const map = new URL('https://example.org/?municipio=261160&indicador=mammography&tipo=breast&modo=hoje&theme=dark');
 const profile = navigationUrl(new URL('/municipio/261160-recife/', map), map);
 assert.equal(profile.search, '?indicador=mammography&tipo=breast&modo=hoje&theme=dark');
 const back = navigationUrl(new URL('/', map), profile);
 assert.equal(back.searchParams.get('municipio'), '261160');
 assert.equal(back.searchParams.get('indicador'), 'mammography');
 assert.equal(back.searchParams.get('modo'), 'hoje');
 assert.equal(back.searchParams.get('theme'), 'dark');
});

test('list view follows native municipal links and return links', () => {
  const list = new URL('https://example.org/?visualizacao=lista&theme=dark');
  const municipal = navigationUrl(new URL('/municipio/261160-recife/', list), list);
  assert.equal(municipal.searchParams.get('visualizacao'), 'lista');
  assert.equal(navigationUrl(new URL('/', list), municipal).searchParams.get('visualizacao'), 'lista');
  const invalid = new URL('https://example.org/?visualizacao=invalid');
  assert.equal(navigationUrl(new URL('/', invalid), invalid).searchParams.has('visualizacao'), false);
});

test('the static index remains a root destination from a selected dashboard', () => {
  const selected = new URL('https://example.org/municipio/261160-recife/?visualizacao=lista&tipo=breast&theme=dark');
  const index = navigationUrl(new URL('/#municipality-index-heading', selected), selected);
  assert.equal(index.pathname, '/');
  assert.equal(index.searchParams.has('municipio'), false);
  assert.equal(index.searchParams.get('visualizacao'), 'lista');
  assert.equal(index.hash, '#municipality-index-heading');
});


test('methodology round trip and section links preserve the selected dashboard context', () => {
  const selected = new URL('https://example.org/municipio/261160-recife/?indicador=mammography&tipo=breast&modo=hoje&visualizacao=lista&theme=dark');
  const method = navigationUrl(new URL('/metodologia/#mamografia', selected), selected);
  const section = navigationUrl(new URL('#dados-e-fontes', method), method);
  assert.equal(section.hash, '#dados-e-fontes');
  const back = navigationUrl(new URL('/', method), section);
  for (const [key, value] of Object.entries({ municipio: '261160', indicador: 'mammography', tipo: 'breast', modo: 'hoje', visualizacao: 'lista', theme: 'dark' })) {
    assert.equal(back.searchParams.get(key), value, key);
  }
});

test('the directory carries filters and theme without retaining a municipal selection', () => {
  const selected = new URL('https://example.org/municipio/261160-recife/?tipo=breast&theme=dark&visualizacao=lista');
  const directory = navigationUrl(new URL('/municipios/', selected), selected);
  assert.equal(directory.pathname, '/municipios/');
  assert.equal(directory.searchParams.has('municipio'), false);
  assert.equal(directory.searchParams.get('theme'), 'dark');
  assert.equal(directory.searchParams.get('tipo'), 'breast');
  const municipal = navigationUrl(new URL('/municipio/260960-olinda/', directory), directory);
  assert.equal(municipal.searchParams.get('theme'), 'dark');
  assert.equal(municipal.searchParams.get('visualizacao'), 'lista');
});
