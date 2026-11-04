import { navigationUrl } from "../shared/navigation";
import { municipalityPath } from "../profile/profile";
import {
  CANCER_TYPES,
  INDICATORS,
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
): (layer: IndicatorLayer | undefined, mode: MapMode) => void {
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
          entry?.adjustment_note && !entry.trend ? "Ajuste não calculável" : trendText(layer.indicator, entry),
          statusText(entry, layer),
          [entry?.status_note, entry?.adjustment_note].filter(Boolean).join(" ") || "—",
          formatIndicatorValue(layer.indicator, entry?.value ?? null),
          formatPercent(entry?.without_treatment_info ?? null),
          originText(entry, immediateRegionName(m, listing)),
          qualityText(ufQuality(layer, m.code)),
        ];
        cells.forEach((text, i) => {
          const cell = document.createElement(i === 0 ? "th" : "td");
          cell.hidden = !INDICATORS[layer.indicator]!.hasTreatmentQuality && (i === 6 || i === 8);
          if (i === 0) cell.scope = "row";
          if (i === 0) {
            const link = document.createElement("a");
            link.href = navigationUrl(new URL(municipalityPath(m), location.href), new URL(location.href)).href;
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

  return (layer, mode) => {
    current = layer;
    root.querySelector<HTMLElement>('.scroll')!.hidden = !layer;
    root.querySelector<HTMLElement>('.table-description')!.hidden = !layer;
    filter.disabled = !layer;
    if (!layer) {
      body.replaceChildren();
      count.textContent = 'Sem resultados carregados para a seleção atual.';
      return;
    }
    root.querySelector('.trend-period')!.textContent = trendPeriodText(layer.period);
    root.querySelector('.reference-note')!.textContent = layer.has_status && layer.reference
      ? `Referência: ${formatIndicatorValue(layer.indicator, layer.reference.value)} — ${layer.reference.label}. ` : '';
    root.querySelector('.table-mode')!.textContent = mode === 'trend' ? 'Tendência' : 'Como está hoje';
    const presentation = INDICATORS[layer.indicator]!;
    root.querySelector('.indicator-name')!.textContent = presentation.name;
    for (const header of root.querySelectorAll<HTMLElement>('[data-treatment-column]')) header.hidden = !presentation.hasTreatmentQuality;
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
