import assert from 'node:assert/strict';
import { test, before } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { municipalityPath } from '../src/profile/profile.ts';

const listing = JSON.parse(readFileSync(new URL('../public/dados/municipalities.json', import.meta.url)));
const page = (m) => readFileSync(new URL(`../dist${municipalityPath(m)}index.html`, import.meta.url), 'utf8');
before(() => execFileSync('npm', ['run', 'build'], { cwd: new URL('..', import.meta.url), stdio: 'pipe', maxBuffer: 10 * 1024 * 1024 }));

const manifest = JSON.parse(readFileSync(new URL('../public/dados/manifest.json', import.meta.url)));
test('mammography is rendered from the published profile with its ratio, reference and approved action', {
  skip: !manifest.indicators.mammography && 'Initial SISCAN data load is pending; see implementation ticket 14.',
}, () => {
  const municipality = listing.municipalities.find(m => m.code === '261160');
  const profile = JSON.parse(readFileSync(new URL('../public/dados/profiles/PE.json', import.meta.url)));
  const mammography = profile.indicators.mammography.all;
  const entry = mammography.municipalities[municipality.code];
  const html = page(municipality).split('aria-label="Mamografias de rastreamento — 50–69 anos"')[1].split('</article>')[0];
  const value = entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  assert.ok(html.includes(`Razão ${value}`));
  assert.match(html, /Referência: razão 1 — meta/);
  assert.match(html, /<meter[^>]+max="1"/);
  assert.match(html, /A orientação atual do SUS abrange 50 a 74 anos/);
  assert.match(html, /Converse na UBS sobre quando fazer a mamografia/);
  assert.match(html, /Informe sua idade, seu histórico e qualquer alteração nas mamas/);
  assert.match(html, /Informação geral\. A equipe de saúde orienta o cuidado indicado para você/);
  assert.match(html, /\/metodologia\/#mamografia/);
  assert.doesNotMatch(html, /A orientação atual do SUS é o rastreamento de mulheres/);
  for (const point of mammography.series[entry.series_id]) assert.ok(html.includes(`<th scope="row">${point.year}</th>`));
  const all = JSON.parse(readFileSync(new URL('../public/dados/map/mammography/all.json', import.meta.url)));
  const breast = JSON.parse(readFileSync(new URL('../public/dados/map/mammography/breast.json', import.meta.url)));
  assert.equal(Object.keys(all.municipalities).length, listing.municipalities.length);
  assert.deepEqual(all.municipalities, breast.municipalities);
  assert.equal(all.municipalities[municipality.code].value, entry.value);
});

test('every municipality has a static page with four axes and the treatment action', () => {
  assert.equal(readdirSync(new URL('../dist/municipio/', import.meta.url)).length, listing.municipalities.length);
  const html = readFileSync(new URL('../dist/municipio/110020-porto-velho/index.html', import.meta.url), 'utf8');
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

test('where to treat shows published facilities and explains regulated access without JavaScript', () => {
  const municipality = listing.municipalities.find(m => m.code === '261160');
  const profile = JSON.parse(readFileSync(new URL('../public/dados/profiles/PE.json', import.meta.url)));
  const html = page(municipality);
  assert.match(html, /Saiba como chegar ao atendimento especializado/);
  assert.match(html, /A regulação.*define o hospital/);
  assert.match(html, /paciente não escolhe/);
  assert.match(html, /aproximada.*municípios/s);
  assert.ok(profile.where_to_treat.municipalities['261160'].length > 0);
  for (const entry of profile.where_to_treat.municipalities['261160']) {
    const facility = profile.where_to_treat.facilities[entry.cnes];
    assert.ok(html.includes(facility.name));
    assert.ok(html.includes(facility.municipality_name));
    for (const habilitation of facility.habilitations) assert.ok(html.includes(habilitation.label));
  }
  const section = html.split('aria-label="Onde se tratar"')[1].split('</aside>')[0];
  assert.doesNotMatch(section, /<meter|Referência:|Tendência:/);
});

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
  const treatment = html.split('id="60-dias"')[1].split('</section>')[0];
  assert.equal((treatment.match(/<h3/g) ?? []).length, 9);
  assert.match(html, /id="onde-se-tratar"/);
  for (const term of ['CMPT_INI', 'CMPT_FIM', 'haversine', 'CADGERBR', '27 UFs', 'SP 40–300']) assert.ok(html.includes(term));
  const manifest = JSON.parse(readFileSync(new URL('../public/dados/manifest.json', import.meta.url)));
  for (const term of ['quasi-Poisson', 'TRATAMENTO', 'Região imediata', 'TabNet', manifest.pipeline_version]) assert.ok(html.includes(term));
});

test('cervical screening card always explains the frozen series and retains the approved action', () => {
  const municipality = listing.municipalities.find(m => m.code === '261160');
  const html = page(municipality).split('aria-label="Citopatológicos — 25–64 anos"')[1].split('</article>')[0];
  assert.match(html, /Série encerrada em 2025 pela mudança no rastreamento/);
  assert.match(html, /Menos Papanicolaus não quer dizer menos cuidado/);
  assert.match(html, /Confira na UBS se seu exame está em dia/);
  assert.match(html, /disponibilidade do teste de HPV ou do Papanicolau/);
  const action = html.split('aria-label="Ação"')[1];
  assert.match(action, /A partir de 2025 o SUS está trocando o Papanicolau pelo teste de DNA-HPV/);
  assert.match(html, /Informação geral\. A equipe de saúde orienta o cuidado indicado para você/);
  assert.match(html, /\/metodologia\/#citopatologico/);
  assert.doesNotMatch(html, /após dois exames normais anuais consecutivos/);
  const methodology = readFileSync(new URL('../dist/metodologia/index.html', import.meta.url), 'utf8');
  assert.match(methodology, /id="citopatologico"/);
});

test('published cytopathology covers the mesh in both cancer selections and renders the frozen ratio series', () => {
  const municipality = listing.municipalities.find(m => m.code === '261160');
  const profile = JSON.parse(readFileSync(new URL('../public/dados/profiles/PE.json', import.meta.url)));
  const data = profile.indicators.cytopathology.all;
  const entry = data.municipalities[municipality.code];
  const html = page(municipality).split('aria-label="Citopatológicos — 25–64 anos"')[1].split('</article>')[0];
  const value = entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  assert.ok(html.includes(`Razão ${value}`));
  assert.match(html, /Referência: razão 1 — meta/);
  assert.match(html, /um terço das mulheres de 25–64 anos/);
  assert.match(html, /<meter[^>]+max="1"/);
  assert.match(html, /Período dos dados: 2016–2025/);
  assert.match(html, /Último ano consolidado: 2025/);
  for (const point of data.series[entry.series_id]) {
    assert.ok(point.year >= 2016 && point.year <= 2025);
    assert.ok(html.includes(`<th scope="row">${point.year}</th>`));
  }
  const all = JSON.parse(readFileSync(new URL('../public/dados/map/cytopathology/all.json', import.meta.url)));
  const cervix = JSON.parse(readFileSync(new URL('../public/dados/map/cytopathology/cervix.json', import.meta.url)));
  assert.equal(Object.keys(all.municipalities).length, listing.municipalities.length);
  assert.deepEqual(all.municipalities, cervix.municipalities);
  assert.equal(all.municipalities[municipality.code].value, entry.value);
  assert.equal(manifest.indicators.cytopathology.all.last_year, 2025);
});

test('mortality cards keep the approved action available without a Situação or prostate treatment caveat', () => {
  const html = page(listing.municipalities.find(m => m.code === '261160'));
  const cards = [...html.matchAll(/<article[^>]*aria-label="Tendência da mortalidade"[^>]*>([\s\S]*?)<\/article>/g)].map(match => match[1]);
  assert.equal(cards.length, 6);
  for (const card of cards) {
    assert.match(card, /Veja os caminhos de prevenção e cuidado/);
    assert.match(card, /Este dado descreve o território e não determina seu risco individual/);
    assert.match(card, /#acesso|#prevencao|#deteccao/);
    assert.doesNotMatch(card, /<h4>Situação|<meter|vigilância ativa/);
  }
  assert.match(cards[1], /−10%/);
  assert.match(cards[2], /−20%.*30–69/);
});

test('published mortality cards render national context and the standardized series without a status', {
  skip: !manifest.indicators.mortality && 'Initial SIM publication is pending Atlas validation.',
}, () => {
  const municipality = listing.municipalities.find(m => m.code === '261160');
  const profile = JSON.parse(readFileSync(new URL('../public/dados/profiles/PE.json', import.meta.url)));
  const cards = [...page(municipality).matchAll(/<article[^>]*aria-label="Tendência da mortalidade"[^>]*>([\s\S]*?)<\/article>/g)].map(match => match[1]);
  for (const [index, cancerType] of ['all', 'breast', 'cervix', 'prostate', 'colorectal', 'lung'].entries()) {
    const data = profile.indicators.mortality[cancerType];
    const entry = data.municipalities[municipality.code];
    assert.match(cards[index], /Tendência do Brasil, apenas como contexto/);
    assert.doesNotMatch(cards[index], /<h4>Situação|<meter/);
    for (const point of data.series[entry.series_id] ?? []) {
      assert.ok(cards[index].includes(`<th scope="row">${point.year}</th>`));
      const value = point.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      assert.ok(cards[index].includes(`${value} por 100 mil`));
    }
    const layer = JSON.parse(readFileSync(new URL(`../public/dados/map/mortality/${cancerType}.json`, import.meta.url)));
    assert.equal(layer.has_status, false);
    assert.equal(layer.reference, null);
    assert.deepEqual(layer.municipalities[municipality.code].trend, entry.trend);
  }
});
