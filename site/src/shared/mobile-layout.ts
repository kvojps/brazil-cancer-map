/** Keep overlays only while their natural reading height leaves a useful map area. */
export function mountMobileLayout(): void {
  const root = document.documentElement;
  const phone = matchMedia('(max-width: 767px)');
  let scheduled = false;
  let reserved = 0;
  const update = () => {
    scheduled = false;
    const viewport = window.visualViewport;
    const height = viewport?.height ?? innerHeight;
    const panel = document.querySelector<HTMLElement>('#municipality-preview');
    const floating = !root.hasAttribute('data-mobile-flow');
    // Remember the collapsed overlay's natural height; expanded details must not trigger a layout switch.
    if (floating && panel?.hasAttribute('data-collapsed')) reserved = panel.hidden ? 0 : panel.getBoundingClientRect().height;
    if (panel?.hidden) reserved = 0;
    const notice = document.querySelector('.construction-notice')?.getBoundingClientRect().height ?? 0;
    const header = document.querySelector('.site-header')?.getBoundingClientRect().height ?? 0;
    const crowded = reserved > 0 && height - notice - header - reserved - 120 < 160;
    const flow = phone.matches && (innerWidth < 300 || height < 520 || crowded);
    if (flow === root.hasAttribute('data-mobile-flow')) return;
    root.toggleAttribute('data-mobile-flow', flow);
    window.dispatchEvent(new Event('mobile-layout-change'));
  };
  const schedule = () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  };
  const resize = new ResizeObserver(schedule);
  for (const selector of ['#municipality-preview', '.construction-notice']) {
    const element = document.querySelector(selector);
    if (element) resize.observe(element);
  }
  new MutationObserver(schedule).observe(document.querySelector('#municipality-preview')!, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'data-collapsed'] });
  addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  update();
}
