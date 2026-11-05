import {
  CANCER_TYPES, formatIndicatorValue, formatPercent, hatchCss, INDICATORS, INSUFFICIENT_CSS, isHatched, NO_STATUS_NOTE, originText, QUALITY_WARNING,
  STATUS_LABELS, statusSwatch, TREND_LABELS, trendPeriodText, trendState, trendSwatch,
  type MapMode, type MunicipalityIndicator, type MunicipalityListing, type Period, type StatusClass,
} from '../map/indicator-layer.ts';
import type { MapState } from '../map/map-state.ts';
import { HPV_INSUFFICIENT, INSUFFICIENT_CASES, MORTALITY_INSUFFICIENT, SCREENING_INSUFFICIENT } from '../content/indicator-notes.ts';
import type { UfProfile } from './profile.ts';

type Place = MunicipalityListing['municipalities'][number];

/** What the panel says first, the same with the sheet collapsed or open (decision 04 of the UI polish). */
export interface PanelResult {
  kind: 'value' | 'insufficient' | 'adjustment' | 'unavailable';
  /** Why there is no number, or what a C55 adjustment that cannot be calculated means for it. */
  explanation: string | null;
  value: string | null;
  measure: string | null;
  classLabel: string;
  classContext: string | null;
  swatch: string;
  withoutInformation: string | null;
  origin: string | null;
  warning: string | null;
  caveat: { short: string; full: string } | null;
}

/** One line of a closed Eixo's title. Estimated cases have no class, so no swatch. */
export interface AxisResultLine {
  label: string;
  text: string;
  swatch: string | null;
  current: boolean;
}

interface IndicatorData {
  period: Period;
  has_status: boolean;
  reference: { value: number; label: string } | null;
  municipalities: Record<string, MunicipalityIndicator>;
}
type Indicators = Record<string, Record<string, IndicatorData> | undefined>;

const TREATMENT = 'within_60_days';
const MEASURES: Record<string, string> = {
  within_60_days: 'dos casos com quimio ou radio, em até 60 dias',
  mammography: 'razão de mamografias, meta 1',
  cytopathology: 'razão de citopatológicos, meta 1',
  hpv: 'cobertura da vacina HPV',
  mortality: 'mortes, padronizada por idade',
};
const INSUFFICIENT_TEXT: Record<string, string> = {
  within_60_days: INSUFFICIENT_CASES,
  mammography: SCREENING_INSUFFICIENT,
  cytopathology: SCREENING_INSUFFICIENT,
  hpv: HPV_INSUFFICIENT,
  mortality: MORTALITY_INSUFFICIENT,
};
const SHORT_NO_STATUS_NOTE = 'Sem comparação com o prazo da lei: vigilância ativa pode ser a conduta correta.';
const ADJUSTMENT_LABEL = 'Ajuste não calculável';
const UNAVAILABLE_LABEL = 'Sem dado neste recorte';
/** Neither a class nor Dado insuficiente, whose dots mean something else (spec, section 11.1). */
const NO_CLASS_SWATCH = 'var(--soft)';

/** The reading a result is shown in: HPV has only Situação, whatever the map's mode, and mortality only Tendência. */
function readingMode(indicator: string, mode: MapMode, data: Pick<IndicatorData, 'has_status'>): MapMode {
  if (indicator === 'hpv') return 'status';
  return mode === 'status' && data.has_status ? 'status' : 'trend';
}

/** The class of a result with a number, in the colors and the band C texture of the map. */
function classOf(indicator: string, entry: MunicipalityIndicator, mode: MapMode): { label: string; swatch: string } {
  if (mode === 'trend' && !entry.trend && entry.adjustment_note) return { label: ADJUSTMENT_LABEL, swatch: NO_CLASS_SWATCH };
  const shown = mode === 'status'
    ? { label: STATUS_LABELS[entry.status ?? 'insufficient'], swatch: statusSwatch(entry.status ?? 'insufficient') }
    : { label: TREND_LABELS[trendState(entry)], swatch: trendSwatch(trendState(entry)) };
  return indicator === TREATMENT && isHatched(entry, mode) ? { ...shown, swatch: hatchCss(shown.swatch) } : shown;
}

/** A result that has no number to show, with what takes its place. */
function withoutNumber(entry: MunicipalityIndicator): { kind: 'insufficient' | 'adjustment'; label: string; swatch: string } | null {
  if (entry.adjustment_note) return entry.value === null ? { kind: 'adjustment', label: ADJUSTMENT_LABEL, swatch: NO_CLASS_SWATCH } : null;
  return entry.origin === 'insufficient' ? { kind: 'insufficient', label: TREND_LABELS.insufficient, swatch: INSUFFICIENT_CSS } : null;
}

function indicatorData(profile: UfProfile, indicator: string, cancerType: string): IndicatorData | undefined {
  return (profile.indicators as unknown as Indicators)[indicator]?.[cancerType];
}

