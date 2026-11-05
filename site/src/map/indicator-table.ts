import { navigationUrl } from "../shared/navigation.ts";
import { municipalityPath } from "../profile/profile.ts";
import { classOf, readingMode, showsBandC } from "../profile/panel-result.ts";
import {
  CANCER_TYPES,
  INDICATORS,
  INSUFFICIENT_CSS,
  statusText,
  noStatusNote,
  QUALITY_WARNING,
  immediateRegionName,
  originText,
  qualityPeriodText,
  qualityText,
  ufQuality,
  trendText,
  formatPercent,
  formatIndicatorValue,
  measuredCasesText,
  trendPeriodText,
  type IndicatorLayer,
  type MapMode,
  type MunicipalityIndicator,
  type MunicipalityListing,
} from "./indicator-layer.ts";

/** The class a row shows closed: which column holds the map's reading, its swatch and its band C mark. */
export function listReading(
  layer: Pick<IndicatorLayer, "indicator" | "has_status">,
  entry: MunicipalityIndicator | undefined,
  mode: MapMode,
): { column: "trend" | "status"; swatch: string; bandC: boolean } {
  const reading = readingMode(layer.indicator, mode, layer);
  return {
    column: reading,
    swatch: entry ? classOf(layer.indicator, entry, reading).swatch : INSUFFICIENT_CSS,
    bandC: showsBandC(layer.indicator, entry, reading),
  };
}

/** The line kept in view above the rows: the period of the Tendência, or the Referência, and the year of the value. */
export function listLede(
  layer: Pick<IndicatorLayer, "indicator" | "has_status" | "period" | "reference">,
  mode: MapMode,
): string {
  const latest = layer.period.latest;
  const reading = readingMode(layer.indicator, mode, layer);
  if (reading === "trend" && layer.period.trend.length) return `Tendência de ${trendPeriodText(layer.period)} · valor de ${latest}`;
  if (reading === "status" && layer.reference) return `Referência: ${formatIndicatorValue(layer.indicator, layer.reference.value)} · valor de ${latest}`;
  return `Valor de ${latest}`;
}

const TREATMENT_COLUMNS = new Set(["missing", "quality"]);

/**
 * Set up the table that mirrors the map: one row per municipality, ordered by UF
 * and name (never by value: the map is not a ranking). A UF filter keeps the
 * 5,570 rows navigable by keyboard. Returns how to fill it with a layer, called
 * again whenever the map switches layers.
 *
 * Below 640 px of its own width the table is laid out as rows that open. CSS then
 * drops the table semantics, so roles and column indexes are explicit: a closed
 * row exposes only some of its cells, and each still answers to its column.
 */
