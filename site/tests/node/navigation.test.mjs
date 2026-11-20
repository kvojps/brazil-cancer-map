import assert from 'node:assert/strict';
import { test } from 'node:test';
import { municipalityFromUrl, searchMunicipalities, searchStatusText } from '../../src/map/navigation.ts';
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

test('the municipal path takes precedence over a legacy query selection', () => {
  const url = new URL('https://example.org/municipio/1-sao-joao/?visualizacao=lista&municipio=2');
  assert.equal(municipalityFromUrl(places, url), places[0]);
  assert.equal(municipalityFromUrl(places, new URL('/?municipio=2', url)), places[1]);
});

test('the search status agrees in number and does not assume a keyboard', () => {
  assert.equal(searchStatusText(1), '1 município encontrado.');
  assert.equal(searchStatusText(20), '20 municípios encontrados.');
  assert.equal(searchStatusText(0), 'Nenhum município encontrado.');
});
