import assert from 'node:assert/strict';
import { test } from 'node:test';
import { listLede, listReading } from '../src/map/indicator-table.ts';

const PERIOD = { first_year: 2014, last_year: 2025, provisional: [2025], latest: 2024, trend: [2015, 2024] };
const layer = (indicator, overrides = {}) => ({
  indicator, cancer_type: 'all', period: PERIOD, source: {}, has_status: true,
  reference: { value: 100, label: 'o que a lei garante' }, municipalities: {}, ...overrides,
});
const entry = (overrides = {}) => ({
  origin: 'municipality', value: 69.1, trend: 'improving', status: 'far', status_note: null,
  without_treatment_info: 31.8, quality_band: 'A', series_id: null, ...overrides,
});
const DOTS = /radial-gradient/;
const HATCHING = /repeating-linear-gradient/;

test('the list shows the class of the map reading, in the color of the map', () => {
  const treatment = layer('within_60_days');
  const trend = listReading(treatment, entry(), 'trend');
  assert.equal(trend.column, 'trend');
  assert.equal(trend.swatch, 'var(--trend-improving)');
  assert.equal(trend.bandC, false);
  const status = listReading(treatment, entry(), 'status');
  assert.equal(status.column, 'status');
  assert.equal(status.swatch, 'var(--status-far)');
});

test('band C is marked and hatched on the treatment indicator only', () => {
  const reading = listReading(layer('within_60_days'), entry({ quality_band: 'C' }), 'trend');
  assert.equal(reading.bandC, true);
  assert.match(reading.swatch, HATCHING);
  const other = listReading(layer('mammography'), entry({ quality_band: 'C' }), 'trend');
  assert.equal(other.bandC, false);
  assert.doesNotMatch(other.swatch, HATCHING);
});

test('insufficient data keeps only its dots, even in band C', () => {
  const insufficient = entry({ origin: 'insufficient', value: null, trend: null, status: null, quality_band: 'C' });
  const reading = listReading(layer('within_60_days'), insufficient, 'trend');
  assert.equal(reading.bandC, false);
  assert.match(reading.swatch, DOTS);
  assert.doesNotMatch(reading.swatch, HATCHING);
});

test('a municipality missing from the layer reads as insufficient data', () => {
  const reading = listReading(layer('within_60_days'), undefined, 'trend');
  assert.equal(reading.column, 'trend');
  assert.match(reading.swatch, DOTS);
  assert.equal(reading.bandC, false);
});

test('HPV reads only as Situação, whatever the mode', () => {
  const reading = listReading(layer('hpv'), entry({ trend: null, status: 'near' }), 'trend');
  assert.equal(reading.column, 'status');
  assert.equal(reading.swatch, 'var(--status-near)');
});

test('without Situação, as in mortality and prostate, the reading stays on the Tendência', () => {
  for (const indicator of ['mortality', 'within_60_days']) {
    const reading = listReading(layer(indicator, { has_status: false, reference: null }), entry({ status: null }), 'status');
    assert.equal(reading.column, 'trend', indicator);
  }
});

test('an uncomputable C55 adjustment does not borrow the dots of insufficient data', () => {
  const adjustment = entry({ trend: null, status: null, value: null, adjustment_note: 'Ajuste não calculável' });
  const reading = listReading(layer('mortality', { has_status: false, reference: null }), adjustment, 'trend');
  assert.equal(reading.column, 'trend');
  assert.doesNotMatch(reading.swatch, DOTS);
});

test('the line above the list has the period of the Tendência and the year of the value', () => {
  assert.equal(listLede(layer('within_60_days'), 'trend'), 'Tendência de 2015–2024 · valor de 2024');
});

test('in Como está hoje the line has the Referência and the year of the value', () => {
  assert.equal(listLede(layer('within_60_days'), 'status'), 'Referência: 100,0% · valor de 2024');
});

test('prostate has neither Situação nor Referência, so the line stays on the Tendência', () => {
  assert.equal(listLede(layer('within_60_days', { has_status: false, reference: null }), 'status'), 'Tendência de 2015–2024 · valor de 2024');
});

test('HPV never mentions a Tendência, and a line with only the year still reads as a sentence', () => {
  const hpv = layer('hpv', { period: { ...PERIOD, trend: [] } });
  assert.equal(listLede(hpv, 'trend'), 'Referência: 100,0% · valor de 2024');
  assert.equal(listLede({ ...hpv, reference: null }, 'status'), 'Valor de 2024');
});
