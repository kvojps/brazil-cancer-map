import {
  INDICATORS, formatIndicatorValue, measuredCasesText, trendDescriptions,
  trendPeriodText, type IndicatorLayer, type MapMode, type TrendState,
} from './indicator-layer';

/** Keep periods, units and meaning in sync when the indicator changes. */
export function updateLegend(root: HTMLElement, layer: IndicatorLayer, mode: MapMode): void {
  root.querySelector<HTMLElement>('.trend-legend')!.hidden = mode !== 'trend';
  root.querySelector<HTMLElement>('.status-legend')!.hidden = mode !== 'status';
  root.setAttribute('aria-label', mode === 'trend' ? 'Legenda da Tendência' : 'Legenda da Situação');
  root.querySelector('.trend-legend h2')!.textContent = `Tendência ${trendPeriodText(layer.period)}`;
  root.querySelector('.status-legend h2')!.textContent = `Situação em ${layer.period.latest}`;
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
