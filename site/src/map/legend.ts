import {
  INDICATORS, formatIndicatorValue, measuredCasesText, trendDescriptions,
  trendPeriodText, type IndicatorLayer, type MapMode, type TrendState,
} from './indicator-layer';

/** How the corner summary reads the color in each reading of the map. */
export const CORNER_CAVEAT: Record<MapMode, string> = {
  trend: 'A cor mostra a mudança, não um ranking.',
  status: 'A cor mostra a distância até a referência, não um ranking.',
};

function legendTitle(layer: IndicatorLayer, mode: MapMode): string {
  return mode === 'trend' ? `Tendência ${trendPeriodText(layer.period)}`.trim() : `Situação em ${layer.period.latest}`;
}

/** The always-visible summary of the full legend: period, classes and the reading of the color. */
export function updateLegendCorner(corner: HTMLElement, layer: IndicatorLayer, mode: MapMode): void {
  for (const list of corner.querySelectorAll<HTMLElement>('[data-corner-mode]')) list.hidden = list.dataset.cornerMode !== mode;
  corner.querySelector('.legend-corner-title')!.textContent = legendTitle(layer, mode);
  corner.querySelector('.legend-corner-caveat')!.textContent = CORNER_CAVEAT[mode];
  for (const item of corner.querySelectorAll<HTMLElement>('[data-corner-quality]')) item.hidden = !layer.period.quality_years;
}

/** Keep periods, units and meaning in sync when the indicator changes. */
export function updateLegend(root: HTMLElement, layer: IndicatorLayer, mode: MapMode): void {
  root.querySelector<HTMLElement>('.trend-legend')!.hidden = mode !== 'trend';
  root.querySelector<HTMLElement>('.status-legend')!.hidden = mode !== 'status';
  root.setAttribute('aria-label', mode === 'trend' ? 'Legenda da Tendência' : 'Legenda da Situação');
  root.querySelector('.trend-legend h2')!.textContent = legendTitle(layer, 'trend');
  root.querySelector('.status-legend h2')!.textContent = legendTitle(layer, 'status');
  const reference = layer.reference;
  root.querySelector('.legend-reference')!.textContent = reference
    ? `Referência: ${formatIndicatorValue(layer.indicator, reference.value)} — ${reference.label}.` : '';
  const measured = measuredCasesText(layer.period);
  for (const element of root.querySelectorAll('.legend-measured-cases')) element.textContent = measured ? `${measured}.` : '';
  const descriptions = trendDescriptions(INDICATORS[layer.indicator]!);
  for (const element of root.querySelectorAll<HTMLElement>('[data-trend-description]')) {
    element.textContent = descriptions[element.dataset.trendDescription as TrendState];
  }
  const quality = root.querySelector<HTMLElement>('.quality');
  if (quality) quality.hidden = !layer.period.quality_years;
  const provisional = layer.period.provisional;
  root.querySelector('.note')!.textContent = `Período dos dados: ${layer.period.first_year}–${layer.period.last_year}. ` +
    (provisional.length ? `${provisional.join(' e ')} ainda são provisórios e não entram na Tendência.` : 'Todos os anos estão consolidados.');
}
