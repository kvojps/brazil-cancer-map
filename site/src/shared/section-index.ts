/** The index of a reading page: marks the current section and, where it is one line, opens over the text. */
export function mountSectionIndex(): void {
  const nav = document.querySelector<HTMLElement>('.methodology-index')!;
  const toggle = nav.querySelector<HTMLButtonElement>('.index-toggle')!;
  const label = nav.querySelector<HTMLElement>('[data-index-current]')!;
  const links = [...nav.querySelectorAll<HTMLAnchorElement>('ol a')];
  const sections = [...document.querySelectorAll<HTMLElement>('.methodology-reading > section')];
  const root = document.documentElement;
  const notice = document.querySelector<HTMLElement>('.construction-notice')!;

  // The line sits right under the notice, whose height depends on how its text wraps.
  const measure = () => root.style.setProperty('--notice-height', `${notice.getBoundingClientRect().height}px`);
  new ResizeObserver(measure).observe(notice);
  measure();

  const setOpen = (open: boolean) => {
    nav.toggleAttribute('data-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  const isOpen = () => nav.hasAttribute('data-open');
  toggle.addEventListener('click', () => setOpen(!isOpen()));
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !isOpen()) return;
    setOpen(false);
    toggle.focus();
  });
  document.addEventListener('click', event => {
    if (isOpen() && !(event.target instanceof Node && nav.contains(event.target))) setOpen(false);
  });
  nav.addEventListener('focusout', event => {
    if (event.relatedTarget instanceof Node && !nav.contains(event.relatedTarget)) setOpen(false);
  });

  // A focusable anchor takes the focus when the browser moves to it: the link that was chosen may be gone, and Tab goes on from the section.
  for (const section of sections) section.tabIndex = -1;

  let current = -1;
  const mark = (index: number) => {
    if (index === current) return;
    current = index;
    links.forEach((link, position) => {
      if (position === index) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    label.textContent = `${String(index + 1).padStart(2, '0')} ${links[index]!.textContent}`;
  };
  // A short section under another can never reach the top: the one chosen stays marked until the page moves.
  let chosenAt: number | undefined;
  const sync = () => {
    if (chosenAt !== undefined && Math.abs(scrollY - chosenAt) < 2) return;
    chosenAt = undefined;
    if (innerHeight + scrollY >= root.scrollHeight - 2) return mark(sections.length - 1);
    // Past where an anchor lands, which can be lower if the page scrolled before the notice was measured.
    const line = parseFloat(getComputedStyle(root).scrollPaddingTop) + parseFloat(getComputedStyle(sections[0]!).scrollMarginTop) + 48;
    const passed = sections.filter(section => section.getBoundingClientRect().top <= line).length;
    mark(Math.max(passed - 1, 0));
  };
  const syncFromHash = () => {
    const chosen = sections.findIndex(section => `#${section.id}` === location.hash);
    if (chosen < 0) return sync();
    mark(chosen);
    chosenAt = scrollY;
  };
  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(sync);
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('hashchange', syncFromHash);
  syncFromHash();

  for (const link of links) {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      setOpen(false);
    });
  }
}
