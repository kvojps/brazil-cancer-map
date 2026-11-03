import assert from 'node:assert/strict';
import { test } from 'node:test';
import { searchMunicipalities } from '../src/map/navigation.ts';
const places = [
  { code: '1', name: 'São João', uf: 'PE', immediate_region: '1' },
  { code: '2', name: 'São João', uf: 'PR', immediate_region: '2' },
];
test('search accepts accents, punctuation and a UF to distinguish names', () => {
  assert.deepEqual(searchMunicipalities(places, 'sao joao'), places);
  assert.deepEqual(searchMunicipalities(places, 'São João (PE)'), [places[0]]);
  assert.deepEqual(searchMunicipalities(places, 'sao joao pr'), [places[1]]);
  assert.deepEqual(searchMunicipalities(places, ''), []);
});

test('selection focuses the state before loading its profile and closing retains filters', async () => {
  const { createMunicipalityNavigation } = await import('../src/map/navigation.ts');
  const events = [];
  let url = new URL('https://example.org/?tipo=breast&modo=hoje');
  const navigation = createMunicipalityNavigation({
    places,
    getUrl: () => new URL(url),
    setUrl: next => { url = next; },
    focus: place => events.push(`focus:${place.uf}`),
    load: async place => { events.push(`load:${place.uf}`); return place.name; },
    show: content => events.push(content),
    clear: () => events.push('closed'),
  });
  assert.deepEqual(events, []);
  await navigation.select(places[0]);
  assert.deepEqual(events, ['focus:PE', 'load:PE', 'São João']);
  assert.equal(url.pathname, '/municipio/1-sao-joao/');
  assert.equal(url.search, '?tipo=breast&modo=hoje');
  navigation.close();
  assert.equal(url.pathname, '/');
  assert.equal(url.search, '?tipo=breast&modo=hoje');
  assert.equal(events.at(-1), 'closed');
});
