import {
  ORIGIN_TEXT,
  TREND_LABELS,
  formatPercent,
  trendState,
  type IndicatorLayer,
  type MunicipalityListing,
} from "./indicator-layer";

/**
 * Fill the table that mirrors the map: one row per municipality, ordered by UF
 * and name (never by value: the map is not a ranking). A UF filter keeps the
 * 5,570 rows navigable by keyboard.
 */
export function fillIndicatorTable(
  root: HTMLElement,
  layer: IndicatorLayer,
  listing: MunicipalityListing,
): void {
  const body = root.querySelector("tbody")!;
  const filter = root.querySelector<HTMLSelectElement>("select")!;
  const count = root.querySelector<HTMLElement>(".table-count")!;

  root.querySelector(".latest-year")!.textContent = String(layer.period.latest);
  const collator = new Intl.Collator("pt-BR");
  const rows = [...listing.municipalities].sort(
    (a, b) => collator.compare(a.uf, b.uf) || collator.compare(a.name, b.name),
  );

  for (const uf of [...new Set(rows.map((m) => m.uf))]) {
    filter.add(new Option(uf, uf));
  }

  const render = () => {
    const shown = rows.filter((m) => !filter.value || m.uf === filter.value);
    body.replaceChildren(
      ...shown.map((m) => {
        const entry = layer.municipalities[m.code];
        const row = document.createElement("tr");
        const cells = [
          m.name,
          m.uf,
          TREND_LABELS[trendState(entry)],
          formatPercent(entry?.value ?? null),
          formatPercent(entry?.without_treatment_info ?? null),
          entry ? ORIGIN_TEXT[entry.origin] : ORIGIN_TEXT.insufficient,
        ];
        cells.forEach((text, i) => {
          const cell = document.createElement(i === 0 ? "th" : "td");
          if (i === 0) cell.scope = "row";
          cell.textContent = text;
          row.append(cell);
        });
        return row;
      }),
    );
    count.textContent = `${shown.length.toLocaleString("pt-BR")} municípios`;
  };
  filter.addEventListener("change", render);
  render();
}
