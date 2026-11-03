import {
  AttributionControl,
  MapLibreMap,
  NavigationControl,
  Popup,
  setWorkerUrl,
  type ExpressionSpecification,
  type FilterSpecification,
  type LngLatBoundsLike,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import {
  CANCER_TYPES,
  HATCH,
  INDICATORS,
  INSUFFICIENT_DOTS,
  TREND_COLORS,
  TREND_LABELS,
  QUALITY_WARNING,
  formatPercent,
  immediateRegionName,
  isHatched,
  originText,
  qualityPeriodText,
  qualityText,
  measuredCasesText,
  trendPeriodText,
  trendState,
  ufQuality,
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
const DOTS_LAYER = "municipality-insufficient";
const BORDER_LAYER = "municipality-border";
const DOTS_IMAGE = "insufficient-dots";
const HATCH_LAYER = "municipality-quality-c";
const HATCH_IMAGE = "quality-c-hatch";

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
    id: BORDER_LAYER,
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

/**
 * Prepare the Tendência paint and the tooltip, and return how to show a layer:
 * each call repaints every municipality through `feature-state` and moves the
 * dots and the hatching to the layer's municipalities, so switching the cancer
 * type never rebuilds the map.
 */
export function mountTrendPaint(
  map: MapLibreMap,
  listing: MunicipalityListing,
): (layer: IndicatorLayer) => void {
  addInsufficientDots(map);
  addQualityHatch(map);

  let current: IndicatorLayer | undefined;
  const places = new Map(listing.municipalities.map((m) => [m.code, m]));
  const popup = new Popup({ closeButton: false, closeOnClick: false, maxWidth: "20rem" });
  map.on("mousemove", FILL_LAYER, (event) => {
    const code = event.features?.[0]?.id;
    if (code === undefined || !current) return;
    popup
      .setLngLat(event.lngLat)
      .setDOMContent(tooltip(current, String(code), places, listing))
      .addTo(map);
  });
  map.on("mouseleave", FILL_LAYER, () => popup.remove());

  return (layer) => {
    const insufficient: string[] = [];
    const hatched: string[] = [];
    for (const [code, entry] of Object.entries(layer.municipalities)) {
      const state = trendState(entry);
      map.setFeatureState({ source: SOURCE_ID, id: code }, { trend: state });
      if (state === "insufficient") insufficient.push(code);
      if (isHatched(entry)) hatched.push(code);
    }
    map.setFilter(DOTS_LAYER, codeFilter(insufficient));
    map.setFilter(HATCH_LAYER, codeFilter(hatched));
    current = layer;
    popup.remove();
  };
}

/** Only the listed municipalities: pattern layers cannot read feature-state. */
function codeFilter(codes: string[]): FilterSpecification {
  return ["in", ["get", "CD_MUN"], ["literal", codes]];
}

function tooltip(
  layer: IndicatorLayer,
  code: string,
  places: Map<string, MunicipalityListing["municipalities"][number]>,
  listing: MunicipalityListing,
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
  const measuredCases = measuredCasesText(layer.period);
  if (measuredCases) lines.push(["span", measuredCases]);
  if (entry?.value != null) {
    lines.push([
      "span",
      `Em ${layer.period.latest}: ${formatPercent(entry.value)} em até 60 dias; ` +
        `${formatPercent(entry.without_treatment_info)} de todos os casos diagnosticados ` +
        `sem informação de tratamento`,
    ]);
  }
  lines.push(["span", originText(entry, immediateRegionName(place, listing))]);
  const qualityPeriod = qualityPeriodText(layer.period);
  const quality = ufQuality(layer, code);
  if (qualityPeriod && quality?.band) {
    lines.push([
      "span",
      `Qualidade do registro ${place ? `em ${place.uf} ` : ""}(${qualityPeriod}): ${qualityText(quality)}`,
    ]);
  }
  if (isHatched(entry)) lines.push(["em", QUALITY_WARNING]);

  const box = document.createElement("div");
  box.className = "map-tooltip";
  for (const [tag, text] of lines) {
    const line = document.createElement(tag);
    line.textContent = text;
    box.append(line);
  }
  return box;
}

/**
 * Cover the "dado insuficiente" municipalities with near-white dots (spec,
 * section 11.1). `fill-pattern` cannot read feature-state, so a second layer
 * draws the pattern, filtered to the codes of the layer shown.
 */
function addInsufficientDots(map: MapLibreMap): void {
  const size = INSUFFICIENT_DOTS.spacing;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d")!;
  context.fillStyle = TREND_COLORS.insufficient;
  context.fillRect(0, 0, size, size);
  context.fillStyle = INSUFFICIENT_DOTS.color;
  context.beginPath();
  context.arc(size / 2, size / 2, INSUFFICIENT_DOTS.radius, 0, 2 * Math.PI);
  context.fill();
  map.addImage(DOTS_IMAGE, context.getImageData(0, 0, size, size));
  map.addLayer(
    {
      id: DOTS_LAYER,
      type: "fill",
      source: SOURCE_ID,
      filter: codeFilter([]),
      paint: { "fill-pattern": DOTS_IMAGE },
    },
    BORDER_LAYER,
  );
}

/**
 * Hatch the municipalities of the UFs in band C (spec, section 11.1), like the
 * dots: a pattern layer filtered to the codes of the layer shown. The tile is transparent between
 * the lines, so the Tendência color shows through, and its three segments join
 * across tiles into continuous diagonals.
 */
function addQualityHatch(map: MapLibreMap): void {
  const size = HATCH.spacing;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d")!;
  context.strokeStyle = HATCH.color;
  context.lineWidth = HATCH.width;
  context.beginPath();
  for (const offset of [-size, 0, size]) {
    context.moveTo(offset, size);
    context.lineTo(offset + size, 0);
  }
  context.stroke();
  map.addImage(HATCH_IMAGE, context.getImageData(0, 0, size, size));
  map.addLayer(
    {
      id: HATCH_LAYER,
      type: "fill",
      source: SOURCE_ID,
      filter: codeFilter([]),
      paint: { "fill-pattern": HATCH_IMAGE },
    },
    BORDER_LAYER,
  );
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
