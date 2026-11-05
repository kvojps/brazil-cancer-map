import { hatchCss } from '../map/indicator-layer';
import type { AxisResultLine, PanelResult } from './panel-result';

function element(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

function swatch(background: string): HTMLElement {
  const mark = element('span', 'result-swatch');
  mark.setAttribute('aria-hidden', 'true');
  mark.style.background = background;
  return mark;
}

/** Fill the result block of the panel. */
export function renderResult(block: HTMLElement, result: PanelResult): void {
  block.dataset.kind = result.kind;
  const children: HTMLElement[] = [];
  if (result.kind === 'value') {
    const figure = element('p', 'result-figure');
    figure.append(element('span', 'result-value', result.value!), element('span', 'result-measure', result.measure!));
    const reading = element('p', 'result-class');
    reading.append(swatch(result.swatch), element('strong', '', result.classLabel));
    if (result.classContext) reading.append(element('span', 'result-context', result.classContext));
    children.push(figure, reading);
    if (result.explanation) children.push(element('p', 'result-note', result.explanation));
  } else {
    const headline = element('p', 'result-headline');
    headline.append(swatch(result.swatch), document.createTextNode(result.classLabel));
    children.push(headline);
    if (result.explanation) children.push(element('p', 'result-note', result.explanation));
  }
  if (result.withoutInformation) children.push(element('p', 'result-note', result.withoutInformation));
  if (result.origin) children.push(element('p', 'result-note', result.origin));
  if (result.warning) {
    const warning = element('p', 'result-warning');
    warning.append(swatch(hatchCss('transparent')), element('span', '', result.warning));
    children.push(warning);
  }
  if (result.caveat) {
    children.push(element('p', 'result-caveat result-caveat-short', result.caveat.short));
    children.push(element('p', 'result-caveat result-caveat-full', result.caveat.full));
  }
  block.replaceChildren(...children);
}

/** Write the results into the title of an Eixo, visible while it is closed. */
export function renderAxisResults(axis: HTMLDetailsElement, lines: AxisResultLine[]): void {
  const summary = axis.querySelector<HTMLElement>(':scope > summary')!;
  summary.querySelector('.axis-results')?.remove();
  if (!lines.length) return;
  const box = element('span', 'axis-results');
  for (const line of lines) {
    const row = element('span', 'axis-result');
    row.toggleAttribute('data-current', line.current);
    row.append(element('span', 'axis-result-label', line.label), line.swatch ? swatch(line.swatch) : element('span', 'result-swatch-gap'), element('span', 'axis-result-value', line.text));
    box.append(row);
  }
  summary.append(box);
}

/** What a screen reader hears when the result arrives. */
export function resultAnnouncement(name: string, result: PanelResult): string {
  const parts = result.kind === 'value'
    ? [`${result.value} ${result.measure}`, result.classLabel, result.classContext, result.explanation, result.origin, result.warning]
    : [result.classLabel, result.explanation];
  return `${name}: ${parts.filter(Boolean).join('. ')}`;
}
