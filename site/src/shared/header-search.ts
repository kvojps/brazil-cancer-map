import type { MunicipalityListing } from '../map/indicator-layer';
import { searchMunicipalities, searchStatusText } from '../map/navigation';
import { municipalityPath } from '../profile/profile';

type Municipality = MunicipalityListing['municipalities'][number];

/**
 * The search on pages without the dashboard. The list is large, so it loads when the search is first used,
 * and each result is a link to the dashboard: the shared navigation adds the theme and the filters to it.
 */
export function mountHeaderSearch(listingUrl: string): void {
  const input = document.querySelector<HTMLInputElement>('#municipality-search')!;
  const results = document.querySelector<HTMLElement>('#municipality-results')!;
  const status = document.querySelector<HTMLElement>('#search-status')!;
  let places: Promise<Municipality[]> | undefined;
  const load = () => places ??= fetch(listingUrl).then(async response => {
    if (!response.ok) throw new Error(`Municipality list request failed (${response.status})`);
    return (await response.json() as MunicipalityListing).municipalities;
  }).catch(error => {
    places = undefined;
    throw error;
  });
  const link = (text: string, href: string) => {
    const anchor = document.createElement('a');
    anchor.className = 'search-result';
    anchor.textContent = text;
    anchor.href = href;
    return anchor;
  };
  const item = (...content: (Node | string)[]) => {
    const element = document.createElement('li');
    element.append(...content);
    return element;
  };
  const showFailure = () => {
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Tentar novamente';
    retry.addEventListener('click', () => {
      input.focus();
      void show();
    });
    status.textContent = 'Não foi possível carregar a busca.';
    results.replaceChildren(item(status.textContent), item(retry), item(link('Municípios por UF', '/municipios/')));
  };
  const show = async () => {
    const query = input.value;
    if (!query.trim()) {
      results.replaceChildren();
      status.textContent = '';
      return;
    }
    let all: Municipality[];
    try {
      all = await load();
    } catch (error) {
      console.error(error);
      if (query === input.value) showFailure();
      return;
    }
    if (query !== input.value) return;
    const matches = searchMunicipalities(all, query);
    status.textContent = searchStatusText(matches.length);
    results.replaceChildren(...(matches.length
      ? matches.map(place => item(link(`${place.name} (${place.uf})`, municipalityPath(place))))
      : [item(status.textContent)]));
  };
  input.addEventListener('focus', () => { load().catch(() => {}); });
  input.addEventListener('input', () => { void show(); });
  input.addEventListener('keydown', event => {
    const links = results.querySelectorAll<HTMLAnchorElement>('a');
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      links[0]?.focus();
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (links.length === 1) links[0]!.click();
      else links[0]?.focus();
    }
    if (event.key === 'Escape') results.replaceChildren();
  });
  results.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    results.replaceChildren();
    input.focus();
  });
  input.disabled = false;
}
