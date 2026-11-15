/** Keep overlays only while their natural reading height leaves a useful map area. */
export function mountMobileLayout(): void {
  const root = document.documentElement;
  const phone = matchMedia('(max-width: 767px)');
  const panel = document.querySelector<HTMLElement>('#municipality-preview')!;
  let scheduled = false;
  const heightOf = (selector: string) => document.querySelector(selector)?.getBoundingClientRect().height ?? 0;
  const observation = { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'data-collapsed'] };
  const crowded = (height: number) => {
    const inFlow = root.hasAttribute('data-mobile-flow');
    const collapsed = panel.hasAttribute('data-collapsed');
    const pagePosition = { left: scrollX, top: scrollY };
    const panelPosition = panel.scrollTop;
    // Measure the candidate composition, not the taller header and expanded details in flow.
    // Restore synchronously before painting or notifying the rest of the interface.
    mutations.disconnect();
    root.removeAttribute('data-mobile-flow');
    panel.setAttribute('data-collapsed', '');
    try {
      const reserved = panel.hidden ? 0 : panel.getBoundingClientRect().height;
      const floor = Math.max(heightOf('.legend-corner'), heightOf('.view-controls'), heightOf('.panel-legend'));
      return height - heightOf('.construction-notice') - heightOf('.site-header') - heightOf('.map-controls') - reserved - floor - 32 < 160;
    } finally {
      panel.toggleAttribute('data-collapsed', collapsed);
      root.toggleAttribute('data-mobile-flow', inFlow);
      // The layout read can clamp scrolling when the consultation temporarily leaves the flow.
      panel.scrollTop = panelPosition;
      window.scrollTo({ ...pagePosition, behavior: 'instant' });
      mutations.observe(panel, observation);
    }
  };
  const update = () => {
    scheduled = false;
    const height = window.visualViewport?.height ?? innerHeight;
    const flow = phone.matches && (innerWidth < 300 || height < 520 || crowded(height));
    if (flow === root.hasAttribute('data-mobile-flow')) return;
    root.toggleAttribute('data-mobile-flow', flow);
    window.dispatchEvent(new Event('mobile-layout-change'));
  };
  const schedule = () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  };
  const mutations = new MutationObserver(schedule);
  mutations.observe(panel, observation);
  const resize = new ResizeObserver(schedule);
  for (const selector of ['#municipality-preview', '.construction-notice', '.map-controls', '.legend-corner']) {
    const element = document.querySelector(selector);
    if (element) resize.observe(element);
  }
  addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  update();
}
