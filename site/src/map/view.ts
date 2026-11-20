import type { Address, View } from './address';

/** Where the visitor was reading in each visualization. */
export interface ViewContext { page: number; positions: [boolean, { page: number; table: number }][] }

export interface Visualization {
  /** Show the map or its List, as the address now asks. */
  show(view: View): void;
  /** Bring back where the visitor was reading, before the entry's visualization is shown. */
  restore(context: ViewContext | undefined): void;
}

/** Swap the text alternative and renderer without remounting either or losing selection. */
export function mountVisualization(address: Address<{ view: ViewContext }>): Visualization {
  const controls = document.querySelector<HTMLElement>('.view-controls')!;
  const map = document.querySelector<HTMLElement>('[data-map-view]')!;
  const list = document.querySelector<HTMLElement>('.indicator-table')!;
  const listScroll = list.querySelector<HTMLElement>('.scroll')!;
  let activeList: boolean | undefined;
  const positions = new Map<boolean, { page: number; table: number }>();
  let restoring = false;
  address.registerContext('view', () => ({ page: window.scrollY, positions: [...positions] }));
  const show = (view: View) => {
    const isList = view === 'list';
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
  controls.hidden = false;
  for (const button of controls.querySelectorAll<HTMLButtonElement>('[data-view]')) {
    button.onclick = () => {
      const view = button.dataset.view === 'lista' ? 'list' : 'map';
      address.chooseView(view);
      show(view);
    };
  }
  return {
    show,
    restore(context) {
      restoring = true;
      positions.clear();
      for (const [view, position] of context?.positions ?? []) positions.set(view, position);
      requestAnimationFrame(() => window.scrollTo({ top: context?.page ?? 0, behavior: 'instant' }));
    },
  };
}
