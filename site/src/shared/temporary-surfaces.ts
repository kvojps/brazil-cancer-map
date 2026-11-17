/** Coordinate temporary controls without changing the municipal or exploration state. */
export function mountTemporarySurfaces(): void {
  const header = document.querySelector<HTMLElement>('.site-header');
  const searchToggle = document.querySelector<HTMLAnchorElement>('.search-toggle');
  const input = document.querySelector<HTMLInputElement>('#municipality-search');
  if (!header || !searchToggle || !input) return;
  const search = document.querySelector<HTMLElement>('.municipality-search')!;
  const filters = document.querySelector<HTMLElement>('#map-filters');
  const legend = document.querySelector<HTMLElement>('#legend-full');
  const notice = document.querySelector<HTMLElement>('#construction-reading');
  const noticeOpener = document.querySelector<HTMLElement>('[popovertarget="construction-reading"]');
  const surfaces = [filters, legend, notice];
  const menu = document.querySelector<HTMLDetailsElement>('.site-menu');
  const detailsMenu = document.querySelector<HTMLElement>('#details-menu');
  const detailsToggle = document.querySelector<HTMLElement>('[data-details-menu]');
  let searchOpener: HTMLElement = searchToggle;
  let filtersOpener: HTMLElement | null = document.querySelector('.filters-toggle');
  const floating = matchMedia('(max-width: 767px)');
  let switching = false;
  let legendOpener: HTMLElement | undefined;
  const focus = (element: HTMLElement | undefined | null) => {
    const target = element?.checkVisibility({ visibilityProperty: true }) ? element : detailsToggle;
    if (target?.checkVisibility({ visibilityProperty: true })) target.focus({ preventScroll: true });
  };
  const openerFor = (surface: HTMLElement) => surface === notice ? (noticeOpener?.checkVisibility({ visibilityProperty: true }) ? noticeOpener : document.querySelector<HTMLElement>('.notice-message')) : surface === filters ? filtersOpener : surface === detailsMenu ? detailsToggle : legendOpener;
  const closeSearch = (returnFocus = true) => {
    const wasOpen = 'searchOpen' in header.dataset;
    delete header.dataset.searchOpen;
    searchToggle.setAttribute('aria-expanded', 'false');
    if (returnFocus && wasOpen) focus(searchOpener);
  };
  const hide = (surface: HTMLElement | null) => {
    if (surface?.matches(':popover-open')) surface.hidePopover();
  };
  const replaceSurface = (next?: HTMLElement) => {
    switching = true;
    if (next !== search) closeSearch(false);
    for (const surface of [...surfaces, detailsMenu]) if (surface !== next) hide(surface);
    if (menu?.open) menu.open = false;
    switching = false;
  };
  window.addEventListener('map-reset', () => replaceSurface());
  searchToggle.setAttribute('aria-controls', 'municipality-search-surface');
  searchToggle.setAttribute('aria-expanded', 'false');
  search.id = 'municipality-search-surface';
  searchToggle.addEventListener('click', event => {
    event.preventDefault();
    searchOpener = searchToggle;
    replaceSurface(search);
    header.dataset.searchOpen = '';
    searchToggle.setAttribute('aria-expanded', 'true');
    input.focus({ preventScroll: true });
  });
  document.querySelector('.search-close')?.addEventListener('click', () => closeSearch());
  // Capture activation while the invoker is still visible, including keyboard activation.
  document.addEventListener('click', event => {
    const opener = event.target instanceof Element ? event.target.closest<HTMLElement>('[popovertarget="legend-full"]') : null;
    if (opener && opener.getAttribute('popovertargetaction') !== 'hide') legendOpener = opener;
    const filterButton = event.target instanceof Element ? event.target.closest<HTMLElement>('[popovertarget="map-filters"]') : null;
    if (filterButton && filterButton.getAttribute('popovertargetaction') !== 'hide') filtersOpener = filterButton;
  }, true);
  for (const surface of [...surfaces, detailsMenu]) surface?.addEventListener('beforetoggle', event => {
    const opening = (event as ToggleEvent).newState === 'open';
    if (opening) {
      if (floating.matches || surface === detailsMenu) replaceSurface(surface);
      // The toggle event below runs after native popover focus handling.
    } else if (!switching && (floating.matches || surface === detailsMenu || surface.contains(document.activeElement))) {
      queueMicrotask(() => focus(openerFor(surface)));
    }
  });
  for (const surface of [...surfaces, detailsMenu]) surface?.addEventListener('toggle', event => {
    if ((event as ToggleEvent).newState === 'open' && surface.matches(':popover-open')) focus(surface.querySelector<HTMLElement>('select, button'));
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if ('searchOpen' in header.dataset) {
      closeSearch(false);
      focus(searchOpener);
    }
    for (const surface of [...surfaces, detailsMenu]) {
      if (!surface?.matches(':popover-open')) continue;
      event.preventDefault();
      hide(surface);
      focus(openerFor(surface));
    }
  });
  detailsMenu?.addEventListener('click', event => {
    const command = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-details-command]')?.dataset.detailsCommand : undefined;
    if (!command) return;
    if (command === 'search') {
      searchOpener = detailsToggle!;
      replaceSurface(search);
      header.dataset.searchOpen = '';
      searchToggle.setAttribute('aria-expanded', 'true');
      input.focus({ preventScroll: true });
      queueMicrotask(() => input.focus({ preventScroll: true }));
    } else {
      const surface = command === 'filters' ? filters : legend;
      if (command === 'filters') filtersOpener = detailsToggle!;
      else legendOpener = detailsToggle!;
      if (surface) { replaceSurface(surface); surface.showPopover(); }
    }
  });
  // Selecting a result also works through Enter in the search field.
  document.querySelector('#municipality-results')?.addEventListener('click', event => {
    if (event.target instanceof Element && event.target.closest('button')) closeSearch(false);
  }, true);
  window.addEventListener('municipality-map-select', () => closeSearch());
  menu?.addEventListener('toggle', () => {
    if (!menu.open) return;
    focus(menu.querySelector<HTMLElement>('nav a'));
    switching = true;
    closeSearch(false);
    hide(filters);
    hide(legend);
    hide(notice);
    hide(detailsMenu);
    switching = false;
  });
  const adapt = () => {
    closeSearch(); hide(filters); hide(legend); hide(detailsMenu);
    if (document.activeElement === searchToggle && input.checkVisibility({ visibilityProperty: true })) input.focus({ preventScroll: true });
  };
  floating.addEventListener('change', adapt);
}
