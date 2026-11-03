import { municipalityPath } from "../profile/profile";
import {
  CANCER_TYPES,
  INDICATORS,
  statusText,
  NO_STATUS_NOTE,
  QUALITY_WARNING,
  immediateRegionName,
  originText,
  qualityPeriodText,
  qualityText,
  ufQuality,
  TREND_LABELS,
  formatPercent,
  formatIndicatorValue,
  measuredCasesText,
  trendState,
  type IndicatorLayer,
  type MunicipalityListing,
} from "./indicator-layer";

/**
 * Set up the table that mirrors the map: one row per municipality, ordered by UF
 * and name (never by value: the map is not a ranking). A UF filter keeps the
 * 5,570 rows navigable by keyboard. Returns how to fill it with a layer, called
 * again whenever the map switches layers.
 */
export function mountIndicatorTable(
  root: HTMLElement,
  listing: MunicipalityListing,
): (layer: IndicatorLayer) => void {
  const body = root.querySelector("tbody")!;
  const filter = root.querySelector<HTMLSelectElement>("select")!;
  const count = root.querySelector<HTMLElement>(".table-count")!;

  const collator = new Intl.Collator("pt-BR");
  const rows = [...listing.municipalities].sort(
    (a, b) => collator.compare(a.uf, b.uf) || collator.compare(a.name, b.name),
  );
  for (const uf of [...new Set(rows.map((m) => m.uf))]) {
    filter.add(new Option(uf, uf));
  }

  let current: IndicatorLayer | undefined;
  const render = () => {
    const layer = current;
    if (!layer) return;
    const shown = rows.filter((m) => !filter.value || m.uf === filter.value);
    body.replaceChildren(
      ...shown.map((m) => {
        const entry = layer.municipalities[m.code];
        const row = document.createElement("tr");
        const cells = [
          m.name,
          m.uf,
          TREND_LABELS[trendState(entry)],
          statusText(entry, layer),
          entry?.status_note ?? "—",
          formatIndicatorValue(layer.indicator, entry?.value ?? null),
          formatPercent(entry?.without_treatment_info ?? null),
          originText(entry, immediateRegionName(m, listing)),
          qualityText(ufQuality(layer, m.code)),
        ];
        cells.forEach((text, i) => {
          const cell = document.createElement(i === 0 ? "th" : "td");
          cell.hidden = layer.indicator === 'mammography' && (i === 6 || i === 8);
          if (i === 0) cell.scope = "row";
          if (i === 0) {
            const link = document.createElement("a");
            link.href = municipalityPath(m) + window.location.search;
            link.textContent = text;
            cell.append(link);
          } else cell.textContent = text;
          row.append(cell);
        });
        return row;
      }),
    );
    count.textContent = `${shown.length.toLocaleString("pt-BR")} municípios`;
  };
  filter.addEventListener("change", render);

  return (layer) => {
    current = layer;
    root.querySelector('.indicator-name')!.textContent = INDICATORS[layer.indicator]!.name;
    for (const header of root.querySelectorAll<HTMLElement>('[data-treatment-column]')) header.hidden = layer.indicator === 'mammography';
    root.querySelector('.value-heading')!.textContent = layer.indicator === 'mammography' ? 'Razão de mamografias (50–69 anos)' : 'Em até 60 dias';
    root.querySelector('.treatment-note')!.textContent = layer.indicator === 'within_60_days' ? 'A % sem informação de tratamento é sobre todos os casos diagnosticados.' : '';
    root.querySelector(".cancer-type")!.textContent = CANCER_TYPES[layer.cancer_type] ?? layer.cancer_type;
    root.querySelector(".latest-year")!.textContent = String(layer.period.latest);
    const measuredCases = measuredCasesText(layer.period);
    root.querySelector(".measured-cases")!.textContent = measuredCases ? ` (${measuredCases})` : "";
    const qualityPeriod = qualityPeriodText(layer.period);
    root.querySelector(".quality-note")!.textContent = qualityPeriod
      ? `A qualidade do registro é a faixa da UF, pela % de casos de ${qualityPeriod} sem informação ` +
        `de tratamento. Na faixa C: ${QUALITY_WARNING}`
      : "";
    root.querySelector(".status-note")!.textContent = layer.has_status ? "" : NO_STATUS_NOTE;
    render();
  };
}
