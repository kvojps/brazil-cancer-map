import type { MapLibreMap } from 'maplibre-gl';
import type { MunicipalityListing } from './indicator-layer';
import type { UfProfile } from '../profile/profile';
import { municipalityPath } from '../profile/profile';
import { createMunicipalityNavigation, searchMunicipalities } from './navigation';
import { clearMunicipality, focusMunicipality, onMunicipalityClick } from './municipality-map';

export function mountMunicipalityNavigation(map: MapLibreMap, listing: MunicipalityListing, dataBase: string): () => void {
  const panel = document.querySelector<HTMLElement>('#municipality-profile')!;
  const input = document.querySelector<HTMLInputElement>('#municipality-search')!;
  const results = document.querySelector<HTMLElement>('#municipality-results')!;
  const status = document.querySelector<HTMLElement>('#search-status')!;
  const profiles = new Map<string, Promise<UfProfile>>();
  const showType = () => {
    const type = new URLSearchParams(location.search).get('tipo') ?? 'all';
    for (const section of panel.querySelectorAll<HTMLElement>('[data-cancer-type]')) {
      section.hidden = section.dataset.cancerType !== type;
    }
    const close = panel.querySelector<HTMLAnchorElement>('[data-close-profile]');
    if (close) close.href = `/${location.search}`;
  };
  const navigation = createMunicipalityNavigation({
    places: listing.municipalities,
    getUrl: () => new URL(location.href),
    setUrl: url => { history.pushState(null, '', url); window.dispatchEvent(new Event('navigation-state-change')); },
    focus: place => {
      panel.hidden = false;
      focusMunicipality(map, place.code);
    },
    load: async place => {
      status.textContent = 'Carregando a ficha…';
      let profile = profiles.get(place.uf);
      if (!profile) {
        profile = fetch(`${dataBase}/profiles/${place.uf}.json`).then(response => {
          if (!response.ok) throw new Error(`Profile request failed (${response.status})`);
          return response.json() as Promise<UfProfile>;
        });
        profiles.set(place.uf, profile);
        profile.catch(() => profiles.delete(place.uf));
      }
      const data = await profile;
      if (!data.indicators.within_60_days.all?.municipalities[place.code]) throw new Error('Missing municipality profile');
      const existing = panel.querySelector<HTMLElement>('.profile');
      if (existing?.dataset.code === place.code) return existing;
      const response = await fetch(municipalityPath(place));
      if (!response.ok) throw new Error(`Page request failed (${response.status})`);
      const document = new DOMParser().parseFromString(await response.text(), 'text/html');
      const content = document.querySelector<HTMLElement>('.profile');
      if (!content) throw new Error('Missing profile content');
      content.dataset.code = place.code;
      return content;
    },
    show: content => {
      panel.replaceChildren(content);
      panel.hidden = false;
      showType();
      status.textContent = '';
      panel.querySelector<HTMLElement>('[data-profile-heading]')?.focus({ preventScroll: true });
    },
    clear: () => {
      panel.hidden = true;
      status.textContent = '';
      clearMunicipality(map);
    },
  });
  const failed = (error: unknown) => {
    console.error(error);
    status.textContent = 'Não foi possível carregar a ficha. Tente de novo.';
  };
  const select = (place: MunicipalityListing['municipalities'][number]) => {
    results.replaceChildren();
    void navigation.select(place).catch(failed);
  };
  input.disabled = false;
  input.addEventListener('input', () => {
    const matches = searchMunicipalities(listing.municipalities, input.value);
    results.replaceChildren(...matches.map(place => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${place.name} (${place.uf})`;
      button.addEventListener('click', () => select(place));
      item.append(button);
      return item;
    }));
    status.textContent = input.value.trim() ? `${matches.length} municípios encontrados. Use Tab para escolher.` : '';
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') { event.preventDefault(); results.querySelector('button')?.focus(); }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (results.children.length === 1) results.querySelector('button')?.click();
      else results.querySelector('button')?.focus();
    }
    if (event.key === 'Escape') results.replaceChildren();
  });
  results.addEventListener('keydown', event => {
    if (event.key === 'Escape') { results.replaceChildren(); input.focus(); }
  });
  panel.addEventListener('click', event => {
    if ((event.target as Element).closest('[data-close-profile]')) {
      event.preventDefault(); navigation.close(); input.focus();
    }
  });
  onMunicipalityClick(map, code => {
    const place = listing.municipalities.find(place => place.code === code);
    if (place) select(place);
  });
  window.addEventListener('popstate', () => { void Promise.resolve(navigation.restore()).catch(failed); });
  void Promise.resolve(navigation.restore()).catch(failed);
  return showType;
}
