import type { MapLibreMap } from 'maplibre-gl';
import { INDICATORS, type IndicatorLayer, type MunicipalityListing } from './indicator-layer';
import { readMapState, type MapState } from './map-state';
import { renderMunicipalityPreview } from './municipality-preview';
import type { UfProfile } from '../profile/profile';
import { municipalityPath } from '../profile/profile';
import { createMunicipalityNavigation, searchMunicipalities } from './navigation';
import { clearMunicipality, focusMunicipality, onMunicipalityClick } from './municipality-map';

export function mountMunicipalityNavigation(map: MapLibreMap, listing: MunicipalityListing, dataBase: string): (layer: IndicatorLayer, state: MapState) => void {
  const panel = document.querySelector<HTMLElement>('#municipality-preview')!;
  const input = document.querySelector<HTMLInputElement>('#municipality-search')!;
  const results = document.querySelector<HTMLElement>('#municipality-results')!;
  const status = document.querySelector<HTMLElement>('#search-status')!;
  const profiles = new Map<string, Promise<UfProfile>>();
  const content = panel.querySelector<HTMLElement>('[data-preview-content]')!;
  let link = panel.querySelector<HTMLAnchorElement>('[data-open-profile]')!;
  let selected: MunicipalityListing['municipalities'][number] | undefined;
  let layer: IndicatorLayer | undefined;
  let state: MapState = readMapState(new URLSearchParams(location.search));
  const render = (details?: UfProfile) => {
    if (!selected) return;
    content.innerHTML = renderMunicipalityPreview(selected, listing.immediate_regions[selected.immediate_region] ?? selected.immediate_region, layer, state.mode, details, state.indicator);
    const url = new URL(municipalityPath(selected), location.href);
    url.search = location.search;
    url.searchParams.delete('municipio');
    const nextLink = document.createElement('a');
    nextLink.dataset.openProfile = '';
    nextLink.textContent = 'Ver Meu município';
    nextLink.href = url.href;
    link.replaceWith(nextLink);
    link = nextLink;
  };
  const navigation = createMunicipalityNavigation({
    places: listing.municipalities,
    getUrl: () => new URL(location.href),
    setUrl: url => { history.pushState(null, '', url); window.dispatchEvent(new Event('navigation-state-change')); },
    focus: place => {
      selected = place;
      render();
      focusMunicipality(map, place.code);
      status.textContent = `${place.name} (${place.uf}) selecionado. Prévia disponível após os controles.`;
    },
    load: async place => {
      // Only HPV needs a field exclusive to the UF profile (denominator_note).
      if (state.indicator !== 'hpv' || !layer?.municipalities[place.code]) return undefined;
      let profile = profiles.get(place.uf);
      if (!profile) {
        profile = fetch(`${dataBase}/profiles/${place.uf}.json`).then(response => {
          if (!response.ok) throw new Error(`Profile request failed (${response.status})`);
          return response.json() as Promise<UfProfile>;
        });
        profiles.set(place.uf, profile);
        profile.catch(() => profiles.delete(place.uf));
      }
      return profile;
    },
    show: details => {
      render(details);
      status.textContent = `${selected!.name} (${selected!.uf}): prévia de ${INDICATORS[state.indicator]!.name} atualizada.`;
    },
    clear: () => {
      selected = undefined;
      content.innerHTML = '<p>Busque ou selecione um município no mapa para ver a prévia do indicador.</p>';
      link.hidden = true;
      status.textContent = '';
      clearMunicipality(map);
    },
  });
  const failed = (error: unknown) => {
    console.error(error);
    status.textContent = 'Não foi possível carregar os detalhes. A prévia e o acesso a Meu município continuam disponíveis. Tente de novo.';
    const note = document.createElement('p');
    note.textContent = status.textContent;
    content.append(note);
  };
  const select = (place: MunicipalityListing['municipalities'][number]) => {
    input.focus({ preventScroll: true });
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
  onMunicipalityClick(map, code => {
    const place = listing.municipalities.find(place => place.code === code);
    if (place) select(place);
  });
  return (nextLayer: IndicatorLayer, nextState: MapState) => {
    layer = nextLayer;
    state = nextState;
    void Promise.resolve(navigation.restore()).catch(failed);
  };
}
