import type { Address } from './address';

/** Where the visitor was reading in each visualization. */
export interface ViewContext { page: number; positions: [boolean, { page: number; table: number }][] }

/** Swap the text alternative and renderer without remounting either or losing selection; returns how to restore a reading context. */
export function mountVisualization(address: Address<{ view: ViewContext }>): (context: ViewContext | undefined) => void {
  const controls = document.querySelector<HTMLElement>('.view-controls')!;
  const map = document.querySelector<HTMLElement>('[data-map-view]')!;
  const list = document.querySelector<HTMLElement>('.indicator-table')!;
  const listScroll = list.querySelector<HTMLElement>('.scroll')!;
  let activeList: boolean | undefined;
  const positions = new Map<boolean, { page: number; table: number }>();
  let restoring = false;
  address.registerContext('view', () => ({ page: window.scrollY, positions: [...positions] }));
  const sync = () => {
    const url = new URL(location.href);
    const isList = url.searchParams.get('visualizacao') === 'lista';
    if (!isList && url.searchParams.has('visualizacao')) {
      url.searchParams.delete('visualizacao');
      address.replaceVisit(history.state, url);
    }
    const changed = activeList !== undefined && activeList !== isList;
    if (changed && !restoring) positions.set(activeList!, { page: window.scrollY, table: listScroll.scrollTop });
    activeList = isList;
    map.hidden = isList;
    list.hidden = !isList;
    for (const button of controls.querySelectorAll<HTMLButtonElement>('[data-view]')) {
      button.setAttribute('aria-pressed', String((button.dataset.view === 'lista') === isList));
    }
    window.dispatchEvent(new Event('resize'));
    if (changed && !restoring) requestAnimationFrame(() => {
      if (activeList !== isList) return;
      const position = positions.get(isList);
      window.scrollTo({ top: position?.page ?? 0, behavior: 'instant' });
      listScroll.scrollTop = position?.table ?? 0;
    });
    restoring = false;
  };
  const choose = (view: string) => {
    const url = new URL(location.href);
    if (view === 'lista') url.searchParams.set('visualizacao', 'lista');
    else url.searchParams.delete('visualizacao');
    if (url.href !== location.href) address.pushVisit(history.state, url);
    sync();
    window.dispatchEvent(new Event('navigation-state-change'));
  };
  controls.hidden = false;
  for (const button of controls.querySelectorAll<HTMLButtonElement>('[data-view]')) button.onclick = () => choose(button.dataset.view!);
  window.addEventListener('popstate', sync);
  window.addEventListener('map-reset', sync);
  sync();
  return context => {
    restoring = true;
    positions.clear();
    for (const [view, position] of context?.positions ?? []) positions.set(view, position);
    requestAnimationFrame(() => window.scrollTo({ top: context?.page ?? 0, behavior: 'instant' }));
  };
}
