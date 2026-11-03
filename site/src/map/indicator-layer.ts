/**
 * The map layer exported by the pipeline (spec, section 15) and how the site
 * names and colors what it says. Every number arrives ready: the site only
 * looks values up and formats them, it never computes a statistic.
 */

export type TrendClass = "improving" | "worsening" | "stable" | "no_clear_direction";

/** What the map shows for a municipality: a Tendência class, or not enough data. */
export type TrendState = TrendClass | "insufficient";

/**
 * Whose data a municipality shows (spec, section 8): its own, its immediate
 * region's when it has too few cases, or none when the region has too few too.
 */
export type Origin = "municipality" | "immediate_region" | "insufficient";

/**
 * Quality of the treatment records in the municipality's UF (spec, section 6.3),
 * from the % of all the cases without treatment information: A up to 15%, B
 * above 15% and below 35%, C from 35%.
 */
export type QualityBand = "A" | "B" | "C";

export interface MunicipalityIndicator {
  origin: Origin;
  trend: TrendClass | null;
  status: StatusClass | null;
  status_note: string | null;
  /** % treated within 60 days in the latest consolidated year; the region's when `origin` is "immediate_region". */
  value: number | null;
  /** % without treatment information in the same year. */
  without_treatment_info: number | null;
  /** The band of the municipality's UF; null only for a UF without cases. */
  quality_band: QualityBand | null;
}

/** A UF's band and its % without treatment information over the band's years. */
export interface UfQuality {
  band: QualityBand | null;
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
  /** Which cases `value` is measured on, e.g. "chemo_radio"; absent means all of them. */
  value_cases?: string;
  /** First and last year of the quality band: `[first, last]`; absent for indicators without one. */
  quality_years?: number[];
}

/** The 60 dias Tendência and value use only the cases first treated with chemo or radio (spec, sections 7 and 9). */
const MEASURED_CASES_TEXT: Record<string, string> = {
  chemo_radio: "casos tratados com quimioterapia ou radioterapia",
};

function casesText(cases: string): string {
  return MEASURED_CASES_TEXT[cases] ?? cases;
}

/**
 * Which cases the Tendência and the value of the latest year speak about, for the
 * legend, the tooltip and the table; null when both are over all the cases.
 */
export function measuredCasesText(period: Period): string | null {
  const { trend_cases: trend, value_cases: value } = period;
  if (trend && trend === value) return `Tendência e valor do último ano medidos nos ${casesText(trend)}`;
  const parts = [
    trend && `Tendência medida nos ${casesText(trend)}`,
    value && `valor do último ano medido nos ${casesText(value)}`,
  ].filter(Boolean);
  if (!parts.length) return null;
  const text = parts.join("; ");
  return text[0]!.toUpperCase() + text.slice(1);
}

