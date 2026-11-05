import assert from 'node:assert/strict';
import { test } from 'node:test';
import { axisResults, panelResult } from '../src/profile/panel-result.ts';

const PERIOD = { first_year: 2014, last_year: 2025, provisional: [2025], latest: 2024, trend: [2015, 2024] };
const treatment = (entries, overrides = {}) => ({
  period: PERIOD, source: {}, has_status: true, reference: { value: 100, label: 'o que a lei garante' }, municipalities: entries, series: {}, ...overrides,
});
const balsas = { origin: 'municipality', value: 69.1, trend: 'no_clear_direction', status: 'far', status_note: null, without_treatment_info: 31.8, quality_band: 'C', series_id: null };
const place = { code: '210140', name: 'Balsas', uf: 'MA', immediate_region: '1' };
const profile = indicators => ({ uf: 'MA', indicators });
const TREND = { indicator: 'within_60_days', cancerType: 'all', mode: 'trend' };
const WARNING = 'Muitos casos estão sem informação de tratamento; o resultado pode não representar toda a situação.';

test('a band C municipality shows number, class, period, missing information and the warning', () => {
  const result = panelResult(place, profile({ within_60_days: { all: treatment({ '210140': balsas }) } }), TREND, 'Balsas');
  assert.equal(result.kind, 'value');
  assert.equal(result.value, '69,1%');
  assert.equal(result.measure, 'dos casos com quimio ou radio, em até 60 dias · 2024');
  assert.equal(result.classLabel, 'Sem direção clara');
  assert.equal(result.classContext, 'Tendência 2015–2024');
  assert.equal(result.withoutInformation, '31,8% de todos os casos sem informação de tratamento, 2024');
  assert.equal(result.origin, null, 'own data needs no origin line');
  assert.equal(result.warning, `Faixa C. ${WARNING}`);
  assert.match(result.swatch, /repeating-linear-gradient.*var\(--trend-no-clear-direction\)/, 'the hatching of the map over the class color');
});

test('a regional result names its origin, and the reading of Situação shows the Referência', () => {
  const alcantara = { ...balsas, origin: 'immediate_region', value: 58.6, trend: 'improving', status: 'far', without_treatment_info: 67.5 };
  const result = panelResult(place, profile({ within_60_days: { all: treatment({ '210140': alcantara }) } }), { ...TREND, mode: 'status' }, 'São Luís');
  assert.equal(result.origin, 'Seu município e vizinhos — região de São Luís');
  assert.equal(result.classLabel, 'Longe');
  assert.equal(result.classContext, 'Referência 100,0%');
  assert.match(result.swatch, /repeating-linear-gradient.*var\(--status-far\)/);
});

test('Dado insuficiente takes the place of the number, and the band C warning leaves the block', () => {
  const araioses = { ...balsas, origin: 'insufficient', value: null, trend: null, status: null, without_treatment_info: null };
  const result = panelResult(place, profile({ within_60_days: { all: treatment({ '210140': araioses }) } }), TREND, 'Tutóia - Araioses');
  assert.equal(result.kind, 'insufficient');
  assert.equal(result.classLabel, 'Dado insuficiente');
  assert.equal(result.explanation, 'Poucos casos aqui para dizer a direção. Isso é comum em municípios pequenos e não é um problema do seu município.');
  assert.equal(result.value, null);
  assert.equal(result.withoutInformation, null);
  assert.equal(result.warning, null);
  assert.match(result.swatch, /radial-gradient/, 'the dots of the map, never the hatching');
  assert.doesNotMatch(result.swatch, /repeating-linear-gradient/);
});

test('each indicator explains Dado insuficiente in its own words', () => {
  const none = { origin: 'insufficient', value: null, trend: null, status: null, status_note: null, without_treatment_info: null, quality_band: null, series_id: null };
  const explanation = (indicator, cancerType, mode) => panelResult(place, profile({ [indicator]: { [cancerType]: treatment({ '210140': none }) } }), { indicator, cancerType, mode }, undefined).explanation;
  assert.match(explanation('mammography', 'all', 'trend'), /^Poucos exames aqui e na região/);
  assert.match(explanation('hpv', 'all', 'status'), /^A população de 9–14 anos é insuficiente/);
  assert.match(explanation('mortality', 'all', 'trend'), /^Poucos óbitos aqui e na região/);
});

