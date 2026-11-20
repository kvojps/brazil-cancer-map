import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMunicipalityQuery } from '../../src/profile/municipality-query.ts';
import { panelResult } from '../../src/profile/panel-result.ts';

const recife = { code: '261160', name: 'Recife', uf: 'PE', immediate_region: '1' };
const olinda = { code: '260960', name: 'Olinda', uf: 'PE', immediate_region: '1' };
const natal = { code: '240810', name: 'Natal', uf: 'RN', immediate_region: '2' };
const initial = { indicator: 'within_60_days', cancerType: 'all', mode: 'trend' };
const breast = { indicator: 'mammography', cancerType: 'breast', mode: 'trend' };
const breastToday = { ...breast, mode: 'status' };

function consultation(options = {}) {
  const documents = new Map();
  const profiles = new Map();
  const events = [];
  const query = createMunicipalityQuery(initial, {
    loadDocument: place => {
      const response = Promise.withResolvers();
      documents.set(place.code, response);
      return response.promise;
    },
    loadProfile: uf => {
      const response = Promise.withResolvers();
      profiles.set(uf, response);
      return response.promise;
    },
    selectionChanged: place => events.push(['selection', place?.code]),
    filtersChanged() {},
    render: (place, content, state) => events.push(['result', place.code, content, state]),
    failed: error => events.push(['error', error]),
    ...options,
  });
  return { query, documents, profiles, events };
}

test('the same municipal load serves successive filters and the ready consultation updates immediately', async () => {
  const { query, documents, profiles, events } = consultation();
  const pending = query.apply(recife, initial);
  const document = documents.get(recife.code);
  const profile = profiles.get(recife.uf);
  query.update(breast);
  query.update(breastToday);
  assert.deepEqual(events, [['selection', recife.code]]);
  assert.deepEqual(query.state, breastToday);
  document.resolve('Recife HTML');
  profile.resolve('PE profile');
  await pending;
  const content = { html: 'Recife HTML', profile: 'PE profile' };
  assert.deepEqual(events.slice(1), [['result', recife.code, content, breastToday]]);

  query.update(breast);
  assert.deepEqual(events.at(-1), ['result', recife.code, content, breast]);
  assert.equal(documents.get(recife.code), document);
  assert.equal(profiles.get(recife.uf), profile);
});

test('the direct document and the UF profile are reused when switching municipalities and returning', async () => {
  const { query, documents, profiles, events } = consultation({
    initialDocument: { code: recife.code, html: 'Direct Recife HTML' },
  });
  const first = query.apply(recife, initial);
  const second = query.apply(olinda, initial);
  assert.deepEqual([...documents.keys()], [olinda.code]);
  documents.get(olinda.code).resolve('Olinda HTML');
  profiles.get('PE').resolve('PE profile');
  await Promise.all([first, second]);
  assert.deepEqual(events.slice(2), [
    ['result', olinda.code, { html: 'Olinda HTML', profile: 'PE profile' }, initial],
  ]);

  await query.apply(recife, breast);
  assert.deepEqual(events.at(-1), ['result', recife.code, { html: 'Direct Recife HTML', profile: 'PE profile' }, breast]);
  await query.apply(olinda, breast);
  assert.deepEqual(events.at(-1), ['result', olinda.code, { html: 'Olinda HTML', profile: 'PE profile' }, breast]);
});

test('obsolete success and failure cannot change the consultation after selecting or clearing', async () => {
  const { query, documents, profiles, events } = consultation();
  const first = query.apply(recife, initial);
  const second = query.apply(natal, breast);
  profiles.get('PE').reject(new Error('Late profile error'));
  await first;
  query.apply(undefined, breast);
  documents.get(natal.code).resolve('Natal HTML');
  profiles.get('RN').resolve('RN profile');
  await second;
  assert.deepEqual(events, [['selection', recife.code], ['selection', natal.code], ['selection', undefined]]);
  assert.equal(query.place, undefined);
});

for (const resource of ['document', 'profile']) {
  test(`a failed municipal ${resource} is loaded again only on explicit retry`, async () => {
    const { query, documents, profiles, events } = consultation();
    const first = query.apply(recife, initial);
    const document = documents.get(recife.code);
    const profile = profiles.get(recife.uf);
    const error = new Error(`Failed municipal ${resource}`);
    (resource === 'document' ? document : profile).reject(error);
    await first;

    query.update(breastToday);
    assert.deepEqual(events, [['selection', recife.code], ['error', error]]);
    assert.equal(documents.get(recife.code), document);
    assert.equal(profiles.get(recife.uf), profile);

    const retry = query.retry();
    const nextDocument = documents.get(recife.code);
    const nextProfile = profiles.get(recife.uf);
    assert.equal(nextDocument === document, resource !== 'document');
    assert.equal(nextProfile === profile, resource !== 'profile');
    nextDocument.resolve('Recife HTML');
    nextProfile.resolve('PE profile');
    await retry;
    assert.deepEqual(events.slice(2), [
      ['result', recife.code, { html: 'Recife HTML', profile: 'PE profile' }, breastToday],
    ]);
  });
}

test('a profile that cannot be presented offers recovery with a new profile and the cached document', async () => {
  const result = [];
  const { query, documents, profiles, events } = consultation({
    render(place, content, state) {
      panelResult(place, content.profile, state, undefined);
      result.push({ content, state });
    },
  });
  const first = query.apply(recife, initial);
  const document = documents.get(recife.code);
  const rejectedProfile = profiles.get('PE');
  document.resolve('Recife HTML');
  rejectedProfile.resolve({});
  await first;
  assert.equal(events.at(-1)[0], 'error');

  query.update(breastToday);
  assert.equal(profiles.get('PE'), rejectedProfile);
  const retry = query.retry();
  const profile = { uf: 'PE', indicators: { within_60_days: {} } };
  profiles.get('PE').resolve(profile);
  await retry;
  assert.deepEqual(result, [{ content: { html: 'Recife HTML', profile }, state: breastToday }]);
  assert.equal(documents.get(recife.code), document);
});
