import {
  LngLatBounds,
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
  STATUS_COLORS,
  statusText,
  type MapMode,
  HATCH,
  INDICATORS,
  INSUFFICIENT_DOTS,
  TREND_COLORS,
  trendText,
  QUALITY_WARNING,
  formatPercent,
  formatIndicatorValue,
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
import { framingPaddings, type Padding } from "./framing";

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

const meshes = new WeakMap<MapLibreMap, GeoJSON.FeatureCollection>();

export const SOURCE_ID = "municipalities";
const FILL_LAYER = "municipality-fill";
const DOTS_LAYER = "municipality-insufficient";
const BORDER_LAYER = "municipality-border";
const DOTS_IMAGE = "insufficient-dots";
const HATCH_LAYER = "municipality-quality-c";
const HATCH_IMAGE = "quality-c-hatch";

/** The value of a `var(--token)` of the theme now in force; WebGL and canvas cannot read tokens. */
function themeColor(value: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(value.slice(4, -1)).trim();
}

/** Fill by the `trend` feature-state; anything else (no class) is "dado insuficiente". */
const trendFill = (): ExpressionSpecification => [
  "match",
  ["coalesce", ["feature-state", "trend"], "insufficient"],
  "improving",
  themeColor(TREND_COLORS.improving),
  "worsening",
  themeColor(TREND_COLORS.worsening),
  "stable",
  themeColor(TREND_COLORS.stable),
  "no_clear_direction",
  themeColor(TREND_COLORS.no_clear_direction),
  themeColor(TREND_COLORS.insufficient),
];

const statusFill = (): ExpressionSpecification => [
  "match", ["coalesce", ["feature-state", "status"], "insufficient"],
  "reached", themeColor(STATUS_COLORS.reached), "near", themeColor(STATUS_COLORS.near),
  "far", themeColor(STATUS_COLORS.far), themeColor(STATUS_COLORS.insufficient),
];

/** Run `handler` whenever the theme in force changes: by the URL or by the system preference. */
function onThemeChange(map: MapLibreMap, handler: () => void): void {
  const observer = new MutationObserver(handler);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const preference = matchMedia('(prefers-color-scheme: dark)');
  preference.addEventListener('change', handler);
  map.on('remove', () => { observer.disconnect(); preference.removeEventListener('change', handler); });
}

// MapLibre looks for its worker next to its own module, which the bundler
// does not emit; point it at the copy Vite publishes.
setWorkerUrl(workerUrl);

const BRAZIL_BOUNDS: LngLatBoundsLike = [
  [-74.1, -33.8],
  [-28.8, 5.3],
];
/** A phone stops at Fernando de Noronha, not at Trindade, for the country to be larger. */
const PHONE_BRAZIL_BOUNDS: [[number, number], [number, number]] = [
  [-74.1, -33.8],
  [-32.2, 5.3],
];
const FOCUS_MARGIN = 24;
const PHONE_COUNTRY_MARGIN = 8;
const isPhone = () => matchMedia("(max-width: 767px)").matches;

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
        { id: "background", type: "background", paint: { "background-color": themeColor("var(--mesh)") } },
      ],
    },
    bounds: isPhone() ? PHONE_BRAZIL_BOUNDS : BRAZIL_BOUNDS,
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

  const mesh = feature(topology, topology.objects.municipalities);
  meshes.set(map, mesh);
  map.addSource(SOURCE_ID, {
    type: "geojson",
    data: mesh,
    promoteId: "CD_MUN",
  });
  map.addLayer({
    id: FILL_LAYER,
    type: "fill",
    source: SOURCE_ID,
    paint: { "fill-color": trendFill() },
  });
  map.addLayer({
    id: BORDER_LAYER,
    type: "line",
    source: SOURCE_ID,
    paint: {
      "line-color": themeColor("var(--mesh-border)"),
      "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.2, 8, 1],
    },
  });

  map.addLayer({
    id: "municipality-hover",
    type: "line",
    source: SOURCE_ID,
    paint: {
      "line-color": themeColor("var(--selection)"),
      "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2, 0],
    },
  });

  map.addLayer({ id: "municipality-selected", type: "line", source: SOURCE_ID,
    filter: codeFilter([]), paint: { "line-color": themeColor("var(--selection)"), "line-width": 3 } });
  const syncTheme = () => {
    map.setPaintProperty('background', 'background-color', themeColor('var(--mesh)'));
    map.setPaintProperty(BORDER_LAYER, 'line-color', themeColor('var(--mesh-border)'));
    for (const layer of ['municipality-hover', 'municipality-selected']) {
      map.setPaintProperty(layer, 'line-color', themeColor('var(--selection)'));
    }
  };
  onThemeChange(map, syncTheme);
  highlightOnHover(map);
  return map;
}

