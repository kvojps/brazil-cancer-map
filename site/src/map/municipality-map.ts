import {
  AttributionControl,
  MapLibreMap,
  NavigationControl,
  Popup,
  setWorkerUrl,
  type ExpressionSpecification,
  type LngLatBoundsLike,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import {
  CANCER_TYPES,
  INDICATORS,
  ORIGIN_TEXT,
  TREND_COLORS,
  TREND_LABELS,
  formatPercent,
  trendPeriodText,
  trendState,
  type IndicatorLayer,
  type MunicipalityListing,
} from "./indicator-layer";

/** Properties each municipality carries in the TopoJSON exported by the pipeline. */
export interface MunicipalityProperties {
  /** 6-digit IBGE code, the id used by `feature-state`. */
  CD_MUN: string;
  /** Immediate region code. */
  CD_RGI: string;
}

type MeshTopology = Topology<{
  municipalities: GeometryCollection<MunicipalityProperties>;
}>;

export const SOURCE_ID = "municipalities";
const FILL_LAYER = "municipality-fill";

/** Fill by the `trend` feature-state; anything else (no class) is "dado insuficiente". */
const TREND_FILL: ExpressionSpecification = [
  "match",
  ["coalesce", ["feature-state", "trend"], "insufficient"],
  "improving",
  TREND_COLORS.improving,
  "worsening",
  TREND_COLORS.worsening,
  "stable",
  TREND_COLORS.stable,
  "no_clear_direction",
  TREND_COLORS.no_clear_direction,
  TREND_COLORS.insufficient,
];

// MapLibre looks for its worker next to its own module, which the bundler
// does not emit; point it at the copy Vite publishes.
setWorkerUrl(workerUrl);

const BRAZIL_BOUNDS: LngLatBoundsLike = [
  [-74.1, -33.8],
  [-28.8, 5.3],
];

/**
 * Mount the home map: the municipalities of the IBGE mesh, with no base map.
 * The source promotes `CD_MUN` to the feature id, so indicators can be painted
 * later with `map.setFeatureState({ source: SOURCE_ID, id: code }, state)`.
 */
export async function mountMunicipalityMap(
  container: HTMLElement,
  meshUrl: string,
): Promise<MapLibreMap> {
  const map = new MapLibreMap({
    container,
    style: {
      version: 8,
      sources: {},
      layers: [
        // Darker than the near-white of "dado insuficiente", so those municipalities stand out.
        { id: "background", type: "background", paint: { "background-color": "#e6e9ed" } },
      ],
    },
    bounds: BRAZIL_BOUNDS,
    fitBoundsOptions: { padding: 16 },
    attributionControl: false,
    dragRotate: false,
    pitchWithRotate: false,
  });
  map.touchZoomRotate.disableRotation();
  map.addControl(new NavigationControl({ showCompass: false }));
  map.addControl(
    new AttributionControl({ compact: true, customAttribution: "Malha: IBGE 2025" }),
  );

  const [topology] = await Promise.all([
    fetch(meshUrl).then((response) => {
      if (!response.ok) throw new Error(`mesh request failed (${response.status})`);
      return response.json() as Promise<MeshTopology>;
    }),
    map.once("load"),
  ]);

  map.addSource(SOURCE_ID, {
    type: "geojson",
    data: feature(topology, topology.objects.municipalities),
    promoteId: "CD_MUN",
  });
  map.addLayer({
    id: FILL_LAYER,
    type: "fill",
    source: SOURCE_ID,
    paint: { "fill-color": TREND_FILL },
  });
  map.addLayer({
    id: "municipality-border",
    type: "line",
    source: SOURCE_ID,
    paint: {
      "line-color": "#ffffff",
      "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.2, 8, 1],
    },
  });

  map.addLayer({
    id: "municipality-hover",
    type: "line",
    source: SOURCE_ID,
    paint: {
      "line-color": "#1f2933",
      "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2, 0],
    },
  });

  highlightOnHover(map);
  return map;
}

/** Paint each municipality with its Tendência class and describe it on hover. */
export function paintTrend(
  map: MapLibreMap,
  layer: IndicatorLayer,
  listing: MunicipalityListing,
): void {
  for (const [code, entry] of Object.entries(layer.municipalities)) {
    map.setFeatureState({ source: SOURCE_ID, id: code }, { trend: trendState(entry) });
  }

  const places = new Map(listing.municipalities.map((m) => [m.code, m]));
  const popup = new Popup({ closeButton: false, closeOnClick: false, maxWidth: "20rem" });
  map.on("mousemove", FILL_LAYER, (event) => {
    const code = event.features?.[0]?.id;
    if (code === undefined) return;
    popup
      .setLngLat(event.lngLat)
      .setDOMContent(tooltip(layer, String(code), places))
      .addTo(map);
  });
  map.on("mouseleave", FILL_LAYER, () => popup.remove());
}

function tooltip(
  layer: IndicatorLayer,
  code: string,
  places: Map<string, MunicipalityListing["municipalities"][number]>,
): HTMLElement {
  const entry = layer.municipalities[code];
  const place = places.get(code);
  const state = trendState(entry);
  const indicator = INDICATORS[layer.indicator]?.name ?? layer.indicator;
  const lines: [string, string][] = [
    ["strong", place ? `${place.name} (${place.uf})` : code],
    ["span", `${indicator} · ${CANCER_TYPES[layer.cancer_type] ?? layer.cancer_type}`],
    ["span", `Tendência ${trendPeriodText(layer.period)}: ${TREND_LABELS[state]}`],
  ];
  if (entry?.value != null) {
    lines.push([
      "span",
      `Em ${layer.period.latest}: ${formatPercent(entry.value)} em até 60 dias; ` +
        `${formatPercent(entry.without_treatment_info)} sem informação de tratamento`,
    ]);
  }
  lines.push(["span", entry ? ORIGIN_TEXT[entry.origin] : ORIGIN_TEXT.insufficient]);

  const box = document.createElement("div");
  box.className = "map-tooltip";
  for (const [tag, text] of lines) {
    const line = document.createElement(tag);
    line.textContent = text;
    box.append(line);
  }
  return box;
}

function highlightOnHover(map: MapLibreMap): void {
  let hovered: string | number | undefined;
  const setHover = (id: string | number | undefined, hover: boolean) => {
    if (id !== undefined) map.setFeatureState({ source: SOURCE_ID, id }, { hover });
  };
  map.on("mousemove", FILL_LAYER, (event) => {
    const id = event.features?.[0]?.id;
    if (id === hovered) return;
    setHover(hovered, false);
    hovered = id;
    setHover(hovered, true);
  });
  map.on("mouseleave", FILL_LAYER, () => {
    setHover(hovered, false);
    hovered = undefined;
  });
}
