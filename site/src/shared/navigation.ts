import { homeMapContainer, onHomeAddressChange } from '../map/address.ts';
import { readMapState, writeMapState } from '../map/map-state.ts';
import { readTheme } from './theme-url.ts';

/** Carry only the state relevant to the destination, keeping section anchors intact. */
export function navigationUrl(destination: URL, current: URL): URL {
  const result = new URL(destination);
  if (result.origin !== current.origin || !isPage(result.pathname)) return result;
  const state = readMapState(current.searchParams);
  const ownType = result.searchParams.get('tipo');
  const theme = readTheme(result.searchParams) ?? readTheme(current.searchParams);
  const cancerType = ownType ? readMapState(new URLSearchParams({ tipo: ownType })).cancerType : state.cancerType;
  result.searchParams.delete('theme');
  result.searchParams.delete('visualizacao');
  if (current.searchParams.get('visualizacao') === 'lista') result.searchParams.set('visualizacao', 'lista');
  for (const key of ['indicador', 'tipo', 'modo']) result.searchParams.delete(key);
  result.search = writeMapState({ ...state, cancerType }, result.searchParams).toString();
  result.searchParams.delete('municipio');
  const indexDestination = result.hash === '#municipality-index-heading' || result.hash.startsWith('#municipalities-');
  if (['/', '/metodologia/', '/municipios/'].includes(result.pathname) && !indexDestination) {
    const code = current.pathname.match(/^\/municipio\/(\d+)-/)?.[1] ?? current.searchParams.get('municipio');
    if (code) result.searchParams.set('municipio', code);
  }
  if (theme) result.searchParams.set('theme', theme);
  return result;
}

function isPage(path: string): boolean {
  return path === '/municipios/' || path === '/' || path === '/metodologia/' || path.startsWith('/municipio/');
}

/** The native disclosure opens without JavaScript; with it, Escape and an outside click also close it. */
function mountSiteMenu(): void {
  const menu = document.querySelector<HTMLDetailsElement>('.site-menu');
  if (!menu) return;
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !menu.open) return;
    menu.open = false;
    menu.querySelector('summary')!.focus();
  });
  document.addEventListener('click', event => {
    if (menu.open && !(event.target instanceof Node && menu.contains(event.target))) menu.open = false;
  });
}

export function mountSharedNavigation(): void {
  mountSiteMenu();
  const isHomeMap = homeMapContainer() !== null;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const destinations = new WeakMap<HTMLAnchorElement, string>();
  const fixedMunicipalDestinations = new WeakSet<HTMLAnchorElement>();
  const contexts = new WeakMap<HTMLAnchorElement, string>();
  const destination = (link: HTMLAnchorElement) => {
    if (!destinations.has(link)) {
      const href = link.getAttribute('href')!;
      destinations.set(link, href);
      // Absolute municipal destinations inherit filters, but never the selected municipality.
      if ((href.startsWith('/') || URL.canParse(href)) && new URL(href, location.href).pathname.startsWith('/municipio/')) fixedMunicipalDestinations.add(link);
    }
    return new URL(destinations.get(link)!, location.href);
  };
  const updateLink = (link: HTMLAnchorElement, current: URL) => {
    // Remember the original destination before testing which context affects it.
    if (!destinations.has(link)) destination(link);
    const context = `${systemTheme.matches}:${fixedMunicipalDestinations.has(link) && !link.dataset.themeChoice ? current.search : current.href}`;
    if (contexts.get(link) === context) return;
    contexts.set(link, context);
    if (link.dataset.themeChoice) {
      if (link.hasAttribute('data-theme-toggle')) {
        const active = readTheme(current.searchParams) ?? (systemTheme.matches ? 'dark' : 'light');
        const next = active === 'dark' ? 'light' : 'dark';
        link.dataset.themeChoice = next;
        const label = next === 'light' ? 'Usar tema claro' : 'Usar tema escuro';
        link.setAttribute('aria-label', label);
        const visibleLabel = link.querySelector('[data-theme-label]');
        if (visibleLabel && visibleLabel.textContent !== label) visibleLabel.textContent = label;
        const icon = link.querySelector('span')!;
        const symbol = next === 'light' ? '☀' : '☾';
        if (icon.textContent !== symbol) icon.textContent = symbol;
      }
      const target = new URL(current);
      target.searchParams.set('theme', link.dataset.themeChoice);
      link.href = target.href;

    } else if (link.matches('.identity')) {
      const target = new URL('/', current);
      const theme = readTheme(current.searchParams);
      if (theme) target.searchParams.set('theme', theme);
      link.href = target.href;
    } else link.href = navigationUrl(destination(link), current).href;
  };
  const sync = () => {
    const current = new URL(location.href);
    if (!isHomeMap && current.pathname === '/metodologia/') {
      const canonical = navigationUrl(current, current);
      if (canonical.href !== current.href) {
        history.replaceState(history.state, '', canonical);
        current.href = canonical.href;
      }
    }
    const theme = readTheme(current.searchParams);
    if (theme) {
      if (document.documentElement.dataset.theme !== theme) document.documentElement.dataset.theme = theme;
    } else if (document.documentElement.hasAttribute('data-theme')) delete document.documentElement.dataset.theme;
    if (!isHomeMap && !theme && current.searchParams.has('theme')) {
      current.searchParams.delete('theme');
      history.replaceState(history.state, '', current);
    }
    for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href]')) updateLink(link, current);
  };
  sync();
  systemTheme.addEventListener('change', sync);
  // Resolve at activation too: map selections and fetched profiles can change state or links.
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
    if (target) updateLink(target, new URL(location.href));
  }, true);
  // On the home map the Address owns the history: its change signal follows every write and navigation.
  if (isHomeMap) onHomeAddressChange(sync);
  else window.addEventListener('popstate', sync);
  // A result or profile arriving changes only its new links, not every municipal link in the list.
  new MutationObserver(records => {
    const current = new URL(location.href);
    for (const record of records) for (const node of record.addedNodes) {
      if (!(node instanceof Element) || !node.isConnected) continue;
      if (node.matches('a[href]')) updateLink(node as HTMLAnchorElement, current);
      for (const link of node.querySelectorAll<HTMLAnchorElement>('a[href]')) updateLink(link, current);
    }
  }).observe(document.body, { childList: true, subtree: true });
}