test('prostate keeps its caveat in a short form and in full, with no comparison to the law', () => {
  const entry = { ...balsas, quality_band: 'B' };
  const result = panelResult(place, profile({ within_60_days: { prostate: treatment({ '210140': entry }, { has_status: false, reference: null }) } }), { ...TREND, cancerType: 'prostate' }, undefined);
  assert.equal(result.caveat.short, 'Sem comparação com o prazo da lei: vigilância ativa pode ser a conduta correta.');
  assert.match(result.caveat.full, /^Na próstata, acompanhar o câncer antes de tratar \(vigilância ativa\)/);
  assert.equal(result.warning, null);
});

test('other indicators name what they measure, and only the 60 dias has the band and the missing information', () => {
  const entry = { ...balsas, value: .21611, status: 'far' };
  const mammography = panelResult(place, profile({ mammography: { all: treatment({ '210140': entry }, { period: { ...PERIOD, latest: 2025, trend: [2016, 2025] }, reference: { value: 1, label: 'meta' } }) } }), { indicator: 'mammography', cancerType: 'all', mode: 'status' }, undefined);
  assert.equal(mammography.value, '0,22');
  assert.equal(mammography.measure, 'razão de mamografias, meta 1 · 2025');
  assert.equal(mammography.classContext, 'Referência 1,00');
  assert.equal(mammography.withoutInformation, null);
  assert.equal(mammography.warning, null);
  assert.doesNotMatch(mammography.swatch, /repeating-linear-gradient/);
  const mortality = panelResult(place, profile({ mortality: { all: treatment({ '210140': { ...entry, value: 78.324, trend: 'worsening', status: null } }, { has_status: false, reference: null }) } }), { indicator: 'mortality', cancerType: 'all', mode: 'trend' }, undefined);
  assert.equal(mortality.value, '78,32 por 100 mil');
  assert.equal(mortality.classLabel, 'Piorando');
});

test('HPV has only Situação, with no period of a Tendência', () => {
  const hpv = panelResult(place, profile({ hpv: { all: treatment({ '210140': { ...balsas, value: 71.2, trend: null, status: 'near', quality_band: null } }, { period: { ...PERIOD, trend: [] }, reference: { value: 90, label: 'meta para 2030' } }) } }), { indicator: 'hpv', cancerType: 'all', mode: 'status' }, undefined);
  assert.equal(hpv.value, '71,2%');
  assert.equal(hpv.classLabel, 'Perto');
  assert.equal(hpv.classContext, 'Referência 90,0%');
});

const ADJUSTMENT = { origin: 'immediate_region', adjustment_note: 'not_calculable', value: 6.04, trend: null, status: null, status_note: null, without_treatment_info: null, quality_band: null, series_id: null };
const cervixMortality = entry => profile({ mortality: { cervix: treatment({ '210140': entry }, { has_status: false, reference: null }) } });
const CERVIX = { indicator: 'mortality', cancerType: 'cervix', mode: 'trend' };

test('a mortality adjustment that cannot be calculated keeps its number and origin and is not called Dado insuficiente', () => {
  const result = panelResult(place, cervixMortality(ADJUSTMENT), CERVIX, 'São Luís');
  assert.equal(result.kind, 'value');
  assert.equal(result.value, '6,04 por 100 mil');
  assert.equal(result.classLabel, 'Ajuste não calculável');
  assert.equal(result.origin, 'Seu município e vizinhos — região de São Luís');
  assert.match(result.explanation, /faltam registros para estimar a redistribuição do C55/);
  assert.doesNotMatch(result.swatch, /radial-gradient/, 'the dots are only for Dado insuficiente');
  const line = axisResults(place, cervixMortality(ADJUSTMENT), CERVIX).panorama[0];
  assert.equal(line.text, '6,04 por 100 mil · Ajuste não calculável');
  assert.doesNotMatch(line.swatch, /radial-gradient/);
});

test('an adjustment with a Tendência keeps its class', () => {
  const result = panelResult(place, cervixMortality({ ...ADJUSTMENT, trend: 'stable' }), CERVIX, 'São Luís');
  assert.equal(result.classLabel, 'Estável');
  assert.match(result.swatch, /var\(--trend-stable\)/);
});

