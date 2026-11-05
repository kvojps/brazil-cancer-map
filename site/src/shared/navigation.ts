import { readMapState, writeMapState } from '../map/map-state.ts';

export function readTheme(params: URLSearchParams): 'light' | 'dark' | null {
  const value = params.get('theme');
  return value === 'light' || value === 'dark' ? value : null;
}

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
  if (current.searchParams.get('visualizacao') === 'lista' && (result.pathname === '/' || result.pathname.startsWith('/municipio/'))) result.searchParams.set('visualizacao', 'lista');
  for (const key of ['indicador', 'tipo', 'modo']) result.searchParams.delete(key);
  // Municipal pages carry the map context for their return link, but filter only by type.
  if (result.pathname === '/' || result.pathname.startsWith('/municipio/')) {
    result.search = writeMapState({ ...state, cancerType }, result.searchParams).toString();
  } else {
    if (cancerType !== 'all') result.searchParams.set('tipo', cancerType);
  }
  result.searchParams.delete('municipio');
  const indexDestination = result.hash === '#municipality-index-heading' || result.hash.startsWith('#municipalities-');
  if (result.pathname === '/' && !indexDestination) {
    const code = current.pathname.match(/^\/municipio\/(\d+)-/)?.[1] ?? current.searchParams.get('municipio');
    if (code) result.searchParams.set('municipio', code);
  }
  if (theme) result.searchParams.set('theme', theme);
  return result;
}

function isPage(path: string): boolean {
  return path === '/' || path === '/metodologia/' || path.startsWith('/municipio/');
}

export function mountSharedNavigation(): void {
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const destinations = new WeakMap<HTMLAnchorElement, string>();
  const destination = (link: HTMLAnchorElement) => {
    if (!destinations.has(link)) destinations.set(link, link.getAttribute('href')!);
    return new URL(destinations.get(link)!, location.href);
  };
  const updateLink = (link: HTMLAnchorElement, current: URL) => {
    if (link.dataset.themeChoice) {
      if (link.hasAttribute('data-theme-toggle')) {
        const active = readTheme(current.searchParams) ?? (systemTheme.matches ? 'dark' : 'light');
        const next = active === 'dark' ? 'light' : 'dark';
        link.dataset.themeChoice = next;
        link.setAttribute('aria-label', next === 'light' ? 'Usar tema claro' : 'Usar tema escuro');
        const icon = link.querySelector('span')!;
        const symbol = next === 'light' ? '☀' : '☾';
        if (icon.textContent !== symbol) icon.textContent = symbol;
      }
      const target = new URL(current);
      target.searchParams.set('theme', link.dataset.themeChoice);
      link.href = target.href;

    } else link.href = navigationUrl(destination(link), current).href;
  };
  const sync = () => {
    const current = new URL(location.href);
    if (current.pathname === '/metodologia/') {
      const canonical = navigationUrl(current, current);
      if (canonical.href !== current.href) {
        history.replaceState(null, '', canonical);
        current.href = canonical.href;
      }
    }
    const theme = readTheme(current.searchParams);
    if (theme) document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
    if (!theme && current.searchParams.has('theme')) {
      current.searchParams.delete('theme');
      history.replaceState(null, '', current);
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
  window.addEventListener('popstate', sync);
  window.addEventListener('navigation-state-change', sync);
  new MutationObserver(sync).observe(document.body, { childList: true, subtree: true });
}