/**
 * Prepare the Tendência paint and the tooltip, and return how to show a layer:
 * each call repaints every municipality through `feature-state` and moves the
 * dots and the hatching to the layer's municipalities, so switching the cancer
 * type never rebuilds the map.
 */
export function mountIndicatorPaint(
  map: MapLibreMap,
  listing: MunicipalityListing,
): (layer: IndicatorLayer | undefined, mode?: MapMode) => void {
  addInsufficientDots(map);
  addQualityHatch(map);

  let current: IndicatorLayer | undefined;
  let currentMode: MapMode = "trend";
  const places = new Map(listing.municipalities.map((m) => [m.code, m]));
  const popup = new Popup({ closeButton: false, closeOnClick: false, maxWidth: "20rem" });
  map.on("mousemove", FILL_LAYER, (event) => {
    const code = event.features?.[0]?.id;
    if (code === undefined || !current) return;
    popup
      .setLngLat(event.lngLat)
      .setDOMContent(tooltip(current, String(code), places, listing, currentMode))
      .addTo(map);
  });
  map.on("mouseleave", FILL_LAYER, () => popup.remove());

  // Without a layer the mesh stays neutral: no tone may suggest a class.
  const paintFill = () => map.setPaintProperty(FILL_LAYER, "fill-color",
    current ? (currentMode === "status" ? statusFill() : trendFill()) : themeColor("var(--soft)"));
  onThemeChange(map, () => {
    paintFill();
    map.updateImage(DOTS_IMAGE, insufficientDotsImage());
    map.updateImage(HATCH_IMAGE, qualityHatchImage());
  });

  return (layer, mode = "trend") => {
    currentMode = mode;
    current = layer;
    paintFill();
    if (!layer) {
      for (const item of meshes.get(map)?.features ?? []) {
        map.removeFeatureState({ source: SOURCE_ID, id: String(item.properties?.CD_MUN) });
      }
    }
    const insufficient: string[] = [];
    const hatched: string[] = [];
    for (const [code, entry] of Object.entries(layer?.municipalities ?? {})) {
      const state = mode === "status" ? entry.status ?? "insufficient" : trendState(entry);
      map.setFeatureState({ source: SOURCE_ID, id: code }, { trend: trendState(entry), status: entry.status ?? "insufficient" });
      if (state === "insufficient") insufficient.push(code);
      if (isHatched(entry, mode)) hatched.push(code);
    }
    map.setFilter(DOTS_LAYER, codeFilter(insufficient));
    map.setFilter(HATCH_LAYER, codeFilter(hatched));
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
  mode: MapMode,
): HTMLElement {
  const entry = layer.municipalities[code];
  const place = places.get(code);
  const indicator = INDICATORS[layer.indicator]?.name ?? layer.indicator;
  const lines: [string, string][] = [
    ["strong", place ? `${place.name} (${place.uf})` : code],
    ["span", `${indicator} · ${CANCER_TYPES[layer.cancer_type] ?? layer.cancer_type}`],
    ["span", `Tendência${layer.period.trend.length ? ` ${trendPeriodText(layer.period)}` : ''}: ${trendText(layer.indicator, entry)}`],
  ];
  if (mode === "status") {
    lines.push(["strong", `Situação em ${layer.period.latest}: ${statusText(entry, layer)}`]);
    if (layer.reference) lines.push(["span", `Referência: ${formatIndicatorValue(layer.indicator, layer.reference.value)} — ${layer.reference.label}`]);
  }
  if (entry?.status_note) lines.push(["em", entry.status_note]);
  const measuredCases = measuredCasesText(layer.period);
  if (measuredCases) lines.push(["span", measuredCases]);
  if (entry?.value != null) {
    lines.push([
      "span",
      `Em ${layer.period.latest}: ${formatIndicatorValue(layer.indicator, entry.value)} — ${INDICATORS[layer.indicator]!.valueLabel}`,
    ]);
    if (INDICATORS[layer.indicator]!.hasTreatmentQuality) lines.push(['span',
      `${formatPercent(entry.without_treatment_info)} de todos os casos diagnosticados sem informação de tratamento`]);
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
  if (isHatched(entry, mode)) lines.push(["em", QUALITY_WARNING]);

  const box = document.createElement("div");
  box.className = "map-tooltip";
  for (const [tag, text] of lines) {
    const line = document.createElement(tag);
    line.textContent = text;
    box.append(line);
  }
  return box;
}

/** One tile of the "dado insuficiente" pattern, in the colors of the theme in force. */
function insufficientDotsImage(): ImageData {
  const size = INSUFFICIENT_DOTS.spacing;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d")!;
  context.fillStyle = themeColor(TREND_COLORS.insufficient);
  context.fillRect(0, 0, size, size);
  context.fillStyle = themeColor(INSUFFICIENT_DOTS.color);
  context.beginPath();
  context.arc(size / 2, size / 2, INSUFFICIENT_DOTS.radius, 0, 2 * Math.PI);
  context.fill();
  return context.getImageData(0, 0, size, size);
}

/**
 * Cover the "dado insuficiente" municipalities with dots (spec, section 11.1).
 * `fill-pattern` cannot read feature-state, so a second layer draws the pattern,
 * filtered to the codes of the layer shown.
 */
function addInsufficientDots(map: MapLibreMap): void {
  map.addImage(DOTS_IMAGE, insufficientDotsImage());
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
 * One tile of the band C hatching. It is transparent between the lines, so the
 * trend color shows through, and its three segments join across tiles into
 * continuous diagonals.
 */
function qualityHatchImage(): ImageData {
  const size = HATCH.spacing;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d")!;
  context.strokeStyle = themeColor(HATCH.color);
  context.lineWidth = HATCH.width;
  context.beginPath();
  for (const offset of [-size, 0, size]) {
    context.moveTo(offset, size);
    context.lineTo(offset + size, 0);
  }
  context.stroke();
  return context.getImageData(0, 0, size, size);
}

/**
 * Hatch the municipalities of the UFs in band C (spec, section 11.1), like the
 * dots: a pattern layer filtered to the codes of the layer shown.
 */
function addQualityHatch(map: MapLibreMap): void {
  map.addImage(HATCH_IMAGE, qualityHatchImage());
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


/** What covers part of the map and so should stay off the framed state. */
export interface MapOverlays { legend: HTMLElement | null; note: HTMLElement | null; controls: HTMLElement | null }

/** Fit `bounds` clear of the overlays, on the side that costs the least zoom. */
function fitClearOfOverlays(map: MapLibreMap, bounds: LngLatBounds, { legend, note, controls }: MapOverlays, margin = FOCUS_MARGIN): void {
  const paddings = framingPaddings(map.getContainer().getBoundingClientRect(), { legend: legend?.getBoundingClientRect(), note: note?.getBoundingClientRect(), controls: controls?.getBoundingClientRect() }, margin);
  let padding: Padding | number = margin; // A map too small to spare their area still shows the state, under them.
  let zoom = -Infinity;
  for (const candidate of paddings) {
    const camera = map.cameraForBounds(bounds, { padding: candidate });
    if (camera?.zoom !== undefined && camera.zoom > zoom) { padding = candidate; zoom = camera.zoom; }
  }
  map.fitBounds(bounds, { padding, duration: 0 });
}

/** On a phone, frame the country clear of what floats over the map. Larger screens keep the constructor's fit. */
export function frameCountry(map: MapLibreMap, overlays: MapOverlays): void {
  if (isPhone()) fitClearOfOverlays(map, LngLatBounds.convert(PHONE_BRAZIL_BOUNDS), overlays, PHONE_COUNTRY_MARGIN);
}

/** Fit the complete state, using the same mesh that paints the map. */
export function focusMunicipality(map: MapLibreMap, code: string, overlays: MapOverlays): void {
  const bounds = new LngLatBounds();
  for (const item of meshes.get(map)?.features ?? []) {
    if (!String(item.properties?.CD_MUN).startsWith(code.slice(0, 2))) continue;
    const visit = (coordinates: unknown): void => {
      if (!Array.isArray(coordinates)) return;
      if (typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
        bounds.extend([coordinates[0], coordinates[1]]);
      } else coordinates.forEach(visit);
    };
    if ('coordinates' in item.geometry) visit(item.geometry.coordinates);
  }
  map.resize();
  if (!bounds.isEmpty() && map.getContainer().clientWidth) fitClearOfOverlays(map, bounds, overlays);
  map.setFilter('municipality-selected', codeFilter([code]));
}

export function clearMunicipality(map: MapLibreMap): void {
  map.setFilter('municipality-selected', codeFilter([]));
  map.resize();
}

export function onMunicipalityClick(map: MapLibreMap, select: (code: string) => void): void {
  map.on('click', FILL_LAYER, event => {
    const code = event.features?.[0]?.id;
    if (code !== undefined) select(String(code));
  });
}
