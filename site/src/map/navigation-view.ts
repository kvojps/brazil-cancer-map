import type { Address } from './address';
import { type IndicatorLayer, type MunicipalityListing } from './indicator-layer';
import { readMapState, sameMapState, writeMapState, type MapState } from './map-state';
import type { UfProfile } from '../profile/profile';
import { municipalityPath } from '../profile/profile';
import { createMunicipalityNavigation, searchMunicipalities, searchStatusText } from './navigation';
import { axisResults, panelResult } from '../profile/panel-result';
import { renderAxisResults, renderResult, resultAnnouncement } from '../profile/panel-view';
import { mountMunicipalityShare } from './municipality-share';
import type { MapCamera } from './camera';

/** The composition where the panel is a sheet at the bottom; repeated in the CSS of the components that take part in it. */
const SHEET = '(max-width: 767px)';
const isPhone = () => matchMedia('(max-width: 767px)').matches;
const isSheet = () => matchMedia(SHEET).matches;

/** Where the visitor was reading the Meu município query. */
export interface MunicipalityContext { code: string; axis: string; top: number; panelTop: number }

export interface MunicipalityNavigation {
  /** Follows the map state into the query. */
  update(layer: IndicatorLayer | undefined, state: MapState): void;
  /** Bring back the details and the reading of an entry the visitor navigated to; `anchor` is the Eixo it asks for, if any. */
  restoreReading(context: MunicipalityContext | undefined, anchor: string): void;
}

