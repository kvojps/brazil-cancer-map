import { type IndicatorLayer, type MunicipalityListing } from './indicator-layer';
import { readMapState, type MapState } from './map-state';
import type { UfProfile } from '../profile/profile';
import { municipalityPath } from '../profile/profile';
import { createMunicipalityNavigation, municipalityFromUrl, searchMunicipalities, searchStatusText } from './navigation';
import { axisResults, panelResult } from '../profile/panel-result';
import { renderAxisResults, renderResult, resultAnnouncement } from '../profile/panel-view';

/** The composition where the panel is a sheet at the bottom; repeated in the CSS of the components that take part in it. */
const SHEET = '(max-width: 767px) and (min-width: 300px) and (min-height: 520px)';
const isSheet = () => matchMedia(SHEET).matches;

export function mountMunicipalityNavigation(map: { focus: (code: string | undefined) => void }, listing: MunicipalityListing, dataBase: string): (layer: IndicatorLayer | undefined, state: MapState) => void {
  const initialUrl = new URL(location.href);
  const initialPlace = municipalityFromUrl(listing.municipalities, initialUrl);
  initialUrl.searchParams.delete('municipio');
  if (initialPlace) initialUrl.pathname = municipalityPath(initialPlace);
  history.replaceState(null, '', initialUrl);
  const panel = document.querySelector<HTMLElement>('#municipality-preview')!;
  panel.dataset.enhanced = '';
  const input = document.querySelector<HTMLInputElement>('#municipality-search')!;
  const results = document.querySelector<HTMLElement>('#municipality-results')!;
  const status = document.querySelector<HTMLElement>('#search-status')!;
  const profiles = new Map<string, Promise<UfProfile>>();
  const content = panel.querySelector<HTMLElement>('[data-profile-slot]')!;
  const resultBlock = panel.querySelector<HTMLElement>('[data-profile-result]')!;
  const heading = panel.querySelector<HTMLElement>('#preview-heading')!;
  const toggle = panel.querySelector<HTMLButtonElement>('[data-toggle-profile]')!;
  const clear = panel.querySelector<HTMLButtonElement>('[data-clear-profile]')!;
  const panelType = panel.querySelector<HTMLLabelElement>('.panel-type')!;
  const panelTypeSelect = panelType.querySelector<HTMLSelectElement>('select')!;
  const panelLegend = document.querySelector<HTMLElement>('[data-panel-legend]')!;
  const documents = new Map<string, Promise<string>>();
  const initialProfile = content.querySelector<HTMLElement>('.profile');
  if (initialProfile) documents.set(initialProfile.dataset.code!, Promise.resolve(initialProfile.outerHTML));
  let selected: MunicipalityListing['municipalities'][number] | undefined;
  let state: MapState = readMapState(new URLSearchParams(location.search));
  let shownCode = '';
  let shownIndicator = '';
  let initialAnchor = location.hash.slice(1);
  let returnFocus: HTMLElement = input;
  const root = document.documentElement;
  // What the floating controls and the sheet are placed against. The open sheet keeps the collapsed height, so nothing moves behind it.
  const syncSheetMetrics = () => {
    root.style.setProperty('--notice-height', `${document.querySelector('.construction-notice')!.getBoundingClientRect().height}px`);
    if (panel.hidden) root.style.setProperty('--sheet-height', '0px');
    else if (isSheet() && panel.hasAttribute('data-collapsed')) root.style.setProperty('--sheet-height', `${panel.getBoundingClientRect().height}px`);
  };
  const metrics = new ResizeObserver(syncSheetMetrics);
  metrics.observe(panel);
  metrics.observe(document.querySelector('.construction-notice')!);
  const restoreFocus = () => {
    // On a phone the closed search leaves only its icon in place.
    const target = [returnFocus, input, document.querySelector<HTMLElement>('.search-toggle')].find(element => element?.getClientRects().length);
    target?.focus({ preventScroll: true });
  };
  const axisFor = (indicator: string) => indicator === 'within_60_days' ? 'acesso' : indicator === 'hpv' ? 'prevencao' : indicator === 'mortality' ? 'panorama' : 'deteccao';
  // The state is framed above the collapsed sheet: under an open one, it waits for the sheet to come down.
  let frameOnCollapse = false;
  const frame = (code: string) => {
    frameOnCollapse = isSheet() && !panel.hasAttribute('data-collapsed');
    if (!frameOnCollapse) map.focus(code);
  };
  const expand = (expanded: boolean) => {
    panel.toggleAttribute('data-collapsed', !expanded);
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.setAttribute('aria-label', expanded ? 'Recolher Meu município' : 'Expandir Meu município');
    if (!expanded) panel.scrollTop = 0;
    syncSheetMetrics();
    if (!expanded && frameOnCollapse && selected) frame(selected.code);
  };
  toggle.onclick = () => expand(toggle.getAttribute('aria-expanded') !== 'true');
  // The whole collapsed sheet opens it; what is inside keeps its own action.
  panel.addEventListener('click', event => {
    if (!isSheet() || !panel.hasAttribute('data-collapsed') || !(event.target instanceof Element) || event.target.closest('button, a, select')) return;
    expand(true);
  });
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
  let frameOnRender = false;
  const render = ({ html, profile }: { html: string; profile: UfProfile }) => {
    if (!selected) return;
    const region = listing.immediate_regions[selected.immediate_region];
    const result = panelResult(selected, profile, state, region);
    renderResult(resultBlock, result);
    panelType.hidden = false;
    panelTypeSelect.value = state.cancerType;
    panelLegend.dataset.reading = state.mode;
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
      const axisId = ['acesso', 'deteccao', 'prevencao', 'panorama'].includes(initialAnchor)
        ? initialAnchor : initialAnchor.startsWith('tipo-') ? 'acesso' : axisFor(state.indicator);
      for (const axis of content.querySelectorAll<HTMLDetailsElement>('[data-profile-axis]')) axis.open = axis.id === axisId;
      shownIndicator = state.indicator;
      initialAnchor = '';
    }
    status.textContent = resultAnnouncement(`${selected.name} (${selected.uf})`, result);
    // The sheet of a new selection has its final height only now, and the state must be framed above it.
    if (frameOnRender) { frameOnRender = false; if (isSheet()) frame(selected.code); }
  };
  const navigation = createMunicipalityNavigation({
    places: listing.municipalities,
    getUrl: () => new URL(location.href),
    setUrl: url => { history.pushState(null, '', url); window.dispatchEvent(new Event('navigation-state-change')); },
    focus: place => {
      const changed = selected?.code !== place.code;
      selected = place;
      heading.textContent = `${place.name} (${place.uf})`;
      for (const button of [toggle, clear, panelLegend]) button.hidden = false;
      if (changed) {
        panel.hidden = false;
        resultBlock.removeAttribute('data-kind');
        resultBlock.textContent = 'Carregando o resultado…';
        panelType.hidden = true;
        content.replaceChildren();
        shownCode = '';
        frameOnCollapse = false;
        frameOnRender = true;
        expand(!isSheet());
      }
      frame(place.code);
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
      panel.hidden = true;
      panelLegend.hidden = true;
      selected = undefined;
      content.replaceChildren();
      shownCode = '';
      resultBlock.replaceChildren();
      status.textContent = '';
      syncSheetMetrics();
      map.focus(undefined);
    },
  });
  const failed = (error: unknown) => {
    console.error(error);
    content.replaceChildren();
    resultBlock.replaceChildren();
    panelType.hidden = true;
    shownCode = '';
    // What can be done about it is inside: a collapsed sheet would hide the retry button.
    expand(true);
    status.textContent = 'Não foi possível carregar a consulta municipal. Isso não significa dado insuficiente.';
    const note = document.createElement('p');
    note.textContent = status.textContent;
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Tentar carregar a consulta novamente';
    retry.onclick = () => { if (selected) void navigation.select(selected, false).catch(failed); };
    content.append(note, retry);
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
    if (!link || link.pathname !== location.pathname) return;
    for (const axis of content.querySelectorAll<HTMLDetailsElement>('[data-profile-axis]')) if (`#${axis.id}` === link.hash) axis.open = true;
  });
  const select = (place: MunicipalityListing['municipalities'][number], focusAfterwards: HTMLElement = input) => {
    returnFocus = focusAfterwards;
    void navigation.select(place).catch(failed);
  };
  const selectFromSearch = (place: MunicipalityListing['municipalities'][number]) => {
    results.replaceChildren();
    select(place);
    heading.focus();
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
    select(place, link);
    if (isSheet()) panel.scrollTop = 0;
  });
  window.addEventListener('municipality-map-select', event => {
    const code = (event as CustomEvent<string>).detail;
    const place = listing.municipalities.find(place => place.code === code);
    if (!place) return;
    select(place);
    // In flow the panel is further down the page; on a sheet or beside the map it is already in view.
    if (!isSheet() && matchMedia('(max-width: 767px)').matches) panel.scrollIntoView({ block: 'start' });
  });
  return (nextLayer: IndicatorLayer | undefined, nextState: MapState) => {
    void nextLayer;
    state = nextState;
    panelLegend.dataset.reading = state.mode;
    void Promise.resolve(navigation.restore()).catch(failed);
  };
}
