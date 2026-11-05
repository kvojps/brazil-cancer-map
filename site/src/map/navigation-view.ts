import { type IndicatorLayer, type MunicipalityListing } from './indicator-layer';
import { readMapState, type MapState } from './map-state';
import type { UfProfile } from '../profile/profile';
import { municipalityPath } from '../profile/profile';
import { createMunicipalityNavigation, searchMunicipalities } from './navigation';

export function mountMunicipalityNavigation(map: { focus: (code: string | undefined) => void }, listing: MunicipalityListing, dataBase: string): (layer: IndicatorLayer | undefined, state: MapState) => void {
  const initialUrl = new URL(location.href);
  const initialPlace = listing.municipalities.find(place => municipalityPath(place) === initialUrl.pathname)
    ?? listing.municipalities.find(place => place.code === initialUrl.searchParams.get('municipio'));
  initialUrl.searchParams.delete('municipio');
  if (initialPlace) initialUrl.pathname = municipalityPath(initialPlace);
  history.replaceState(null, '', initialUrl);
  const panel = document.querySelector<HTMLElement>('#municipality-preview')!;
  panel.dataset.enhanced = '';
  const input = document.querySelector<HTMLInputElement>('#municipality-search')!;
  const results = document.querySelector<HTMLElement>('#municipality-results')!;
  const status = document.querySelector<HTMLElement>('#search-status')!;
  const profiles = new Map<string, Promise<UfProfile>>();
  const content = panel.querySelector<HTMLElement>('[data-preview-content]')!;
  const summary = panel.querySelector<HTMLElement>('[data-profile-summary]')!;
  const heading = panel.querySelector<HTMLElement>('#preview-heading')!;
  const toggle = panel.querySelector<HTMLButtonElement>('[data-toggle-profile]')!;
  const collapse = panel.querySelector<HTMLButtonElement>('[data-collapse-profile]')!;
  const clear = panel.querySelector<HTMLButtonElement>('[data-clear-profile]')!;
  const reopen = document.querySelector<HTMLButtonElement>('[data-reopen-profile]')!;
  const shortcut = document.querySelector<HTMLElement>('[data-preview-shortcut]')!;
  const documents = new Map<string, Promise<string>>();
  const initialProfile = content.querySelector<HTMLElement>('.profile');
  if (initialProfile) documents.set(initialProfile.dataset.code!, Promise.resolve(initialProfile.outerHTML));
  let selected: MunicipalityListing['municipalities'][number] | undefined;
  let state: MapState = readMapState(new URLSearchParams(location.search));
  let shownCode = '';
  let shownIndicator = '';
  let initialAnchor = location.hash.slice(1);
  let returnFocus: HTMLElement = input;
  const restoreFocus = () => {
    const target = returnFocus.isConnected && !returnFocus.closest('[hidden]') ? returnFocus : input;
    target.focus({ preventScroll: true });
  };
  const axisFor = (indicator: string) => indicator === 'within_60_days' ? 'acesso' : indicator === 'hpv' ? 'prevencao' : indicator === 'mortality' ? 'panorama' : 'deteccao';
  const expand = (expanded: boolean) => {
    panel.toggleAttribute('data-collapsed', !expanded);
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.textContent = expanded ? 'Recolher consulta' : 'Expandir consulta';
  };
  const open = () => {
    panel.hidden = false;
    reopen.hidden = true;
    heading.focus({ preventScroll: true });
    panel.scrollIntoView({ block: 'nearest' });
  };
  toggle.onclick = () => expand(toggle.getAttribute('aria-expanded') !== 'true');
  collapse.onclick = () => {
    panel.hidden = true;
    reopen.hidden = false;
    restoreFocus();
  };
  reopen.onclick = open;
  shortcut.addEventListener('click', event => { event.preventDefault(); open(); });
  const render = ({ html, profile }: { html: string; profile: UfProfile }) => {
    if (!selected) return;
    const indicators = { within_60_days: profile.indicators.within_60_days, mammography: profile.indicators.mammography, cytopathology: profile.indicators.cytopathology, hpv: profile.indicators.hpv, mortality: profile.indicators.mortality };
    const data = indicators[state.indicator as keyof typeof indicators]?.[state.cancerType];
    const entry = data?.municipalities[selected.code];
    summary.textContent = data && entry
      ? 'Consulta pronta: quatro Eixos com resultados, ressalvas e Ações.'
      : 'Os dados deste indicador não estão disponíveis. Expanda para consultar os demais Eixos e Ações.';
    if (!selected) return;
    if (shownCode !== selected.code || !content.querySelector('.profile')) {
      const document = new DOMParser().parseFromString(html, 'text/html');
      const profile = document.querySelector<HTMLElement>('.profile');
      if (!profile) throw new Error('Municipal profile is missing');
      profile.querySelector('[data-close-profile]')?.parentElement?.remove();
      profile.querySelector('[data-profile-heading]')?.remove();
      profile.querySelector('.profile-axes')?.remove();
      content.replaceChildren(profile);
      shownCode = selected.code;
      shownIndicator = '';
    }
    for (const link of content.querySelectorAll<HTMLAnchorElement>('[data-profile-type]')) link.href = `${municipalityPath(selected)}?tipo=${link.dataset.profileType}#tipo-${link.dataset.profileType}`;
    for (const section of content.querySelectorAll<HTMLElement>('[data-cancer-type]')) section.hidden = section.dataset.cancerType !== state.cancerType;
    for (const link of content.querySelectorAll<HTMLElement>('[data-profile-type]')) {
      if (link.dataset.profileType === state.cancerType) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
    if (shownIndicator !== state.indicator) {
      for (const axis of content.querySelectorAll<HTMLDetailsElement>('[data-profile-axis]')) axis.open = axis.id === (['acesso', 'deteccao', 'prevencao', 'panorama'].includes(initialAnchor) ? initialAnchor : initialAnchor.startsWith('tipo-') ? 'acesso' : axisFor(state.indicator));
      shownIndicator = state.indicator;
      initialAnchor = '';
    }
  };
  const navigation = createMunicipalityNavigation({
    places: listing.municipalities,
    getUrl: () => new URL(location.href),
    setUrl: url => { history.pushState(null, '', url); window.dispatchEvent(new Event('navigation-state-change')); },
    focus: place => {
      const changed = selected?.code !== place.code;
      selected = place;
      heading.textContent = `${place.name} (${place.uf})`;
      shortcut.hidden = false;
      for (const button of [toggle, collapse, clear]) button.hidden = false;
      if (changed) {
        panel.hidden = false;
        reopen.hidden = true;
        summary.textContent = 'Carregando a consulta municipal…';
        content.replaceChildren();
        shownCode = '';
        expand(!matchMedia('(max-width: 767px)').matches);
      }
      map.focus(place.code);
      status.textContent = `${place.name} (${place.uf}) selecionado. Consulta disponível após os controles.`;
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
    show: result => {
      render(result);
      status.textContent = `${selected!.name} (${selected!.uf}): consulta municipal atualizada.`;
    },
    clear: () => {
      panel.hidden = true;
      shortcut.hidden = true;
      reopen.hidden = true;
      selected = undefined;
      content.replaceChildren();
      shownCode = '';
      summary.textContent = '';
      status.textContent = '';
      map.focus(undefined);
    },
  });
  const failed = (error: unknown) => {
    console.error(error);
    content.replaceChildren();
    summary.textContent = '';
    shownCode = '';
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
  content.addEventListener('click', event => {
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('[data-profile-type]') : null;
    if (!link || (event as MouseEvent).ctrlKey || (event as MouseEvent).metaKey || (event as MouseEvent).shiftKey || (event as MouseEvent).altKey) return;
    event.preventDefault();
    const selector = document.querySelector<HTMLSelectElement>('#cancer-type')!;
    selector.value = link.dataset.profileType!;
    selector.dispatchEvent(new Event('change'));
  });
  const select = (place: MunicipalityListing['municipalities'][number]) => {
    returnFocus = input;
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
      const link = document.createElement('a');
      link.textContent = `Abrir consulta: ${place.name} (${place.uf})`;
      link.href = municipalityPath(place);
      item.append(button, ' ', link);
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
  document.querySelector('.indicator-table')!.addEventListener('click', event => {
    const click = event as MouseEvent;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('tbody a') : null;
    if (!link || click.ctrlKey || click.metaKey || click.shiftKey || click.altKey || click.button !== 0) return;
    const place = listing.municipalities.find(place => municipalityPath(place) === new URL(link.href).pathname);
    if (!place) return;
    event.preventDefault();
    returnFocus = link;
    void navigation.select(place).catch(failed);
  });
  window.addEventListener('municipality-map-select', event => {
    const code = (event as CustomEvent<string>).detail;
    const place = listing.municipalities.find(place => place.code === code);
    if (place) select(place);
  });
  return (nextLayer: IndicatorLayer | undefined, nextState: MapState) => {
    void nextLayer;
    state = nextState;
    void Promise.resolve(navigation.restore()).catch(failed);
  };
}