const unavailable = (explanation: string | null): PanelResult => ({
  kind: 'unavailable', explanation, value: null, measure: null, classLabel: UNAVAILABLE_LABEL, classContext: null,
  swatch: NO_CLASS_SWATCH, withoutInformation: null, origin: null, warning: null, caveat: null,
});

export function panelResult(place: Place, profile: UfProfile, state: MapState, region: string | undefined): PanelResult {
  const { indicator, cancerType } = state;
  const data = indicatorData(profile, indicator, cancerType);
  const entry = data?.municipalities[place.code];
  if (!data || !entry) return unavailable(`${INDICATORS[indicator]!.name}: dados indisponíveis para ${CANCER_TYPES[cancerType]}. Os Eixos abaixo trazem o restante.`);
  const treatment = indicator === TREATMENT;
  const caveat = treatment && !data.has_status ? { short: SHORT_NO_STATUS_NOTE, full: NO_STATUS_NOTE } : null;
  const missing = withoutNumber(entry);
  if (missing) return {
    kind: missing.kind, classLabel: missing.label, swatch: missing.swatch, caveat,
    explanation: missing.kind === 'adjustment' ? `${originText(entry, region)}.` : INSUFFICIENT_TEXT[indicator]!,
    value: null, measure: null, classContext: null, withoutInformation: null, origin: null, warning: null,
  };
  const mode = readingMode(indicator, state.mode, data);
  const { label, swatch } = classOf(indicator, entry, mode);
  const { period, reference } = data;
  return {
    kind: 'value',
    explanation: entry.adjustment_note ? `${originText(entry, region)}.` : null,
    value: formatIndicatorValue(indicator, entry.value),
    measure: `${MEASURES[indicator]} · ${period.latest}`,
    classLabel: label,
    classContext: mode === 'status'
      ? reference && `Referência ${formatIndicatorValue(indicator, reference.value)}`
      : period.trend.length ? `Tendência ${trendPeriodText(period)}` : null,
    swatch,
    withoutInformation: treatment ? `${formatPercent(entry.without_treatment_info)} de todos os casos sem informação de tratamento, ${period.latest}` : null,
    // originText speaks of the adjustment first, which the explanation above already says.
    origin: entry.origin === 'immediate_region' ? originText({ ...entry, adjustment_note: null }, region) : null,
    warning: treatment && entry.quality_band === 'C' ? `Faixa C. ${QUALITY_WARNING}` : null,
    caveat,
  };
}

function indicatorLine(place: Place, profile: UfProfile, state: MapState, indicator: string): AxisResultLine[] {
  const text = INDICATORS[indicator]!;
  if (!text.modes[state.cancerType]) return [];
  const line = { label: text.shortName, current: indicator === state.indicator };
  const data = indicatorData(profile, indicator, state.cancerType);
  const entry = data?.municipalities[place.code];
  if (!data || !entry) return [{ ...line, text: UNAVAILABLE_LABEL, swatch: NO_CLASS_SWATCH }];
  const missing = withoutNumber(entry);
  if (missing) return [{ ...line, text: missing.label, swatch: missing.swatch }];
  const { label, swatch } = classOf(indicator, entry, readingMode(indicator, state.mode, data));
  return [{ ...line, text: `${formatIndicatorValue(indicator, entry.value)} · ${label}`, swatch }];
}

function smokingLine(profile: UfProfile, state: MapState): AxisResultLine[] {
  const data = profile.indicators.smoking?.[state.cancerType];
  if (!data) return [];
  const status = state.mode === 'status';
  const trend = data.trend?.trend_class ?? 'insufficient';
  return [{
    label: 'Fumantes na capital',
    text: `${formatPercent(data.value)} · ${status ? STATUS_LABELS[data.status] : TREND_LABELS[trend]}`,
    swatch: status ? statusSwatch(data.status satisfies StatusClass) : trendSwatch(trend),
    current: false,
  }];
}

function estimatedCasesLine(profile: UfProfile, state: MapState): AxisResultLine[] {
  const data = profile.indicators.estimated_cases?.[state.cancerType];
  return data ? [{ label: 'Casos estimados na UF', text: `${data.state_cases.toLocaleString('pt-BR')} por ano`, swatch: null, current: false }] : [];
}

/** What each closed Eixo says in its title, by the id of the Eixo. An Eixo with only guidance has no line. */
export function axisResults(place: Place, profile: UfProfile, state: MapState): Record<string, AxisResultLine[]> {
  const lines = (...indicators: string[]) => indicators.flatMap(indicator => indicatorLine(place, profile, state, indicator));
  return {
    acesso: lines(TREATMENT),
    deteccao: lines('mammography', 'cytopathology'),
    prevencao: [...lines('hpv'), ...smokingLine(profile, state)],
    panorama: [...lines('mortality'), ...estimatedCasesLine(profile, state)],
  };
}
