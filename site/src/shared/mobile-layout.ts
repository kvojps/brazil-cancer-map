/** Keep overlays only while their natural reading height leaves a useful map area. */
export function mountMobileLayout(): void {
  const root = document.documentElement;
  const phone = matchMedia('(max-width: 767px)');
  const panel = document.querySelector<HTMLElement>('#municipality-preview')!;
  let scheduled = false;
  let reserved = 0;
  let controlsHeight = 0;
  let floorHeight = 0;
  const heightOf = (selector: string) => document.querySelector(selector)?.getBoundingClientRect().height ?? 0;
  const update = () => {
    scheduled = false;
    const height = window.visualViewport?.height ?? innerHeight;
    const floating = !root.hasAttribute('data-mobile-flow');
    // Keep natural overlay measurements while in flow, where controls and details occupy different boxes.
    // Expanded details must not themselves trigger a layout switch.
    if (floating && (panel.hidden || panel.hasAttribute('data-collapsed'))) {
      reserved = panel.hidden ? 0 : panel.getBoundingClientRect().height;
      controlsHeight = heightOf('.map-controls');
      floorHeight = Math.max(heightOf('.legend-corner'), heightOf('.view-controls'), heightOf('.panel-legend'));
    }
    if (panel.hidden) reserved = 0;
    const notice = heightOf('.construction-notice');
    const header = heightOf('.site-header');
    const crowded = height - notice - header - controlsHeight - reserved - floorHeight - 32 < 160;
    const flow = phone.matches && (innerWidth < 300 || height < 520 || crowded);
    if (flow === root.hasAttribute('data-mobile-flow')) return;
    root.toggleAttribute('data-mobile-flow', flow);
    window.dispatchEvent(new Event('mobile-layout-change'));
  };
  const schedule = () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  };
  const resize = new ResizeObserver(schedule);
  for (const selector of ['#municipality-preview', '.construction-notice', '.map-controls', '.legend-corner']) {
    const element = document.querySelector(selector);
    if (element) resize.observe(element);
  }
  new MutationObserver(schedule).observe(panel, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'data-collapsed'] });
  addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  update();
}