export function mountMunicipalityNavigation(camera: MapCamera, listing: MunicipalityListing, dataBase: string, address: Address<{ municipality: MunicipalityContext }>, arrivalAnchor: string): MunicipalityNavigation {
  address.convertLegacyMunicipality(code => {
    const place = listing.municipalities.find(place => place.code === code);
    return place && municipalityPath(place);
  });
  const panel = document.querySelector<HTMLElement>('#municipality-preview')!;
  panel.dataset.enhanced = '';
  const input = document.querySelector<HTMLInputElement>('#municipality-search')!;
  const results = document.querySelector<HTMLElement>('#municipality-results')!;
  const status = document.querySelector<HTMLElement>('#search-status')!;
  const profiles = new Map<string, Promise<UfProfile>>();
  const content = panel.querySelector<HTMLElement>('[data-profile-slot]')!;
  const reading = panel.querySelector<HTMLElement>('.panel-reading')!;
  let restoredReading: MunicipalityContext | undefined;
  address.registerContext('municipality', () => ({ code: shownCode, axis: content.querySelector<HTMLDetailsElement>('[data-profile-axis][open]')?.id ?? '', top: reading.scrollTop, panelTop: panel.scrollTop }));
  const resultBlock = panel.querySelector<HTMLElement>('[data-profile-result]')!;
  const heading = panel.querySelector<HTMLElement>('#preview-heading')!;
  const toggle = panel.querySelector<HTMLButtonElement>('[data-toggle-profile]')!;
  const closeDetails = panel.querySelector<HTMLButtonElement>('[data-close-details]')!;
  const clear = panel.querySelector<HTMLButtonElement>('[data-clear-profile]')!;
  const panelType = panel.querySelector<HTMLLabelElement>('.panel-type')!;
  const panelTypeSelect = panelType.querySelector<HTMLSelectElement>('select')!;
  const panelLegend = panel.querySelector<HTMLElement>('[data-panel-legend]')!;
  const documents = new Map<string, Promise<string>>();
  const initialProfile = content.querySelector<HTMLElement>('.profile');
  if (initialProfile) documents.set(initialProfile.dataset.code!, Promise.resolve(initialProfile.outerHTML));
  let selected: MunicipalityListing['municipalities'][number] | undefined;
  let state: MapState = readMapState(new URLSearchParams(location.search));
  const share = panel.querySelector<HTMLElement>('[data-municipality-share]')!;
  const resetShare = mountMunicipalityShare(share, () => {
    if (!selected) return;
    const url = new URL(municipalityPath(selected), location.origin);
    url.search = writeMapState(state).toString();
    return { title: heading.textContent, url: url.href };
  });
  let shownCode = '';
  let shownIndicator = '';
  let initialAnchor = arrivalAnchor;
  let anchorArrival = true;
  let returnFocus: HTMLElement = input;
  const root = document.documentElement;
  let focusSummaryOnLoad = false;
  // A gesture cancels both arrivals: the reading's and the camera's.
  const cancelArrival = () => {
    anchorArrival = false;
    restoredReading = undefined;
    camera.userTookOver();
  };
  for (const event of ['wheel', 'touchmove', 'pointerdown', 'keydown']) {
    window.addEventListener(event, cancelArrival, { passive: true, capture: true });
  }

  // What the floating controls and the sheet are placed against. The open sheet keeps the collapsed height, so nothing moves behind it.
  const list = document.querySelector<HTMLElement>('.indicator-table')!;
  const listScroll = list.querySelector<HTMLElement>('.scroll')!;
  const syncSheetMetrics = () => {
    if (!list.hidden) root.style.setProperty('--list-reading-top', `${listScroll.getBoundingClientRect().top}px`);
    root.style.setProperty('--notice-height', `${document.querySelector('.construction-notice')!.getBoundingClientRect().height}px`);
    if (panel.hidden) root.style.setProperty('--sheet-height', '0px');
    else if (isSheet() && panel.hasAttribute('data-collapsed')) root.style.setProperty('--sheet-height', `${panel.getBoundingClientRect().height}px`);
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
  const axisFor = (indicator: string) => indicator === 'within_60_days' ? 'acesso' : indicator === 'hpv' ? 'prevencao' : indicator === 'mortality' ? 'panorama' : 'deteccao';
  // The camera hears of a selection once the panel has placed the sheet around it.
  const selectOnCamera = (preserveCamera?: boolean) => {
    if (selected) camera.select(selected.code, { preserveCamera });
  };
  const detailsOpen = () => address.detailsOpen;
  const expand = (expanded: boolean, preserveShareFocus = false) => {
    const focused = document.activeElement;
    const shareFocused = focused instanceof HTMLElement && share.contains(focused);
    panel.toggleAttribute('data-collapsed', !expanded);
    const nextToShare = expanded ? clear : panelLegend;
    const movingShare = share.nextElementSibling !== nextToShare;
    if (!expanded && (movingShare || !shareFocused)) panel.scrollTop = 0;
    if (movingShare) {
      // Keep pending sharing and its feedback with the control in either layout.
      nextToShare.before(share);
      if (preserveShareFocus && shareFocused) {
        focused.focus({ preventScroll: true });
        requestAnimationFrame(() => {
          if (document.activeElement === focused) focused.scrollIntoView({ block: 'nearest' });
        });
      }
    }
    toggle.setAttribute('aria-expanded', String(expanded));
    syncSheetMetrics();
    camera.sheetChanged(!isSheet() ? 'none' : expanded ? 'open' : 'collapsed');
  };
  const syncDetails = (event?: Event) => {
    const resizing = event?.type === 'change';
    const hadFocus = panel.contains(document.activeElement);
    const wasExpanded = !panel.hasAttribute('data-collapsed');
    expand(!isPhone() || detailsOpen(), resizing);
    if (isPhone() && wasExpanded && !detailsOpen()) {
      if (hadFocus && !(resizing && share.contains(document.activeElement))) {
        focusSummaryOnLoad = toggle.hasAttribute('hidden');
        if (focusSummaryOnLoad) panel.focus({ preventScroll: true });
        else toggle.focus();
      }
      const position = address.exploration;
      if (position) requestAnimationFrame(() => window.scrollTo({ ...position, behavior: 'instant' }));
    }
  };
  const openDetails = () => {
    cancelArrival();
    address.openDetails();
    for (const axis of content.querySelectorAll<HTMLDetailsElement>('[data-profile-axis]')) axis.open = axis.id === axisFor(state.indicator);
    expand(true);
    heading.focus({ preventScroll: true });
  };
  toggle.onclick = openDetails;
  closeDetails.onclick = () => {
    closeDetails.focus({ preventScroll: true });
    // Closing details the opening created is Back: the navigation that follows syncs them.
    if (!address.closeDetails()) return;
    initialAnchor = '';
    syncDetails();
  };
  window.addEventListener('navigation-state-change', syncDetails);
  matchMedia('(max-width: 767px)').addEventListener('change', syncDetails);
  const prepareAxes = () => {
    for (const axis of content.querySelectorAll<HTMLDetailsElement>('[data-profile-axis]')) {
      axis.name = 'profile-axis';
      const title = axis.querySelector<HTMLElement>(':scope > summary')!;
      let touched = false;
      title.addEventListener('click', () => { touched = true; });
      // Closing the Eixo above moves this one: keep the title that was just activated in view.
      axis.addEventListener('toggle', () => { if (axis.open && touched) title.scrollIntoView({ block: 'nearest' }); touched = false; });
    }
  };
  const render = ({ html, profile }: { html: string; profile: UfProfile }) => {
    if (!selected) return;
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
      prepareAxes();
      shownCode = selected.code;
      shownIndicator = '';
    }
    for (const section of content.querySelectorAll<HTMLElement>('[data-cancer-type]')) section.hidden = section.dataset.cancerType !== state.cancerType;
    // The number appears once: the block above already says what this card would open with.
    for (const card of content.querySelectorAll<HTMLElement>('[data-indicator]')) card.toggleAttribute('data-in-result', card.dataset.indicator === state.indicator);
    const note = content.querySelector<HTMLElement>('.all-cancers-note');
    if (note) note.hidden = state.cancerType !== 'all';
    const lines = axisResults(selected, profile, state);
    for (const axis of content.querySelectorAll<HTMLDetailsElement>('[data-profile-axis]')) renderAxisResults(axis, lines[axis.id] ?? []);
    if (shownIndicator !== state.indicator) {
      const indicatorChanged = shownIndicator !== '';
      const axisId = ['acesso', 'deteccao', 'prevencao', 'panorama'].includes(initialAnchor)
        ? initialAnchor : initialAnchor.startsWith('tipo-') ? 'acesso' : axisFor(state.indicator);
      for (const axis of content.querySelectorAll<HTMLDetailsElement>('[data-profile-axis]')) axis.open = axis.id === axisId;
      shownIndicator = state.indicator;
      if (indicatorChanged && isPhone() && detailsOpen()) content.querySelector<HTMLElement>(`#${axisId}`)?.scrollIntoView({ block: 'start' });
      if (initialAnchor && isPhone()) {
        // A shared anchor is already the destination, not a synthetic details visit.
        address.openDetailsInPlace();
        expand(true);
        const target = content.querySelector<HTMLElement>(`#${axisId}`);
        const code = selected.code;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (anchorArrival && selected?.code === code && detailsOpen()) target?.scrollIntoView({ block: 'start' });
        }));
      }
      initialAnchor = '';
    }
    if (restoredReading?.code === selected.code) {
      const position = restoredReading;
      restoredReading = undefined;
      for (const axis of content.querySelectorAll<HTMLDetailsElement>('[data-profile-axis]')) axis.open = axis.id === position.axis;
      reading.scrollTop = position.top;
      panel.scrollTop = position.panelTop;
    }
    if (focusSummaryOnLoad) {
      focusSummaryOnLoad = false;
      if (document.activeElement === panel && isPhone() && panel.hasAttribute('data-collapsed')) toggle.focus();
    }
    status.textContent = resultAnnouncement(`${selected.name} (${selected.uf})`, result);
    // Frame against the loaded summary and the controls resting above it.
    syncSheetMetrics();
    camera.summaryRendered();
  };
  const navigation = createMunicipalityNavigation({
    places: listing.municipalities,
    getUrl: () => new URL(location.href),
    setPlace: place => {
      // The exploration is read before the selection moves anything.
      if (place) address.selectMunicipality(municipalityPath(place), { left: scrollX, top: scrollY });
      else address.closeMunicipality();
      window.dispatchEvent(new Event('navigation-state-change'));
    },
    focus: place => {
      const changed = selected?.code !== place.code;
      selected = place;
      heading.textContent = `${place.name} (${place.uf})`;
      clear.hidden = false;
      panelLegend.hidden = false;
      if (changed) {
        resetShare();
        panel.hidden = false;
        toggle.hidden = true;
        focusSummaryOnLoad = false;
        resultBlock.removeAttribute('data-kind');
        resultBlock.textContent = 'Carregando o resultado…';
        panelType.hidden = true;
        content.replaceChildren();
        shownCode = '';
        expand(!isPhone() || detailsOpen());
      }
      status.textContent = `${place.name} (${place.uf}) selecionado.`;
    },
    load: async place => {
      let profile = profiles.get(place.uf);
      if (!profile) {
        profile = fetch(`${dataBase}/profiles/${place.uf}.json`).then(response => {
          if (!response.ok) throw new Error(`Profile request failed (${response.status})`);
          return response.json() as Promise<UfProfile>;
        });
        profiles.set(place.uf, profile);
        profile.catch(() => profiles.delete(place.uf));
      }
      let document = documents.get(place.code);
      if (!document) {
        document = fetch(municipalityPath(place)).then(async response => {
          if (!response.ok) throw new Error(`Municipality request failed (${response.status})`);
          const html = await response.text();
          const profile = new DOMParser().parseFromString(html, 'text/html').querySelector('.profile');
          if (!profile) throw new Error('Municipal profile is missing');
          return profile.outerHTML;
        });
        documents.set(place.code, document);
        document.catch(() => documents.delete(place.code));
      }
      // Reuse the static cards as the single editorial renderer, with the UF data loaded on demand.
      const [data, html] = await Promise.all([profile, document]);
      return { html, profile: data };
    },
    show: render,
    clear: () => {
      if (selected) cancelArrival();
      resetShare();
      panel.hidden = true;
      panelLegend.hidden = true;
      selected = undefined;
      content.replaceChildren();
      shownCode = '';
      resultBlock.replaceChildren();
      status.textContent = '';
      syncSheetMetrics();
      camera.clear();
    },
  });
  const failed = (error: unknown) => {
    console.error(error);
    initialAnchor = '';
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
      if (selected) {
        camera.summaryReloading();
        void navigation.select(selected, false).catch(failed);
      }
    };
    resultBlock.dataset.kind = 'error';
    resultBlock.append(note, retry);
  };
  clear.onclick = () => { navigation.close(); restoreFocus(); };
  panelTypeSelect.addEventListener('change', () => {
    const selector = document.querySelector<HTMLSelectElement>('#cancer-type')!;
    selector.value = panelTypeSelect.value;
    selector.dispatchEvent(new Event('change'));
  });
  // A link to an Eixo inside a card opens it: browsers only reveal closed details around a target, not the target itself.
  content.addEventListener('click', event => {
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
    const click = event as MouseEvent;
    if (!link || link.pathname !== location.pathname || click.ctrlKey || click.metaKey || click.shiftKey || click.altKey || click.button !== 0) return;
    for (const axis of content.querySelectorAll<HTMLDetailsElement>('[data-profile-axis]')) {
      if (`#${axis.id}` !== link.hash) continue;
      axis.open = true;
      if (isPhone()) {
        // Axis navigation belongs to this details entry, so Back still returns to the summary.
        event.preventDefault();
        address.followAnchor(link.hash.slice(1));
        axis.querySelector('summary')!.focus({ preventScroll: true });
        requestAnimationFrame(() => axis.scrollIntoView({ block: 'start' }));
      }
    }
  });
  const select = (place: MunicipalityListing['municipalities'][number], focusAfterwards: HTMLElement = input, preserveCamera = false) => {
    initialAnchor = '';
    returnFocus = focusAfterwards;
    const loading = navigation.select(place);
    selectOnCamera(preserveCamera);
    void loading.catch(failed);
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
    if (isSheet()) panel.scrollTop = 0;
  });
  window.addEventListener('municipality-map-select', event => {
    const code = (event as CustomEvent<string>).detail;
    const place = listing.municipalities.find(place => place.code === code);
    if (!place) return;
    select(place, input, true);
  });
  return {
    update(nextLayer, nextState) {
      void nextLayer;
      if (!sameMapState(state, nextState)) resetShare();
      state = nextState;
      const restoring = navigation.restore();
      selectOnCamera();
      void Promise.resolve(restoring).catch(failed);
    },
    restoreReading(context, anchor) {
      // The map state, applied first, already told the camera where to arrive.
      restoredReading = context;
      initialAnchor = anchor;
      anchorArrival = true;
      // The details come before the reading: the profile may render right after this navigation, and reads in the open sheet.
      syncDetails();
    },
  };
}
