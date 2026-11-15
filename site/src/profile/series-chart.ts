export function mountSeriesCharts(): void {
  // Reproject horizontal coordinates while keeping labels and vertical spacing at reading size.
  const originals = new WeakMap<SVGElement, Map<string, number>>();
  const observer = new ResizeObserver(entries => {
    for (const entry of entries) {
      const svg = entry.target.querySelector<SVGSVGElement>('svg')!;
      const width = Math.max(240, Math.min(650, entry.contentRect.width));
      svg.setAttribute('viewBox', `0 0 ${width} 200`);
      for (const node of svg.querySelectorAll<SVGElement>('line, circle, text')) {
        let coordinates = originals.get(node);
        if (!coordinates) {
          coordinates = new Map(['x', 'x1', 'x2', 'cx'].filter(key => node.hasAttribute(key)).map(key => [key, Number(node.getAttribute(key))]));
          originals.set(node, coordinates);
        }
        for (const [key, value] of coordinates) node.setAttribute(key, String(value === 0 ? 0 : 64 + (value - 42) * (width - 96) / 500));
        if (node.tagName === 'text' && node.hasAttribute('data-series-end')) {
          node.setAttribute('x', String(width - 32));
          node.setAttribute('text-anchor', 'end');
        }
        // The dose-change annotation has a longer label than the endpoint years.
        if (node.tagName === 'text' && node.hasAttribute('data-series-annotation')) {
          node.setAttribute('x', String(width - 8));
          node.setAttribute('text-anchor', 'end');
        }
      }
      svg.style.minWidth = '240px';
    }
  });
  document.querySelectorAll<HTMLElement>('.series-chart').forEach(chart => observer.observe(chart));
  // Municipal cards are inserted from their static documents during dashboard navigation.
  new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.removedNodes) if (node instanceof Element) {
        node.querySelectorAll<HTMLElement>('.series-chart').forEach(chart => observer.unobserve(chart));
      }
      for (const node of record.addedNodes) if (node instanceof Element) {
        node.querySelectorAll<HTMLElement>('.series-chart').forEach(chart => observer.observe(chart));
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

}