export interface IndicatorLayer {
  indicator: string;
  cancer_type: string;
  /** Whether the indicator has a Situação for this cancer type; the 60 dias in prostate has none. */
  has_status: boolean;
  reference: { value: number; label: string } | null;
  source: { name: string; url: string; conditions: string; period: string };
  period: Period;
  /** By 2-digit UF code. */
  quality?: Record<string, UfQuality>;
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

/** "Dado insuficiente" is near-white with gray dots, never plain white (spec, section 11.1). */
export const INSUFFICIENT_DOTS = { color: "#8a9099", spacing: 6, radius: 1 };

/** The dotted fill as CSS, for the legend swatch. */
export const INSUFFICIENT_CSS =
  `radial-gradient(circle, ${INSUFFICIENT_DOTS.color} ${INSUFFICIENT_DOTS.radius}px, ` +
  `transparent ${INSUFFICIENT_DOTS.radius + 0.5}px) ` +
  `0 0 / ${INSUFFICIENT_DOTS.spacing}px ${INSUFFICIENT_DOTS.spacing}px, ${TREND_COLORS.insufficient}`;

/**
 * Band C gets diagonal hatching on the treatment indicator only (spec, section
 * 11.1): dark lines, unlike the gray dots of "dado insuficiente", drawn over the
 * Tendência color so the class still shows.
 */
export const HATCH = { color: "rgba(31, 41, 51, 0.7)", spacing: 6, width: 1.5 };

/** The hatched fill as CSS, for the legend swatch, over the most common class. */
export const HATCH_CSS =
  `repeating-linear-gradient(-45deg, ${HATCH.color} 0 ${HATCH.width}px, ` +
  `transparent ${HATCH.width}px ${HATCH.spacing}px), ${TREND_COLORS.no_clear_direction}`;

/** The approved warning of band C (spec, section 6.3). */
export const QUALITY_WARNING =
  "Muitos casos estão sem informação de tratamento; o resultado pode não representar toda a situação.";

/**
 * Whether a municipality is hatched: band C, with a class in the selected mode. A
 * municipality with "dado insuficiente" keeps only its dots, so the two
 * textures never overlap.
 */
export function isHatched(entry: MunicipalityIndicator | undefined, mode: MapMode = "trend"): boolean {
  const state = mode === "status" ? entry?.status ?? "insufficient" : trendState(entry);
  return entry?.quality_band === "C" && state !== "insufficient";
}

export function qualityPeriodText(period: Period): string | null {
  return period.quality_years ? `${period.quality_years[0]}–${period.quality_years[1]}` : null;
}

/** "Faixa C (37,2% sem informação de tratamento)", for the tooltip and the table. */
export function qualityText(quality: UfQuality | undefined): string {
  if (!quality?.band) return "—";
  return `Faixa ${quality.band} (${formatPercent(quality.without_treatment_info)} sem informação de tratamento)`;
}

/** The quality of a municipality's UF, looked up by the UF part of its code. */
export function ufQuality(layer: IndicatorLayer, code: string): UfQuality | undefined {
  return layer.quality?.[code.slice(0, 2)];
}

/** The swatch of a legend entry: a plain color, or the dots of "dado insuficiente". */
export function trendSwatch(state: TrendState): string {
  return state === "insufficient" ? INSUFFICIENT_CSS : TREND_COLORS[state];
}

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

/** The cancer types of the selector, in its order; "all" is the default view (spec, section 3). */
export const CANCER_TYPES: Record<string, string> = {
  all: "Todos os cânceres",
  breast: "Mama",
  cervix: "Colo do útero",
  prostate: "Próstata",
  colorectal: "Colorretal",
  lung: "Pulmão",
};

/** "Todos os cânceres": its definition changes between axes (spec, section 5). */
export const ALL_CANCERS = "all";

export const DEFAULT_CANCER_TYPE = ALL_CANCERS;

/** The approved note beside the selector on "Todos os cânceres" (spec, section 11.2). */
export const ALL_CANCERS_NOTE =
  "Cada eixo usa os registros adequados ao seu indicador. No tratamento, excluímos alguns tipos " +
  "com informação incompleta. Por isso, 'Todos os cânceres' não reúne exatamente os mesmos tipos em todos os eixos.";

/**
 * The fixed caveat of a cancer type without Situação (spec, sections 5 and 6.3):
 * in prostate cancer, active surveillance is correct care.
 */
export const NO_STATUS_NOTE =
  "Na próstata, acompanhar o câncer antes de tratar (vigilância ativa) pode ser a conduta correta. " +
  "Por isso, começar o tratamento depois de 60 dias não indica, sozinho, falta de acesso, e este " +
  "indicador não é comparado ao prazo da lei: o mapa mostra só a Tendência.";

/** The notes shown beside the cancer type selector for a layer. */
export function cancerTypeNotes(layer: Pick<IndicatorLayer, "cancer_type" | "has_status">): string[] {
  const notes: string[] = [];
  if (layer.cancer_type === ALL_CANCERS) notes.push(ALL_CANCERS_NOTE);
  if (!layer.has_status) notes.push(NO_STATUS_NOTE);
  return notes;
}

/** One line per legend entry; "estável" and "sem direção clara" are the approved texts. */
export function trendDescriptions(indicator: IndicatorText): Record<TrendState, string> {
  return {
    improving: indicator.improving,
    worsening: indicator.worsening,
    stable: "quase não mudou, menos de 1% por ano em relação ao próprio valor.",
    no_clear_direction: "pode ter subido ou caído; os dados não bastam para dizer.",
    insufficient: "poucos casos no município e na sua região para dizer a direção.",
  };
}

/**
 * A municipality below the minimum shows its immediate region, with the region's
 * color. The public reads the region as "seu município e vizinhos" (GLOSSARY.md).
 */
export const REGION_NOTE =
  "Municípios com poucos casos mostram o dado do município somado ao dos vizinhos, com a mesma cor.";

/** The name of a municipality's immediate region, as IBGE names it. */
export function immediateRegionName(
  place: MunicipalityListing["municipalities"][number] | undefined,
  listing: MunicipalityListing,
): string | undefined {
  return place && listing.immediate_regions[place.immediate_region];
}

/**
 * Where a municipality's data comes from, for the tooltip and the table. Without
 * a Tendência class it reads as "dado insuficiente", like its color.
 */
export function originText(entry: MunicipalityIndicator | undefined, region: string | undefined): string {
  if (!entry || entry.origin === "insufficient") return "Poucos casos no município e na sua região para calcular o indicador";
  if (entry?.origin === "immediate_region") {
    return region ? `Seu município e vizinhos — região de ${region}` : "Seu município e vizinhos";
  }
  return "Dado do próprio município";
}

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


export type MapMode = "trend" | "status";
export type StatusClass = "reached" | "near" | "far";
export const STATUS_STATES: (StatusClass | "insufficient")[] = ["reached", "near", "far", "insufficient"];
export const STATUS_COLORS = { reached: "#54278f", near: "#9e9ac8", far: "#dadaeb", insufficient: TREND_COLORS.insufficient };
export const STATUS_LABELS = { reached: "Alcançou", near: "Perto", far: "Longe", insufficient: "Dado insuficiente" };
export const STATUS_LEGEND = "A cor mostra a distância até a referência. Não é um ranking entre municípios.";

export function statusText(entry: MunicipalityIndicator | undefined, layer: IndicatorLayer): string {
  return layer.has_status ? STATUS_LABELS[entry?.status ?? "insufficient"] : "Não se aplica";
}