test('an adjustment with no number says so in its place, without the dots', () => {
  const entry = { ...ADJUSTMENT, origin: 'insufficient', value: null };
  const result = panelResult(place, cervixMortality(entry), CERVIX, undefined);
  assert.equal(result.kind, 'adjustment');
  assert.equal(result.classLabel, 'Ajuste não calculável');
  assert.equal(result.value, null);
  assert.doesNotMatch(result.swatch, /radial-gradient/);
  assert.equal(axisResults(place, cervixMortality(entry), CERVIX).panorama[0].text, 'Ajuste não calculável');
});

test('a selection without published data says so and keeps its name', () => {
  const result = panelResult(place, profile({}), { indicator: 'hpv', cancerType: 'cervix', mode: 'status' }, undefined);
  assert.equal(result.kind, 'unavailable');
  assert.equal(result.classLabel, 'Sem dado neste recorte');
  assert.match(result.explanation, /Cobertura da vacina HPV \(9–14 anos\): dados indisponíveis para Colo do útero/);
  assert.doesNotMatch(result.swatch, /radial-gradient/, 'missing publication is not Dado insuficiente');
});

test('a value without a class in the reading shown keeps the value and says the class is missing', () => {
  const result = panelResult(place, profile({ within_60_days: { all: treatment({ '210140': { ...balsas, trend: null } }) } }), TREND, undefined);
  assert.equal(result.kind, 'value');
  assert.equal(result.value, '69,1%');
  assert.equal(result.classLabel, 'Dado insuficiente');
  assert.doesNotMatch(result.swatch, /repeating-linear-gradient/, 'dots and hatching never overlap');
  assert.equal(result.warning, `Faixa C. ${WARNING}`, 'the number is still there to be qualified');
});

test('closed Eixos carry their results: the applicable indicators, in the reading of the map', () => {
  const lines = axisResults(place, profile({
    within_60_days: { all: treatment({ '210140': balsas }) },
    mammography: { all: treatment({ '210140': { ...balsas, value: .21611, quality_band: null } }) },
    cytopathology: { all: treatment({ '210140': { ...balsas, value: .37262, quality_band: null, trend: 'stable' } }) },
    hpv: { all: treatment({ '210140': { ...balsas, value: 71.2, trend: null, status: 'near', quality_band: null } }) },
    mortality: { all: treatment({ '210140': { ...balsas, value: 78.324, trend: 'worsening', status: null, quality_band: null } }, { has_status: false }) },
    smoking: { all: { value: 9.14, status: 'far', trend: { trend_class: 'improving' }, capital_name: 'São Luís' } },
    estimated_cases: { all: { state_cases: 9630 } },
  }), TREND);
  assert.deepEqual(lines.acesso.map(line => [line.label, line.text, line.current]), [['Até 60 dias', '69,1% · Sem direção clara', true]]);
  assert.match(lines.acesso[0].swatch, /repeating-linear-gradient/, 'the band C texture only on the 60 dias');
  assert.deepEqual(lines.deteccao.map(line => [line.label, line.text]), [['Mamografias', '0,22 · Sem direção clara'], ['Citopatológicos', '0,37 · Estável']]);
  assert.doesNotMatch(lines.deteccao[0].swatch, /repeating-linear-gradient/);
  assert.deepEqual(lines.prevencao.map(line => [line.label, line.text]), [['Vacina HPV', '71,2% · Perto'], ['Fumantes na capital', '9,1% · Melhorando']]);
  assert.deepEqual(lines.panorama.map(line => [line.label, line.text]), [['Mortalidade', '78,32 por 100 mil · Piorando'], ['Casos estimados na UF', '9.630 por ano']]);
});

test('an Eixo title leaves out what does not apply to the cancer type and marks insufficient data', () => {
  const lines = axisResults(place, profile({
    within_60_days: { prostate: treatment({ '210140': { ...balsas, origin: 'insufficient', value: null, trend: null, status: null } }, { has_status: false }) },
    mortality: { prostate: treatment({}) },
  }), { ...TREND, cancerType: 'prostate' });
  assert.deepEqual(lines.acesso.map(line => line.text), ['Dado insuficiente']);
  assert.doesNotMatch(lines.acesso[0].swatch, /repeating-linear-gradient/);
  assert.deepEqual(lines.deteccao, [], 'an Eixo with only guidance has no result to show');
  assert.deepEqual(lines.prevencao, []);
  assert.deepEqual(lines.panorama.map(line => line.text), ['Sem dado neste recorte']);
  assert.doesNotMatch(lines.panorama[0].swatch, /radial-gradient/);
});
