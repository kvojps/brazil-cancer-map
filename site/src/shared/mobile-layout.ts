/** Track the visual viewport without measuring the consultation as page content. */
export function mountMobileLayout(): void {
  const root = document.documentElement;
  const notice = document.querySelector<HTMLElement>('.construction-notice')!;
  const message = notice.querySelector<HTMLElement>('.notice-message')!;
  const opener = notice.querySelector<HTMLButtonElement>('[popovertarget]')!;
  const reading = document.querySelector<HTMLElement>('#construction-reading')!;
  let scheduled = false;
  const update = () => {
    scheduled = false;
    const height = window.visualViewport?.height ?? innerHeight;
    root.style.setProperty('--dashboard-height', `${height}px`);
    root.style.setProperty('--dashboard-top', `${window.visualViewport?.offsetTop ?? 0}px`);
    // Measure the full message even while its compact replacement is showing.
    const fullHeight = message.getBoundingClientRect().height;
    // Match the normal exploration allowance, scaled with the user's text size.
    const list = document.querySelector<HTMLElement>('.indicator-table');
    const listBars = list && !list.hidden
      ? [...list.querySelectorAll<HTMLElement>('.list-bar, .list-notes')].reduce((height, element) => height + element.scrollHeight, 0) : 0;
    const needed = fullHeight + listBars + 16 * parseFloat(getComputedStyle(root).fontSize);
    const compact = innerWidth < 768 && height < needed;
    const restoreNoticeFocus = !compact && document.activeElement === opener;
    const focusCompactNotice = compact && document.activeElement === message;
    root.toggleAttribute('data-notice-compact', compact);
    if (focusCompactNotice) opener.focus({ preventScroll: true });
    if (restoreNoticeFocus) {
      const target = reading.matches(':popover-open') ? reading.querySelector<HTMLElement>('button')! : message;
      target.focus({ preventScroll: true });
    }
    root.toggleAttribute('data-mobile-tight', height < needed || innerWidth < 300);
  };
  const schedule = () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  };
  addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('scroll', schedule);
  const metrics = new ResizeObserver(schedule);
  for (const element of document.querySelectorAll('.construction-notice, .notice-message, .list-bar, .list-notes')) metrics.observe(element);
  update();
}
