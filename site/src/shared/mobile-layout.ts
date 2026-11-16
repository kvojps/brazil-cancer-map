/** Track the visual viewport without measuring the consultation as page content. */
export function mountMobileLayout(): void {
  const root = document.documentElement;
  const phone = matchMedia('(max-width: 767px)');
  let scheduled = false;
  const update = () => {
    scheduled = false;
    const height = window.visualViewport?.height ?? innerHeight;
    root.style.setProperty('--dashboard-height', `${height}px`);
    // Extreme compositions are handled separately from summary overflow.
    const flow = phone.matches && (innerWidth < 300 || height < 520);
    if (flow === root.hasAttribute('data-mobile-flow')) return;
    root.toggleAttribute('data-mobile-flow', flow);
    window.dispatchEvent(new Event('mobile-layout-change'));
  };
  const schedule = () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  };
  addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  update();
}