export function mountIndicatorTable(
  root: HTMLElement,
  listing: MunicipalityListing,
): (layer: IndicatorLayer | undefined, mode: MapMode) => void {
  const body = root.querySelector("tbody")!;
  const filter = root.querySelector<HTMLSelectElement>("select")!;
  const count = root.querySelector<HTMLElement>(".table-count")!;
  const headers = [...root.querySelectorAll<HTMLElement>("thead th")];

  const collator = new Intl.Collator("pt-BR");
  const rows = [...listing.municipalities].sort(
    (a, b) => collator.compare(a.uf, b.uf) || collator.compare(a.name, b.name),
  );
  for (const uf of [...new Set(rows.map((m) => m.uf))]) {
    filter.add(new Option(uf, uf));
  }

  // By code, so a row stays open when the filters rebuild the rows.
  const open = new Set<string>();
  body.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("[data-row-toggle]") : null;
    if (!button) return;
    const row = button.closest("tr")!;
    const code = row.dataset.code!;
    const opening = !open.has(code);
    if (opening) open.add(code);
    else open.delete(code);
    row.toggleAttribute("data-open", opening);
    button.setAttribute("aria-expanded", String(opening));
  });

  let current: IndicatorLayer | undefined;
  let currentMode: MapMode = "trend";
  const render = () => {
    const layer = current;
    if (!layer) return;
    const labels = Object.fromEntries(headers.map((th) => [th.dataset.column!, th.textContent ?? ""]));
    const columnIndex = Object.fromEntries(headers.filter((th) => !th.hidden).map((th) => [th.dataset.column!, th.getAttribute("aria-colindex")!]));
    const shown = rows.filter((m) => !filter.value || m.uf === filter.value);
    body.replaceChildren(
      ...shown.map((m) => {
        const entry = layer.municipalities[m.code];
        const rowClass = listReading(layer, entry, currentMode);
        const note = [entry?.status_note, entry?.adjustment_note].filter(Boolean).join(" ");
        const row = document.createElement("tr");
        row.setAttribute("role", "row");
        row.dataset.code = m.code;
        row.toggleAttribute("data-open", open.has(m.code));
        const addCell = (column: string, ...content: (Node | string)[]) => {
          if (!columnIndex[column]) return;
          const isName = column === "name";
          const cell = document.createElement(isName ? "th" : "td");
          cell.setAttribute("role", isName ? "rowheader" : "cell");
          cell.setAttribute("aria-colindex", columnIndex[column]);
          cell.dataset.column = column;
          if (isName) cell.scope = "row";
          cell.append(...content);
          row.append(cell);
          return cell;
        };
        // Written out, not generated by CSS: the header row is out of sight in the narrow form.
        const labelled = (column: string, text: string): (Node | string)[] => {
          if (column === rowClass.column) return classContent(rowClass, text);
          const label = document.createElement("span");
          label.className = "cell-label";
          label.textContent = `${labels[column]}: `;
          return [label, text];
        };
        const link = document.createElement("a");
        link.href = navigationUrl(new URL(municipalityPath(m), location.href), new URL(location.href)).href;
        link.textContent = m.name;
        addCell("name", link);
        addCell("uf", ...labelled("uf", m.uf));
        const trend = addCell("trend", ...labelled("trend", entry?.adjustment_note && !entry.trend ? "Ajuste não calculável" : trendText(layer.indicator, entry)));
        const status = addCell("status", ...labelled("status", statusText(entry, layer)));
        (rowClass.column === "trend" ? trend : status)!.toggleAttribute("data-reading", true);
        addCell("note", ...labelled("note", note || "—"))!.toggleAttribute("data-empty", !note);
        addCell("value", ...valueContent(formatIndicatorValue(layer.indicator, entry?.value ?? null)));
        addCell("missing", ...labelled("missing", formatPercent(entry?.without_treatment_info ?? null)));
        addCell("origin", ...labelled("origin", originText(entry, immediateRegionName(m, listing))));
        addCell("quality", ...labelled("quality", qualityText(ufQuality(layer, m.code))));
        addCell("more", rowToggle(m.name, open.has(m.code)));
        return row;
      }),
    );
    count.textContent = `${shown.length.toLocaleString("pt-BR")} municípios`;
  };
  filter.addEventListener("change", render);

  return (layer, mode) => {
    current = layer;
    currentMode = mode;
    root.querySelector<HTMLElement>('.scroll')!.hidden = !layer;
    root.querySelector<HTMLElement>('.list-notes')!.hidden = !layer;
    filter.disabled = !layer;
    if (!layer) {
      body.replaceChildren();
      count.textContent = 'Sem resultados carregados para a seleção atual.';
      return;
    }
    root.querySelector('.table-lede')!.textContent = listLede(layer, mode);
    const trendPeriod = trendPeriodText(layer.period);
    root.querySelector('.trend-period')!.textContent = trendPeriod ? `Período da Tendência: ${trendPeriod}.` : '';
    root.querySelector('.reference-note')!.textContent = layer.has_status && layer.reference
      ? `Referência: ${formatIndicatorValue(layer.indicator, layer.reference.value)} — ${layer.reference.label}. ` : '';
    root.querySelector('.table-mode')!.textContent = mode === 'trend' ? 'Tendência' : 'Como está hoje';
    const presentation = INDICATORS[layer.indicator]!;
    root.querySelector('.indicator-name')!.textContent = presentation.name;
    for (const header of headers) header.hidden = !presentation.hasTreatmentQuality && TREATMENT_COLUMNS.has(header.dataset.column!);
    for (const [i, header] of headers.filter((th) => !th.hidden).entries()) header.setAttribute('aria-colindex', String(i + 1));
    root.querySelector('.value-heading')!.textContent = presentation.valueLabel;
    root.querySelector('.treatment-note')!.textContent = presentation.hasTreatmentQuality ? 'A % sem informação de tratamento é sobre todos os casos diagnosticados.' : '';
    root.querySelector(".cancer-type")!.textContent = CANCER_TYPES[layer.cancer_type] ?? layer.cancer_type;
    root.querySelector(".latest-year")!.textContent = String(layer.period.latest);
    const measuredCases = measuredCasesText(layer.period);
    root.querySelector(".measured-cases")!.textContent = measuredCases ? ` (${measuredCases})` : "";
    const qualityPeriod = qualityPeriodText(layer.period);
    root.querySelector(".quality-note")!.textContent = qualityPeriod
      ? `A qualidade do registro é a faixa da UF, pela % de casos de ${qualityPeriod} sem informação ` +
        `de tratamento. Na faixa C: ${QUALITY_WARNING} `
      : "";
    root.querySelector(".status-note")!.textContent = `${noStatusNote(layer)} `;
    render();
  };
}

/** The class of the map's reading: the swatch of the map, the text and the band C mark. */
function classContent(reading: ReturnType<typeof listReading>, text: string): (Node | string)[] {
  const swatch = document.createElement("span");
  swatch.className = "row-swatch";
  swatch.setAttribute("aria-hidden", "true");
  swatch.style.background = reading.swatch;
  if (!reading.bandC) return [swatch, text];
  const mark = document.createElement("span");
  mark.className = "row-mark";
  mark.textContent = "Faixa C";
  return [swatch, text, " ", mark];
}

/** The number apart from its unit, as in "78,32 por 100 mil": on a narrow row the unit goes under it, leaving room for the name. */
function valueContent(value: string): (Node | string)[] {
  const space = value.indexOf(" ");
  if (space < 0) return [value];
  const unit = document.createElement("span");
  unit.className = "value-unit";
  unit.textContent = value.slice(space);
  return [value.slice(0, space), unit];
}

function rowToggle(name: string, expanded: boolean): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.rowToggle = "";
  button.setAttribute("aria-expanded", String(expanded));
  button.setAttribute("aria-label", `Mais dados de ${name}`);
  const chevron = document.createElement("span");
  chevron.setAttribute("aria-hidden", "true");
  chevron.textContent = "⌄";
  button.append(chevron);
  return button;
}
