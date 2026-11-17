/** Track the visual viewport without measuring the consultation as page content. */
export function mountMobileLayout(): void {
  const root = document.documentElement;
  let scheduled = false;
  const update = () => {
    scheduled = false;
    const height = window.visualViewport?.height ?? innerHeight;
    root.style.setProperty('--dashboard-height', `${height}px`);
    root.style.setProperty('--dashboard-top', `${window.visualViewport?.offsetTop ?? 0}px`);
    const notice = document.querySelector<HTMLElement>('.construction-notice');
    // Match the normal exploration allowance, scaled with the user's text size.
    const list = document.querySelector<HTMLElement>('.indicator-table');
    const listBars = list && !list.hidden
      ? [...list.querySelectorAll<HTMLElement>('.list-bar, .list-notes')].reduce((height, element) => height + element.scrollHeight, 0) : 0;
    const needed = (notice?.scrollHeight ?? 0) + listBars + 16 * parseFloat(getComputedStyle(root).fontSize);
    root.toggleAttribute('data-mobile-tight', height < needed || innerWidth < 300);
  };
  const schedule = () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  };
  addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('scroll', schedule);
  const metrics = new ResizeObserver(schedule);
  for (const element of document.querySelectorAll('.construction-notice, .list-bar, .list-notes')) metrics.observe(element);
  update();
}
