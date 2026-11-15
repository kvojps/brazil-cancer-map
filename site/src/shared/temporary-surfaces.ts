/** Coordinate temporary controls without changing the municipal or exploration state. */
export function mountTemporarySurfaces(): void {
  const header = document.querySelector<HTMLElement>('.site-header');
  const searchToggle = document.querySelector<HTMLAnchorElement>('.search-toggle');
  const input = document.querySelector<HTMLInputElement>('#municipality-search');
  if (!header || !searchToggle || !input) return;
  const search = document.querySelector<HTMLElement>('.municipality-search')!;
  const filters = document.querySelector<HTMLElement>('#map-filters');
  const legend = document.querySelector<HTMLElement>('#legend-full');
  const menu = document.querySelector<HTMLDetailsElement>('.site-menu');
  const floating = matchMedia('(max-width: 767px) and (min-width: 300px) and (min-height: 520px)');
  let switching = false;
  let legendOpener: HTMLElement | undefined;
  const focus = (element: HTMLElement | undefined | null) => {
    if (element?.checkVisibility()) element.focus({ preventScroll: true });
  };
  const closeSearch = (returnFocus = true) => {
    const hadFocus = search.contains(document.activeElement);
    delete header.dataset.searchOpen;
    searchToggle.setAttribute('aria-expanded', 'false');
    if (returnFocus && hadFocus) focus(searchToggle);
  };
  const hide = (surface: HTMLElement | null) => {
    if (surface?.matches(':popover-open')) surface.hidePopover();
  };
  const replace = (next: HTMLElement) => {
    switching = true;
    if (next !== search) closeSearch(false);
    for (const surface of [filters, legend]) if (surface !== next) hide(surface);
    if (menu?.open) menu.open = false;
    switching = false;
  };
  searchToggle.setAttribute('aria-controls', 'municipality-search-surface');
  searchToggle.setAttribute('aria-expanded', 'false');
  search.id = 'municipality-search-surface';
  searchToggle.addEventListener('click', event => {
    event.preventDefault();
    replace(search);
    header.dataset.searchOpen = '';
    searchToggle.setAttribute('aria-expanded', 'true');
    input.focus({ preventScroll: true });
  });
  document.querySelector('.search-close')?.addEventListener('click', () => closeSearch());
  // Capture activation while the invoker is still visible, including keyboard activation.
  document.addEventListener('click', event => {
    const opener = event.target instanceof Element ? event.target.closest<HTMLElement>('[popovertarget="legend-full"]') : null;
    if (opener && opener.getAttribute('popovertargetaction') !== 'hide') legendOpener = opener;
  }, true);
  for (const surface of [filters, legend]) surface?.addEventListener('beforetoggle', event => {
    const opening = (event as ToggleEvent).newState === 'open';
    if (opening) {
      if (floating.matches) replace(surface);
      // Focus the first control after the popover has become visible.
      queueMicrotask(() => focus(surface.querySelector<HTMLElement>('select, button')));
    } else if (!switching && surface.contains(document.activeElement)) {
      queueMicrotask(() => focus(surface === filters ? document.querySelector<HTMLElement>('.filters-toggle') : legendOpener));
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if ('searchOpen' in header.dataset) {
      closeSearch(false);
      focus(searchToggle);
    }
    for (const surface of [filters, legend]) {
      if (!surface?.matches(':popover-open')) continue;
      event.preventDefault();
      hide(surface);
      focus(surface === filters ? document.querySelector<HTMLElement>('.filters-toggle') : legendOpener);
    }
  });
  // Selecting a result also works through Enter in the search field.
  document.querySelector('#municipality-results')?.addEventListener('click', event => {
    if (event.target instanceof Element && event.target.closest('button')) closeSearch(false);
  }, true);
  window.addEventListener('municipality-map-select', () => closeSearch());
  menu?.addEventListener('toggle', () => {
    if (!menu.open) return;
    switching = true;
    closeSearch(false);
    hide(filters);
    hide(legend);
    switching = false;
  });
  const adapt = () => {
    closeSearch(); hide(filters); hide(legend);
    if (document.activeElement === searchToggle && input.checkVisibility()) input.focus({ preventScroll: true });
  };
  floating.addEventListener('change', adapt);
  window.addEventListener('mobile-layout-change', adapt);
}
