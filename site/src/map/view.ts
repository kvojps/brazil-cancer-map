/** Swap the text alternative and renderer without remounting either or losing selection. */
export function mountVisualization(): void {
  const controls = document.querySelector<HTMLElement>('.view-controls')!;
  const map = document.querySelector<HTMLElement>('[data-map-view]')!;
  const list = document.querySelector<HTMLElement>('.indicator-table')!;
  const listScroll = list.querySelector<HTMLElement>('.scroll')!;
  let activeList: boolean | undefined;
  const positions = new Map<boolean, { page: number; table: number }>();
  const sync = () => {
    const url = new URL(location.href);
    const isList = url.searchParams.get('visualizacao') === 'lista';
    if (!isList && url.searchParams.has('visualizacao')) {
      url.searchParams.delete('visualizacao');
      history.replaceState(history.state, '', url);
    }
    const changed = activeList !== undefined && activeList !== isList;
    if (changed) positions.set(activeList!, { page: window.scrollY, table: listScroll.scrollTop });
    activeList = isList;
    map.hidden = isList;
    list.hidden = !isList;
    for (const button of controls.querySelectorAll<HTMLButtonElement>('[data-view]')) {
      button.setAttribute('aria-pressed', String((button.dataset.view === 'lista') === isList));
    }
    window.dispatchEvent(new Event('resize'));
    if (changed) requestAnimationFrame(() => {
      if (activeList !== isList) return;
      const position = positions.get(isList);
      window.scrollTo({ top: position?.page ?? 0, behavior: 'instant' });
      listScroll.scrollTop = position?.table ?? 0;
    });
  };
  const choose = (view: string) => {
    const url = new URL(location.href);
    if (view === 'lista') url.searchParams.set('visualizacao', 'lista');
    else url.searchParams.delete('visualizacao');
    if (url.href !== location.href) history.pushState(null, '', url);
    sync();
    window.dispatchEvent(new Event('navigation-state-change'));
  };
  controls.hidden = false;
  for (const button of controls.querySelectorAll<HTMLButtonElement>('[data-view]')) button.onclick = () => choose(button.dataset.view!);
  window.addEventListener('popstate', sync);
  sync();
}
