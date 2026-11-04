import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderMunicipalityPreview } from '../src/map/municipality-preview.ts';
const place = { code: '261160', name: 'Recife', uf: 'PE', immediate_region: '1' };
const entry = { value: 72, trend: 'improving', status: 'near', origin: 'immediate_region', quality_band: 'C', without_treatment_info: 40, status_note: null };
const layer = { indicator: 'within_60_days', cancer_type: 'all', has_status: true, reference: { value: 100, label: 'meta' }, period: { latest: 2024, first_year: 2014, last_year: 2025, trend: [2015, 2024], provisional: [2025], quality_years: [2022, 2023] }, source: { name: 'Painel', url: 'https://example.org', conditions: 'Dados abertos' }, quality: { '26': { band: 'C', without_treatment_info: 42 } }, municipalities: { '261160': entry } };
const render = (overrides = {}, details) => renderMunicipalityPreview(place, 'Recife', { ...layer, ...overrides }, 'trend', details);
test('preview identifies regional results, distinct periods, quality and action', () => {
 const html = render();
 for (const text of ['Recife (PE)', 'Seu município e vizinhos — região de Recife', '72,0%', 'Melhorando', 'Referência', '2022–2023', '2024', '42,0%', '40,0%', 'Muitos casos estão sem informação', 'Conheça seus direitos', 'quimioterapia ou radioterapia']) assert.ok(html.includes(text), text);
 assert.doesNotMatch(html, /<svg|Onde se tratar/);
});

test('mortality adjustment is distinct from insufficient data and never has status or reference', () => {
 const html = render({ indicator: 'mortality', cancer_type: 'cervix', has_status: false, reference: null, municipalities: { '261160': { ...entry, origin: 'insufficient', trend: null, adjustment_note: 'not_calculable', value: null } } });
 assert.match(html, /Ajuste não calculável/);
 assert.match(html, /Estimativa ajustada para registros sem localização/);
 assert.match(html, /Veja os caminhos de prevenção e cuidado/);
 assert.doesNotMatch(html, /Dado insuficiente|Poucos casos aqui|Situação:|Referência:|vigilância ativa/);
});
test('HPV uses situation only and loads denominator notes from the selected UF', () => {
 const html = render({ indicator: 'hpv', cancer_type: 'cervix' }, { indicators: { hpv: { cervix: { municipalities: { '261160': { denominator_note: 'Denominador regional publicado' } } } } } });
 for (const text of ['Situação:', 'série curta, ainda sem direção', 'dose única', 'Censo 2022', 'Denominador regional publicado']) assert.ok(html.includes(text), text);
 assert.doesNotMatch(html, /Melhorando|Muitos casos estão sem informação|Qualidade do registro/);
});
test('prostate and insufficient data keep their caveats and action without a situation', () => {
 const prostate = render({ cancer_type: 'prostate', has_status: false });
 assert.match(prostate, /vigilância ativa/); assert.doesNotMatch(prostate, /Situação:|Referência:/);
 const insufficient = render({ municipalities: { '261160': { ...entry, origin: 'insufficient', trend: null, value: null } } });
 assert.match(insufficient, /Poucos casos aqui/); assert.match(insufficient, /Conheça seus direitos/);
 assert.match(insufficient, /42,0%/);
});
test('missing publication retains an explanation and action; screening caveats remain visible', () => {
 const missing = renderMunicipalityPreview(place, 'Recife', undefined, 'status', undefined, 'hpv');
 assert.match(missing, /ainda não estão disponíveis/); assert.match(missing, /Confira sua vacinação/);
 assert.match(render({ indicator: 'mammography' }), /50 e 69.*50 a 74/s);
 assert.match(render({ indicator: 'cytopathology' }), /DNA-HPV/);
});
