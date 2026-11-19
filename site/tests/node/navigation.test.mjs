import assert from 'node:assert/strict';
import { test } from 'node:test';
import { searchMunicipalities, searchStatusText } from '../../src/map/navigation.ts';
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

test('selection puts the municipality on the address and focuses it before loading its profile; closing puts Brazil back', async () => {
  const { createMunicipalityNavigation } = await import('../../src/map/navigation.ts');
  const events = [];
  const placed = [];
  const navigation = createMunicipalityNavigation({
    places,
    getUrl: () => new URL('https://example.org/'),
    setPlace: place => placed.push(place?.code),
    focus: place => events.push(`focus:${place.uf}`),
    load: async place => { events.push(`load:${place.uf}`); return place.name; },
    show: content => events.push(content),
    clear: () => events.push('closed'),
  });
  assert.deepEqual(events, []);
  await navigation.select(places[0]);
  assert.deepEqual(events, ['focus:PE', 'load:PE', 'São João']);
  navigation.close();
  assert.deepEqual(placed, ['1', undefined]);
  assert.equal(events.at(-1), 'closed');
});

test('preview selection stays on the map and ignores late results and failures', async () => {
  const { createMunicipalityNavigation } = await import('../../src/map/navigation.ts');
  const pending = [];
  const shown = [];
  const navigation = createMunicipalityNavigation({ places, getUrl: () => new URL('https://example.org/'), setPlace() {}, focus() {}, clear() {},
    load: place => new Promise((resolve, reject) => pending.push({ resolve, reject, place })), show: value => shown.push(value) });
  const first = navigation.select(places[0]);
  const second = navigation.select(places[1]);
  pending[1].resolve('PR'); await second;
  pending[0].reject(new Error('Late failure')); await first;
  assert.deepEqual(shown, ['PR']);
  const third = navigation.select(places[0]); navigation.close();
  pending[2].resolve('PE'); await third;
  assert.deepEqual(shown, ['PR']);
});

test('a municipal path restores the selection', async () => {
  const { createMunicipalityNavigation } = await import('../../src/map/navigation.ts');
  const focused = [];
  const url = new URL('https://example.org/municipio/1-sao-joao/?visualizacao=lista');
  const navigation = createMunicipalityNavigation({ places, getUrl: () => url, setPlace() {},
    focus: place => focused.push(place.code), load: async place => place.code, show() {}, clear() {} });
  await navigation.restore();
  assert.deepEqual(focused, ['1']);
});

test('the search status agrees in number and does not assume a keyboard', () => {
  assert.equal(searchStatusText(1), '1 município encontrado.');
  assert.equal(searchStatusText(20), '20 municípios encontrados.');
  assert.equal(searchStatusText(0), 'Nenhum município encontrado.');
});
