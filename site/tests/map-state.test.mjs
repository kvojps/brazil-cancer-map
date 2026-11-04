import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMapState, readMapState, writeMapState } from '../src/map/map-state.ts';
import { formatIndicatorValue, mapOption, cancerTypeNotes } from '../src/map/indicator-layer.ts';

test('mammography is available for breast and all in both modes, formatted as a ratio', () => {
  for (const cancerType of ['all', 'breast']) {
    for (const mode of ['trend', 'status']) {
      assert.deepEqual(normalizeMapState({ indicator: 'mammography', cancerType, mode }),
        { indicator: 'mammography', cancerType, mode });
      assert.equal(mapOption('mammography', cancerType, mode).disabled, false);
    }
  }
  for (const cancerType of ['cervix', 'prostate', 'lung', 'colorectal']) {
    assert.equal(mapOption('mammography', cancerType, 'trend').disabled, true);
    assert.equal(normalizeMapState({ indicator: 'mammography', cancerType }).indicator, 'within_60_days');
  }
  assert.equal(formatIndicatorValue('mammography', 0.8), '0,80');
  assert.equal(formatIndicatorValue('mammography', null), '—');
  assert.equal(formatIndicatorValue('within_60_days', 80), '80,0%');
});

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

test('cytopathology is selectable for cervix and all, in both modes, as a ratio', () => {
  for (const cancerType of ['all', 'cervix']) {
    for (const mode of ['trend', 'status']) {
      assert.deepEqual(normalizeMapState({ indicator: 'cytopathology', cancerType, mode }),
        { indicator: 'cytopathology', cancerType, mode });
      assert.equal(mapOption('cytopathology', cancerType, mode).disabled, false);
    }
  }
  for (const cancerType of ['breast', 'prostate', 'lung', 'colorectal']) {
    assert.equal(mapOption('cytopathology', cancerType, 'trend').disabled, true);
  }
  assert.equal(formatIndicatorValue('cytopathology', 0.8), '0,80');
});

test('mortality is trend-only for every cancer type and rates never use percent units', () => {
  for (const cancerType of ['all', 'breast', 'cervix', 'prostate', 'lung', 'colorectal']) {
    assert.deepEqual(normalizeMapState({ indicator: 'mortality', cancerType, mode: 'status' }),
      { indicator: 'mortality', cancerType, mode: 'trend' });
    assert.equal(mapOption('mortality', cancerType, 'status').disabled, true);
  }
  assert.equal(formatIndicatorValue('mortality', 4.75), '4,75 por 100 mil');
  const notes = cancerTypeNotes({ indicator: 'mortality', cancer_type: 'prostate', has_status: false }).join(' ');
  assert.match(notes, /mortalidade tem só Tendência/);
  assert.doesNotMatch(notes, /vigilância ativa/);
});

test('HPV opens status for all and cervix and explains its short series', () => {
  for (const cancerType of ['all', 'cervix']) {
    assert.deepEqual(normalizeMapState({ indicator: 'hpv', cancerType, mode: 'trend' }),
      { indicator: 'hpv', cancerType, mode: 'status' });
    assert.equal(mapOption('hpv', cancerType, 'trend').disabled, true);
    assert.match(cancerTypeNotes({ indicator: 'hpv', cancer_type: cancerType, has_status: true }).join(' '), /série curta.*dose única.*2024/);
  }
  assert.equal(mapOption('hpv', 'breast', 'status').disabled, true);
  assert.equal(formatIndicatorValue('hpv', 95), '95,0%');
});
