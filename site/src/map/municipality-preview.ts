import { CANCER_TYPES, INDICATORS, formatIndicatorValue, formatPercent, originText, statusText, trendText, trendDescriptions, QUALITY_WARNING, NO_STATUS_NOTE, qualityText, ufQuality, type IndicatorLayer, type MapMode, type MunicipalityListing } from './indicator-layer.ts';
import { treatmentAction, mammographyAction, cervicalScreeningAction, hpvAction } from '../content/actions.ts';
import { TREATMENT_SCOPE, INSUFFICIENT_CASES, MAMMOGRAPHY_AGES, CYTOPATHOLOGY_TRANSITION, SCREENING_SCOPE, HPV_DIRECTION, HPV_DOSE, HPV_DENOMINATOR, C55_NOTE } from '../content/indicator-notes.ts';
import { municipalityPath, type UfProfile } from '../profile/profile.ts';

type Place = MunicipalityListing['municipalities'][number];
const escape = (text: unknown) => String(text).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
const p = (text: unknown) => `<p>${escape(text)}</p>`;
const methodology: Record<string, string> = { within_60_days: '60-dias', mammography: 'mamografia', cytopathology: 'citopatologico', hpv: 'hpv', mortality: 'mortalidade' };

/** Render published results only; the full series and other axes belong to the municipal page. */
export function renderMunicipalityPreview(place: Place, region: string, layer: IndicatorLayer | undefined, mode: MapMode, details?: UfProfile, indicator = layer?.indicator ?? 'within_60_days', cancerType = layer?.cancer_type ?? 'all'): string {
  const presentation = INDICATORS[indicator]!;
  const treatment = indicator === 'within_60_days';
  const hpv = indicator === 'hpv';
  const mortality = indicator === 'mortality';
  const entry = layer?.municipalities[place.code];
  const lines = [p(`${place.name} (${place.uf})`), `<h3>${escape(presentation.name)}</h3>`, p(`${CANCER_TYPES[cancerType]} · ${mode === 'trend' ? 'Tendência' : 'Como está hoje'}`)];
  if (!layer || !entry) lines.push(p('Os dados desta seleção ainda não estão disponíveis. Você pode consultar os demais indicadores em Meu município.'));
  else {
    const { period } = layer;
    if (treatment && entry.quality_band === 'C') lines.push(`<p class="warning"><strong>${QUALITY_WARNING}</strong></p>`);
    lines.push(p(originText(entry, region)), p(`Período dos dados: ${period.first_year}–${period.last_year}. Último ano consolidado: ${period.latest}.`));
    if (entry.origin === 'immediate_region') lines.push(p('Há poucos casos ou pessoas no município; usamos os dados do seu município e vizinhos.'));
    if (entry.origin === 'insufficient' && !entry.adjustment_note) lines.push(p(hpv ? 'A população de 9–14 anos é insuficiente aqui e na região para calcular o indicador.' : INSUFFICIENT_CASES));
    else {
      if (entry.adjustment_note) lines.push(p('Ajuste não calculável: faltam registros para estimar a redistribuição do C55. Os anos afetados ficam sem taxa; isso não significa automaticamente dado insuficiente.'));
      lines.push(p(`${presentation.valueLabel} em ${period.latest}: ${formatIndicatorValue(indicator, entry.value)}`));
      if (layer.has_status && !mortality) {
        lines.push(p(`Situação: ${statusText(entry, layer)}`));
        if (layer.reference) lines.push(p(`Referência: ${formatIndicatorValue(indicator, layer.reference.value)} — ${layer.reference.label}.`));
      }
    }
    if (entry.status_note) lines.push(p(entry.status_note));
    if (!hpv) {
      lines.push(p(`Tendência (${period.trend.join('–')}): ${entry.adjustment_note && !entry.trend ? 'Ajuste não calculável' : trendText(indicator, entry)}`));
      if (entry.trend) lines.push(p(trendDescriptions(presentation)[entry.trend]));
    }
    if (treatment) {
      lines.push(p(`Sem informação de tratamento em ${period.latest}: ${formatPercent(entry.without_treatment_info)} de todos os casos diagnosticados. Falta de registro não significa falta de tratamento.`));
      lines.push(p(`Qualidade do registro no estado: ${qualityText(ufQuality(layer, place.code))}, período ${period.quality_years?.join('–') ?? 'não disponível'}.`));
      if (!layer.has_status) lines.push(p(NO_STATUS_NOTE));
    }
    if (period.provisional.length) lines.push(p(`Anos provisórios: ${period.provisional.join(', ')}. Não entram ${hpv ? 'na Situação' : 'na Tendência'}.`));
    lines.push(`<p>Fonte: <a href="${escape(layer.source.url)}">${escape(layer.source.name)}</a>. ${escape(layer.source.conditions)}</p>`);
    const denominator = details?.indicators.hpv?.[layer.cancer_type]?.municipalities[place.code]?.denominator_note;
    if (hpv && denominator) lines.push(p(denominator));
  }
  if (treatment) lines.push(p(TREATMENT_SCOPE));
  if (indicator === 'mammography') lines.push(p(MAMMOGRAPHY_AGES), p(SCREENING_SCOPE));
  if (indicator === 'cytopathology') lines.push(p(CYTOPATHOLOGY_TRANSITION), p(cervicalScreeningAction.transition), p(SCREENING_SCOPE));
  if (hpv) lines.push(p(HPV_DIRECTION), p(HPV_DOSE), p(HPV_DENOMINATOR));
  if (mortality && cancerType === 'cervix') lines.push(p(C55_NOTE));
  const action = treatment ? treatmentAction : hpv ? hpvAction : indicator === 'mammography' ? mammographyAction : indicator === 'cytopathology' ? cervicalScreeningAction : null;
  lines.push('<section aria-label="Ação"><h3>Ação</h3>');
  if (action) {
    lines.push(`<h4>${escape(action.title)}</h4>`, p(action.summary), p(action.disclaimer), '<details><summary>Saiba mais</summary><ul>');
    for (const source of action.sources) lines.push(`<li><a href="${escape(source.url)}">${escape(source.title)}</a></li>`);
    lines.push('</ul></details>');
  } else {
    lines.push(p('Veja os caminhos de prevenção e cuidado.'), p('Este dado descreve o território e não determina seu risco individual.'));
    const path = escape(municipalityPath(place));
    lines.push(`<p><a href="${path}#prevencao">Prevenção</a> · <a href="${path}#deteccao">Detecção precoce</a> · <a href="${path}#acesso">Acesso ao tratamento</a> — veja os caminhos para o tipo de câncer selecionado.</p>`);
  }
  lines.push('</section>', `<p><a href="/metodologia/#${methodology[indicator]}">Como calculamos</a></p>`);
  return lines.join('');
}
