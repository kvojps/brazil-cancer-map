import type { Address, Navigation } from './address';
import type { MunicipalityListing } from './indicator-layer';
import { writeMapState, type MapState } from './map-state';
import type { UfProfile } from '../profile/profile';
import { municipalityPath } from '../profile/profile';
import { municipalityFromUrl, searchMunicipalities, searchStatusText } from './navigation';
import { createMunicipalityQuery } from '../profile/municipality-query';
import { mountPanelReading, type MunicipalityReading } from '../profile/panel-reading';
import { axisResults, panelResult } from '../profile/panel-result';
import { renderAxisResults, renderResult, resultAnnouncement } from '../profile/panel-view';
import { mountMunicipalityShare } from './municipality-share';
import type { MapCamera } from './camera';

/** The composition where the panel is a sheet at the bottom; repeated in the CSS of the components that take part in it. */
const SHEET = '(max-width: 767px)';
type Municipality = MunicipalityListing['municipalities'][number];

export interface MunicipalityNavigation {
  /** Follows the map state into the query. */
  update(state: MapState): void;
  /** Bring back the details and the reading of an entry the visitor navigated to; `anchor` is the Eixo it asks for, if any. */
  restore(navigation: Navigation<MunicipalityReading>): void;
}

export function mountMunicipalityNavigation(camera: MapCamera, listing: MunicipalityListing, dataBase: string, address: Address<MunicipalityReading>, initialState: MapState): MunicipalityNavigation {
  address.convertLegacyMunicipality(code => {
    const place = listing.municipalities.find(place => place.code === code);
    return place && municipalityPath(place);
  });
  const panel = document.querySelector<HTMLElement>('#municipality-preview')!;
  panel.dataset.enhanced = '';
  const input = document.querySelector<HTMLInputElement>('#municipality-search')!;
  const results = document.querySelector<HTMLElement>('#municipality-results')!;
  const status = document.querySelector<HTMLElement>('#search-status')!;
  const content = panel.querySelector<HTMLElement>('[data-profile-slot]')!;
  const sheet = matchMedia(SHEET);
  const resultBlock = panel.querySelector<HTMLElement>('[data-profile-result]')!;
  const heading = panel.querySelector<HTMLElement>('#preview-heading')!;
  const toggle = panel.querySelector<HTMLButtonElement>('[data-toggle-profile]')!;
  const clear = panel.querySelector<HTMLButtonElement>('[data-clear-profile]')!;
  const panelType = panel.querySelector<HTMLLabelElement>('.panel-type')!;
  const panelTypeSelect = panelType.querySelector<HTMLSelectElement>('select')!;
  const panelLegend = panel.querySelector<HTMLElement>('[data-panel-legend]')!;
  const initialProfile = content.querySelector<HTMLElement>('.profile');
  const share = panel.querySelector<HTMLElement>('[data-municipality-share]')!;
  const resetShare = mountMunicipalityShare(share, () => {
    const { place: selected, state } = query;
    if (!selected) return;
    const url = new URL(municipalityPath(selected), location.origin);
    url.search = writeMapState(state).toString();
    return { title: heading.textContent, url: url.href };
  });
  let shownCode = '';
  let returnFocus: HTMLElement = input;
  const root = document.documentElement;

  // What the floating controls and the sheet are placed against. The open sheet keeps the collapsed height, so nothing moves behind it.
  const list = document.querySelector<HTMLElement>('.indicator-table')!;
  const listScroll = list.querySelector<HTMLElement>('.scroll')!;
  const syncSheetMetrics = () => {
    if (!list.hidden) root.style.setProperty('--list-reading-top', `${listScroll.getBoundingClientRect().top}px`);
    root.style.setProperty('--notice-height', `${document.querySelector('.construction-notice')!.getBoundingClientRect().height}px`);
    if (panel.hidden) root.style.setProperty('--sheet-height', '0px');
    else if (sheet.matches && panel.hasAttribute('data-collapsed')) root.style.setProperty('--sheet-height', `${panel.getBoundingClientRect().height}px`);
  };
  const metrics = new ResizeObserver(syncSheetMetrics);
  metrics.observe(panel);
  metrics.observe(document.querySelector('.construction-notice')!);
  metrics.observe(listScroll);
  metrics.observe(document.querySelector('.map-controls')!);
  const restoreFocus = () => {
    // On a phone the closed search leaves only its icon in place.
    const target = [returnFocus, input, document.querySelector<HTMLElement>('.search-toggle')].find(element => element?.getClientRects().length);
    target?.focus({ preventScroll: true });
  };
  const render = (selected: Municipality, { html, profile }: { html: string; profile: UfProfile }, state: MapState) => {
    const region = listing.immediate_regions[selected.immediate_region];
    const result = panelResult(selected, profile, state, region);
    renderResult(resultBlock, result);
    toggle.hidden = false;
    panelType.hidden = false;
    panelTypeSelect.value = state.cancerType;
    panelType.querySelector<HTMLElement>('[data-panel-cancer-label]')!.textContent = panelTypeSelect.selectedOptions[0].textContent;
    if (shownCode !== selected.code || !content.querySelector('.profile')) {
      const document = new DOMParser().parseFromString(html, 'text/html');
      const profile = document.querySelector<HTMLElement>('.profile');
      if (!profile) throw new Error('Municipal profile is missing');
      // The select above replaces the links, and only one Eixo opens at a time, by its title.
      profile.querySelector('.profile-types')?.remove();
      profile.querySelector('.profile-axes')?.remove();
      content.replaceChildren(profile);
      reading.prepareAxes();
      shownCode = selected.code;
    }
    for (const section of content.querySelectorAll<HTMLElement>('[data-cancer-type]')) section.hidden = section.dataset.cancerType !== state.cancerType;
    // The number appears once: the block above already says what this card would open with.
    for (const card of content.querySelectorAll<HTMLElement>('[data-indicator]')) card.toggleAttribute('data-in-result', card.dataset.indicator === state.indicator);
    const note = content.querySelector<HTMLElement>('.all-cancers-note');
    if (note) note.hidden = state.cancerType !== 'all';
    const lines = axisResults(selected, profile, state);
    for (const axis of content.querySelectorAll<HTMLDetailsElement>('[data-profile-axis]')) renderAxisResults(axis, lines[axis.id] ?? []);
    status.textContent = resultAnnouncement(`${selected.name} (${selected.uf})`, result);
  };
  const rendered = () => {
    reading.rendered();
    // Frame against the loaded summary and the controls resting above it.
    syncSheetMetrics();
    camera.summaryRendered();
  };
  const showSelection = (place: Municipality | undefined) => {
    resetShare();
    shownCode = '';
    content.replaceChildren();
    reading.resetSelection();
    camera.clear();
    if (!place) {
      panel.hidden = true;
      panelLegend.hidden = true;
      resultBlock.replaceChildren();
      status.textContent = '';
      syncSheetMetrics();
      return;
    }
    heading.textContent = `${place.name} (${place.uf})`;
    clear.hidden = false;
    panelLegend.hidden = false;
    panel.hidden = false;
    toggle.hidden = true;
    resultBlock.removeAttribute('data-kind');
    resultBlock.textContent = 'Carregando o resultado…';
    panelType.hidden = true;
    reading.showSelection();
    status.textContent = `${place.name} (${place.uf}) selecionado.`;
  };
  const failed = (error: unknown) => {
    console.error(error);
    content.replaceChildren();
    resultBlock.replaceChildren();
    panelType.hidden = true;
    shownCode = '';
    toggle.hidden = true;
    status.textContent = 'Não foi possível carregar a consulta municipal. Isso não significa dado insuficiente.';
    const note = document.createElement('p');
    note.textContent = status.textContent;
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Tentar novamente';
    retry.onclick = () => {
      camera.summaryReloading();
      void query.retry();
    };
    resultBlock.dataset.kind = 'error';
    resultBlock.append(note, retry);
  };
  const query = createMunicipalityQuery(initialState, {
    initialDocument: initialProfile && initialProfile.dataset.code
      ? { code: initialProfile.dataset.code, html: initialProfile.outerHTML } : undefined,
    async loadProfile(uf) {
      const response = await fetch(`${dataBase}/profiles/${uf}.json`);
      if (!response.ok) throw new Error(`Profile request failed (${response.status})`);
      return response.json() as Promise<UfProfile>;
    },
    async loadDocument(place) {
      const response = await fetch(municipalityPath(place));
      if (!response.ok) throw new Error(`Municipality request failed (${response.status})`);
      const html = await response.text();
      const profile = new DOMParser().parseFromString(html, 'text/html').querySelector('.profile');
      if (!profile) throw new Error('Municipal profile is missing');
      return profile.outerHTML;
    },
    selectionChanged: showSelection,
    filtersChanged: resetShare,
    render,
    read: destination => reading.apply(destination),
    rendered,
    failed,
  });
  const reading = mountPanelReading({
    panel, content, heading, toggle, clear, share, panelLegend, sheet, address, query,
    onCompositionChanged(expanded) {
      syncSheetMetrics();
      camera.sheetChanged(!sheet.matches ? 'none' : expanded ? 'open' : 'collapsed');
    },
    onGesture: () => camera.userTookOver(),
    restoreAnchorReading: anchor => { void query.restore(query.place, query.state, { anchor }); },
  });
  address.registerContext('municipality', () => reading.capture(shownCode));
  address.onChange(({ url }) => {
    if (!query.place || url.pathname === municipalityPath(query.place)) reading.syncDetails();
  });
  clear.onclick = () => {
    address.closeMunicipality();
    void query.apply(undefined, query.state);
    restoreFocus();
  };
  panelTypeSelect.addEventListener('change', () => {
    const selector = document.querySelector<HTMLSelectElement>('#cancer-type')!;
    selector.value = panelTypeSelect.value;
    selector.dispatchEvent(new Event('change'));
  });
  const select = (place: Municipality, focusAfterwards: HTMLElement = input, preserveCamera = false) => {
    reading.cancelPendingSummaryFocus();
    returnFocus = focusAfterwards;
    // Save exploration before the selection moves anything.
    address.selectMunicipality(municipalityPath(place), { left: scrollX, top: scrollY });
    void query.select(place);
    // The camera hears of the selection once the panel has placed the sheet around it.
    camera.select(place.code, { preserveCamera });
  };
  const selectFromSearch = (place: MunicipalityListing['municipalities'][number]) => {
    results.replaceChildren();
    select(place);
    heading.focus({ preventScroll: true });
  };
  input.disabled = false;
  input.addEventListener('input', () => {
    const matches = searchMunicipalities(listing.municipalities, input.value);
    if (input.value.trim() && !matches.length) {
      const empty = document.createElement('li');
      empty.textContent = searchStatusText(0);
      results.replaceChildren(empty);
      status.textContent = empty.textContent;
      return;
    }
    results.replaceChildren(...matches.map(place => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${place.name} (${place.uf})`;
      button.addEventListener('click', () => selectFromSearch(place));
      const link = document.createElement('a');
      link.textContent = `Abrir consulta: ${place.name} (${place.uf})`;
      link.href = municipalityPath(place);
      item.append(button, ' ', link);
      return item;
    }));
    status.textContent = input.value.trim() ? searchStatusText(matches.length) : '';
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
  document.querySelector('.indicator-table')!.addEventListener('click', event => {
    const click = event as MouseEvent;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('tbody a') : null;
    if (!link || click.ctrlKey || click.metaKey || click.shiftKey || click.altKey || click.button !== 0) return;
    const place = listing.municipalities.find(place => municipalityPath(place) === new URL(link.href).pathname);
    if (!place) return;
    event.preventDefault();
    select(place, link, true);
    reading.resetSheetPosition();
  });
  window.addEventListener('municipality-map-select', event => {
    const code = (event as CustomEvent<string>).detail;
    const place = listing.municipalities.find(place => place.code === code);
    if (!place) return;
    select(place, input, true);
  });
  return {
    update(nextState) {
      void query.update(nextState);
    },
    restore({ url, mapState, context, anchor, cause }) {
      const place = municipalityFromUrl(listing.municipalities, url);
      reading.restore({ sameSelection: place?.code === query.place?.code, fromBack: cause === 'back' }, () => {
        void query.restore(place, mapState, { saved: context.municipality, anchor });
      });
      if (place) camera.select(place.code);
    },
  };
}
