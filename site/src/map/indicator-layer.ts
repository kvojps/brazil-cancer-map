/**
 * The map layer exported by the pipeline (spec, section 15) and how the site
 * names and colors what it says. Every number arrives ready: the site only
 * looks values up and formats them, it never computes a statistic.
 */

export type TrendClass = "improving" | "worsening" | "stable" | "no_clear_direction";

/** What the map shows for a municipality: a Tendência class, or not enough data. */
export type TrendState = TrendClass | "insufficient";

export interface MunicipalityIndicator {
  /** Whose data this is: the municipality's own, or none with enough cases. */
  origin: "municipality" | "insufficient";
  trend: TrendClass | null;
  /** % treated within 60 days in the latest consolidated year. */
  value: number | null;
  /** % without treatment information in the same year. */
  without_treatment_info: number | null;
}

export interface Period {
  first_year: number;
  last_year: number;
  provisional: number[];
  /** Latest consolidated year: the year of `value`. */
  latest: number;
  /** First and last year of the Tendência: `[first, last]`. */
  trend: number[];
  /** Which cases the Tendência is measured on, e.g. "chemo_radio"; absent means all of them. */
  trend_cases?: string;
}

/** The 60 dias Tendência uses only the cases first treated with chemo or radio (spec, section 7). */
const TREND_CASES_TEXT: Record<string, string> = {
  chemo_radio: "casos tratados com quimioterapia ou radioterapia",
};

/** Which cases the Tendência speaks about, for the legend, the tooltip and the table; null for all. */
export function trendCasesText(period: Period): string | null {
  if (!period.trend_cases) return null;
  return `Tendência medida nos ${TREND_CASES_TEXT[period.trend_cases] ?? period.trend_cases}`;
}

export interface IndicatorLayer {
  indicator: string;
  cancer_type: string;
  source: { name: string; url: string; conditions: string; period: string };
  period: Period;
  municipalities: Record<string, MunicipalityIndicator>;
}

export interface MunicipalityListing {
  municipalities: { code: string; name: string; uf: string; immediate_region: string }[];
  immediate_regions: Record<string, string>;
}

export function trendState(entry: MunicipalityIndicator | undefined): TrendState {
  return entry?.trend ?? "insufficient";
}

/** Legend order. */
export const TREND_STATES: TrendState[] = [
  "improving",
  "worsening",
  "stable",
  "no_clear_direction",
  "insufficient",
];

/**
 * Tendência colors, without red (spec, section 11.1): blue-green and amber stay
 * apart for the common color-vision deficiencies; the grays differ in lightness.
 */
export const TREND_COLORS: Record<TrendState, string> = {
  improving: "#1d8a87",
  worsening: "#d9961a",
  stable: "#80868f",
  no_clear_direction: "#c8ccd2",
  insufficient: "#f3f2ec",
};

export const TREND_LABELS: Record<TrendState, string> = {
  improving: "Melhorando",
  worsening: "Piorando",
  stable: "Estável",
  no_clear_direction: "Sem direção clara",
  insufficient: "Dado insuficiente",
};

export interface IndicatorText {
  name: string;
  /** What "melhorando" and "piorando" mean for this indicator. */
  improving: string;
  worsening: string;
}

export const INDICATORS: Record<string, IndicatorText> = {
  within_60_days: {
    name: "Até 60 dias para começar o tratamento",
    improving: "mais casos passaram a começar o tratamento em até 60 dias.",
    worsening: "menos casos passaram a começar o tratamento em até 60 dias.",
  },
};

export const CANCER_TYPES: Record<string, string> = {
  all: "Todos os cânceres",
};

/** One line per legend entry; "estável" and "sem direção clara" are the approved texts. */
export function trendDescriptions(indicator: IndicatorText): Record<TrendState, string> {
  return {
    improving: indicator.improving,
    worsening: indicator.worsening,
    stable: "quase não mudou, menos de 1% por ano em relação ao próprio valor.",
    no_clear_direction: "pode ter subido ou caído; os dados não bastam para dizer.",
    insufficient: "poucos casos para dizer a direção.",
  };
}

export const ORIGIN_TEXT: Record<MunicipalityIndicator["origin"], string> = {
  municipality: "Dado do próprio município",
  insufficient: "Poucos casos aqui para dizer a direção",
};

const percent = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatPercent(value: number | null): string {
  return value === null ? "—" : `${percent.format(value)}%`;
}

export function trendPeriodText(period: Period): string {
  return `${period.trend[0]}–${period.trend[1]}`;
}
