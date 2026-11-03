import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMapState, readMapState, writeMapState } from '../src/map/map-state.ts';

test('a clean link opens the initial map and defaults are omitted', () => {
  const state = readMapState(new URLSearchParams());
  assert.deepEqual(state, { indicator: 'within_60_days', cancerType: 'all', mode: 'trend' });
  assert.equal(writeMapState(state).toString(), '');
});

test('invalid fields fall back independently and prostate cannot show status', () => {
  assert.deepEqual(readMapState(new URLSearchParams('indicador=unknown&tipo=prostate&modo=hoje')), {
    indicator: 'within_60_days', cancerType: 'prostate', mode: 'trend',
  });
  assert.deepEqual(readMapState(new URLSearchParams('tipo=unknown&modo=hoje')), {
    indicator: 'within_60_days', cancerType: 'all', mode: 'status',
  });
  assert.deepEqual(readMapState(new URLSearchParams('tipo=breast&modo=unknown')), {
    indicator: 'within_60_days', cancerType: 'breast', mode: 'trend',
  });
  assert.deepEqual(readMapState(new URLSearchParams('indicador=toString&tipo=constructor&modo=unknown')), {
    indicator: 'within_60_days', cancerType: 'all', mode: 'trend',
  });
});

const catalog = {
  within_60_days: { modes: { all: ['trend', 'status'], breast: ['trend', 'status'], prostate: ['trend'] } },
  mammography: { modes: { all: ['trend', 'status'], breast: ['trend', 'status'] } },
  mortality: { modes: { all: ['trend'] } },
  hpv: { modes: { all: ['status'] } },
};

test('availability controls fallback and single-mode indicators as the catalog grows', () => {
  assert.deepEqual(normalizeMapState({ indicator: 'mammography', cancerType: 'prostate', mode: 'status' }, catalog), {
    indicator: 'within_60_days', cancerType: 'prostate', mode: 'trend',
  });
  assert.deepEqual(readMapState(new URLSearchParams('indicador=mortality&modo=hoje'), catalog), {
    indicator: 'mortality', cancerType: 'all', mode: 'trend',
  });
  const state = readMapState(new URLSearchParams('indicador=hpv'), catalog);
  assert.deepEqual(state, { indicator: 'hpv', cancerType: 'all', mode: 'status' });
  assert.equal(writeMapState(state).toString(), 'indicador=hpv&modo=hoje');
});

test('sharing a selection round trips and canonicalization preserves unrelated URL fields', () => {
  const state = { indicator: 'mammography', cancerType: 'breast', mode: 'status' };
  const query = writeMapState(state, new URLSearchParams('source=link&tipo=bad&tipo=all&modo=trend'));
  assert.equal(query.toString(), 'source=link&indicador=mammography&tipo=breast&modo=hoje');
  assert.deepEqual(readMapState(query, catalog), state);
});
