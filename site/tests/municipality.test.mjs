import assert from 'node:assert/strict';
import { test, before } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const listing = JSON.parse(readFileSync(new URL('../public/dados/municipalities.json', import.meta.url)));
const slug = (m) => `${m.code}-${m.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
const page = (m) => readFileSync(new URL(`../dist/municipio/${slug(m)}/index.html`, import.meta.url), 'utf8');
before(() => execFileSync('npm', ['run', 'build'], { cwd: new URL('..', import.meta.url), stdio: 'pipe', maxBuffer: 10 * 1024 * 1024 }));

test('every municipality has a static page with four axes and the treatment action', () => {
  assert.equal(readdirSync(new URL('../dist/municipio/', import.meta.url)).length, listing.municipalities.length);
  const html = page(listing.municipalities.find(m => m.code === '110020'));
  assert.match(html, /Casos tratados com quimioterapia ou radioterapia: % que começou em até 60 dias/);
  const axes = ['Acesso ao tratamento', 'Detecção precoce', 'Prevenção', 'Panorama'].map(label => html.indexOf(`>${label}</h2>`));
  assert.ok(axes.every((position, i) => position >= 0 && (i === 0 || position > axes[i - 1])));
  assert.match(html, /Conheça seus direitos e acompanhe seu encaminhamento/);
  assert.match(html, /Como calculamos/);
  assert.match(html, /2026-10-17/);
  assert.match(html, /stroke-dasharray="6 4"/);
  assert.match(html, /2025.*provisório/s);
});

function example(origin, cancerType = 'all', band) {
  for (const file of readdirSync(new URL('../public/dados/profiles/', import.meta.url))) {
    const profile = JSON.parse(readFileSync(new URL(`../public/dados/profiles/${file}`, import.meta.url)));
    const treatment = profile.indicators.within_60_days[cancerType];
    for (const [code, entry] of Object.entries(treatment.municipalities)) {
      if (entry.origin === origin && (!band || entry.quality_band === band)) {
        return { treatment, entry, municipality: listing.municipalities.find(m => m.code === code) };
      }
    }
  }
  throw new Error(`No published example for ${origin}/${cancerType}/${band}`);
}
function card(municipality, cancerType) {
  return page(municipality).split(`data-cancer-type="${cancerType}"`)[1].split('data-cancer-type=')[0];
}
const percent = (value) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

test('regional cards show the region name and the exported regional values', () => {
  const { entry, municipality } = example('immediate_region');
  const html = card(municipality, 'all');
  assert.ok(html.includes(`Seu município e vizinhos (região de ${listing.immediate_regions[municipality.immediate_region]})`));
  assert.ok(html.includes(percent(entry.value)));
  assert.ok(html.includes(percent(entry.without_treatment_info)));
  assert.match(html, /Há poucos casos no município/);
});

test('insufficient cards retain the action and show state trend only as context', () => {
  const { municipality } = example('insufficient');
  const html = card(municipality, 'all');
  assert.match(html, /Poucos casos aqui para dizer a direção/);
  assert.match(html, /Tendência no seu estado/);
  assert.match(html, /Conheça seus direitos/);
  assert.doesNotMatch(html, /<meter|<svg|Ver a série em tabela/);
});

test('quality C opens with a warning and prostate has no status bar', () => {
  const { municipality } = example('municipality', 'all', 'C');
  const html = card(municipality, 'all');
  assert.ok(html.indexOf('Muitos casos estão sem informação') < html.indexOf('Casos tratados com quimioterapia'));
  const prostate = card(municipality, 'prostate');
  assert.match(prostate, /vigilância ativa/);
  assert.doesNotMatch(prostate, /<meter|Situação em/);
});

test('methodology documents all nine steps and links from the cards resolve', () => {
  const html = readFileSync(new URL('../dist/metodologia/index.html', import.meta.url), 'utf8');
  assert.match(html, /id="60-dias"/);
  assert.equal((html.match(/<h3/g) ?? []).length, 9);
  const manifest = JSON.parse(readFileSync(new URL('../public/dados/manifest.json', import.meta.url)));
  for (const term of ['quasi-Poisson', 'TRATAMENTO', 'Região imediata', 'TabNet', manifest.pipeline_version]) assert.ok(html.includes(term));
});
