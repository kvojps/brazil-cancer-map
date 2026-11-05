import { CANCER_TYPES, DEFAULT_CANCER_TYPE, INDICATORS, type MapMode } from "./indicator-layer.ts";

export interface MapState {
  indicator: string;
  cancerType: string;
  mode: MapMode;
}

export const DEFAULT_INDICATOR = "within_60_days";
export type IndicatorCatalog = Record<string, { modes: Record<string, readonly MapMode[]> }>;

/** Availability lives beside each indicator's presentation, shared by controls and URL parsing. */
export const MAP_INDICATORS: IndicatorCatalog = INDICATORS;

export function normalizeMapState(
  input: { indicator?: string | null; cancerType?: string | null; mode?: string | null },
  catalog: IndicatorCatalog = MAP_INDICATORS,
): MapState {
  const cancerType = Object.hasOwn(CANCER_TYPES, input.cancerType ?? "") ? input.cancerType! : DEFAULT_CANCER_TYPE;
  let indicator = Object.hasOwn(catalog, input.indicator ?? "") ? input.indicator! : DEFAULT_INDICATOR;
  if (!catalog[indicator]?.modes[cancerType]) indicator = DEFAULT_INDICATOR;
  const modes = catalog[indicator]!.modes[cancerType]!;
  const mode = modes.includes(input.mode as MapMode) ? input.mode as MapMode : modes[0]!;
  return { indicator, cancerType, mode };
}

/** The current selection in few words, for the button that opens the filters on a phone. */
export function filterSummary({ indicator, cancerType, mode }: MapState): string {
  return [INDICATORS[indicator]!.shortName, CANCER_TYPES[cancerType], mode === "trend" ? "Tendência" : "Como está hoje"].join(" · ");
}

export function readMapState(params: URLSearchParams, catalog: IndicatorCatalog = MAP_INDICATORS): MapState {
  return normalizeMapState({ indicator: params.get("indicador"), cancerType: params.get("tipo"),
    mode: params.get("modo") === "hoje" ? "status" : params.get("modo") }, catalog);
}

export function writeMapState(state: MapState, params = new URLSearchParams()): URLSearchParams {
  const result = new URLSearchParams(params);
  for (const key of ["indicador", "tipo", "modo"]) result.delete(key);
  if (state.indicator !== DEFAULT_INDICATOR) result.set("indicador", state.indicator);
  if (state.cancerType !== DEFAULT_CANCER_TYPE) result.set("tipo", state.cancerType);
  if (state.mode !== "trend") result.set("modo", "hoje");
  return result;
}
