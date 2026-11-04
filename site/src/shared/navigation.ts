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
  result.searchParams.delete('theme');
  for (const key of ['indicador', 'tipo', 'modo']) result.searchParams.delete(key);
  if (result.pathname === '/') {
    result.search = writeMapState({ ...state, ...(ownType ? { cancerType: readMapState(new URLSearchParams({ tipo: ownType })).cancerType } : {}) }, result.searchParams).toString();
  } else {
    const type = ownType ? readMapState(new URLSearchParams({ tipo: ownType })).cancerType : state.cancerType;
    if (type !== 'all') result.searchParams.set('tipo', type);
  }
  if (theme) result.searchParams.set('theme', theme);
  return result;
}

function isPage(path: string): boolean {
  return path === '/' || path === '/metodologia/' || path.startsWith('/municipio/');
}

export function mountSharedNavigation(): void {
  const destinations = new WeakMap<HTMLAnchorElement, string>();
  const destination = (link: HTMLAnchorElement) => {
    if (!destinations.has(link)) destinations.set(link, link.getAttribute('href')!);
    return new URL(destinations.get(link)!, location.href);
  };
  const sync = () => {
    const current = new URL(location.href);
    if (current.pathname !== '/') {
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
    for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href]')) {
      if (link.dataset.themeChoice) {
        const target = new URL(current);
        target.searchParams.set('theme', link.dataset.themeChoice);
        link.href = target.href;
        link.setAttribute('aria-current', theme === link.dataset.themeChoice ? 'true' : 'false');
      } else link.href = navigationUrl(destination(link), current).href;
    }
  };
  sync();
  // Resolve at activation too: map selections and fetched profiles can change state or links.
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
    if (target && !target.dataset.themeChoice) target.href = navigationUrl(destination(target), new URL(location.href)).href;
    else if (target?.dataset.themeChoice) {
      const url = new URL(location.href);
      url.searchParams.set('theme', target.dataset.themeChoice);
      target.href = url.href;
    }
  }, true);
  window.addEventListener('popstate', sync);
  window.addEventListener('navigation-state-change', sync);
  new MutationObserver(sync).observe(document.body, { childList: true, subtree: true });
}
