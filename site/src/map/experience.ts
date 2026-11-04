import { mountMunicipalityNavigation } from "../map/navigation-view";
import { mountIndicatorTable } from "../map/indicator-table";
import { updateLegend } from '../map/legend';
import {
  CANCER_TYPES,
  INDICATORS,
  mapOption,
  cancerTypeNotes,
  noStatusNote,
  type IndicatorLayer,
  type MunicipalityListing,
} from "../map/indicator-layer";

import { normalizeMapState, readMapState, writeMapState, type MapState } from "../map/map-state";

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} request failed (${response.status})`);
  return response.json() as Promise<T>;
}

const container = document.querySelector<HTMLElement>(".map[data-mesh-url]");
const status = document.querySelector<HTMLElement>(".map-status");
const table = document.querySelector<HTMLElement>(".indicator-table");
const selector = document.querySelector<HTMLSelectElement>("#cancer-type");
const indicatorSelector = document.querySelector<HTMLSelectElement>('#map-indicator');
const readingSelector = document.querySelector<HTMLSelectElement>('#map-reading');
const notes = document.querySelector<HTMLElement>("#cancer-type-note");

/** One request per cancer type: switching back reuses the layer already loaded. */
const layers = new Map<string, Promise<IndicatorLayer | undefined>>();
function layerOf(state: MapState): Promise<IndicatorLayer | undefined> {
  const key = `${state.indicator}/${state.cancerType}`;
  let layer = layers.get(key);
  if (!layer) {
    layer = fetch(`${container!.dataset.layersUrl}${key}.json`).then(response => {
      if (response.status === 404) { layers.delete(key); return undefined; }
      if (!response.ok) throw new Error(`Layer request failed (${response.status})`);
      return response.json() as Promise<IndicatorLayer>;
    });
    layer.catch(() => layers.delete(key));
    layers.set(key, layer);
  }
  return layer;
}

function showNotes(layer: IndicatorLayer): void {
  const caveat = document.querySelector<HTMLElement>('#indicator-caveat');
  if (caveat) {
    caveat.textContent = !layer.has_status ? noStatusNote(layer) : layer.indicator === 'hpv' ? 'Série curta, ainda sem direção: o HPV tem apenas Situação.' : '';
    caveat.hidden = !caveat.textContent;
  }
  if (!notes) return;
  notes.replaceChildren(
    ...cancerTypeNotes(layer).map((text) => {
      const note = document.createElement("p");
      note.textContent = text;
      return note;
    }),
  );
}

if (container && status) {
  const { meshUrl, listingUrl } = container.dataset;
  const initial = readMapState(new URLSearchParams(location.search));
  const dataStatus = document.querySelector<HTMLElement>('#data-status')!;
  const retry = document.querySelector<HTMLButtonElement>('#retry-data')!;
  let started = false;
  const start = async () => {
    retry.hidden = true;
    dataStatus.textContent = 'Carregando a lista de municípios…';
    await getJson<MunicipalityListing>(listingUrl!)
    .then((listing) => {
      started = true;
      let showOnMap = (_layer: IndicatorLayer | undefined, _mode: MapState['mode']) => {};
      let mapLayer: IndicatorLayer | undefined;
      let mapState = initial;
      let selectOnMap = (_code: string | undefined) => {};
      const mapSelection = { focus: (code: string | undefined) => selectOnMap(code) };
      if (table) table.hidden = false;
      const showInTable = table ? mountIndicatorTable(table, listing) : () => {};
      const notice = document.querySelector<HTMLElement>("#map-selection-notice");
      let updatePreview = (_layer: IndicatorLayer | undefined, _state: MapState) => {};
      let current = initial;
      let request = 0;
      const syncControls = (state: MapState) => {
        if (selector) selector.value = state.cancerType;
        if (indicatorSelector && readingSelector) {
          indicatorSelector.value = state.indicator;
          readingSelector.value = state.mode;
          for (const option of indicatorSelector.options) {
            const modes = [...new Set(Object.values(INDICATORS[option.value]!.modes).flat())];
            const choices = modes.map(mode => mapOption(option.value, state.cancerType, mode, option.dataset.pending === 'true'));
            option.disabled = choices.every(choice => choice.disabled);
            option.textContent = INDICATORS[option.value]!.name + (option.disabled ? ' — indisponível para esta seleção' : '');
          }
          for (const option of readingSelector.options) {
            const presentation = mapOption(state.indicator, state.cancerType, option.value as MapState['mode']);
            option.disabled = presentation.disabled;
          }
        }
      };
      const show = (shown: IndicatorLayer | undefined, state: MapState, push = false) => {
        current = state;
        syncControls(state);
        document.querySelector('#map-indicator-heading')!.textContent = INDICATORS[state.indicator]!.name;
        mapLayer = shown;
        mapState = state;
        showOnMap(shown, state.mode);
        const legend = document.querySelector<HTMLElement>('.legend')!;
        legend.hidden = !shown;
        if (shown) { updateLegend(legend, shown, state.mode); showNotes(shown); }
        else {
          notes?.replaceChildren();
          const caveat = document.querySelector<HTMLElement>('#indicator-caveat');
          if (caveat) { caveat.textContent = ''; caveat.hidden = true; }
        }
        const url = new URL(location.href);
        url.search = writeMapState(state, url.searchParams).toString();
        if (push) history.pushState(null, "", url);
        else history.replaceState(null, "", url);
        window.dispatchEvent(new Event('navigation-state-change'));
        showInTable(shown, state.mode);
        updatePreview(shown, state);
      };
      const showAvailability = (available: boolean) => {
        dataStatus.textContent = available ? '' : 'Os dados desta seleção não estão disponíveis. Busque um município ou use o índice por UF para acessar sua ficha.';
        retry.hidden = available;
      };
      const selectState = async (next: MapState, message = "", push = true) => {
        const pending = ++request;
        show(undefined, next, push);
        dataStatus.textContent = 'Carregando os dados desta seleção…';
        retry.hidden = true;
        if (notice) notice.hidden = true;
        try {
          const nextLayer = await layerOf(next);
          if (pending !== request) return;
          show(nextLayer, next);
          showAvailability(!!nextLayer);
          if (notice) {
            notice.textContent = message;
            notice.hidden = !message;
          }
        } catch (error) {
          if (pending !== request) return;
          console.error(error);
          show(undefined, next);
          dataStatus.textContent = 'Não foi possível carregar os dados desta seleção. Tente novamente ou acesse uma ficha pela busca ou pelo índice por UF.';
          retry.hidden = false;
        }
      };
      updatePreview = mountMunicipalityNavigation(mapSelection, listing, listingUrl!.replace(/\/municipalities.json$/, ""));
      void selectState(initial, '', false);
      retry.onclick = () => { void selectState(current, '', false); };
      // Loading the optional renderer never gates the text alternatives.
      void import('../map/municipality-map').then(async renderer => {
        const map = await renderer.mountMunicipalityMap(container, meshUrl!);
        showOnMap = renderer.mountIndicatorPaint(map, listing);
        showOnMap(mapLayer, mapState.mode);
        selectOnMap = code => code ? renderer.focusMunicipality(map, code) : renderer.clearMunicipality(map);
        selectOnMap(new URLSearchParams(location.search).get('municipio') ?? undefined);
        renderer.onMunicipalityClick(map, code => {
          window.dispatchEvent(new CustomEvent('municipality-map-select', { detail: code }));
        });
        status.hidden = true;
      }).catch(error => {
        console.error(error);
        status.hidden = false;
        status.textContent = 'Não foi possível carregar o mapa. A busca, a tabela e o índice por UF continuam disponíveis.';
      });
      for (const control of [indicatorSelector, readingSelector]) {
        if (!control) continue;
        control.disabled = false;
        control.addEventListener('change', () => {
          void selectState(normalizeMapState({ indicator: indicatorSelector!.value, mode: readingSelector!.value, cancerType: current.cancerType }));
        });
      }
      if (selector) {
        selector.disabled = false;
        selector.addEventListener("change", () => {
          const { indicator, mode } = current;
          const next = normalizeMapState({ indicator, mode, cancerType: selector.value });
          const message = next.indicator !== indicator
            ? `${INDICATORS[indicator!]?.name} não se aplica a ${CANCER_TYPES[next.cancerType]}; mostrando até 60 dias.` : "";
          void selectState(next, message);
        });
      }
      window.addEventListener("popstate", () => {
        void selectState(readMapState(new URLSearchParams(location.search)), "", false);
      });
    })
    .catch((error: unknown) => {
      console.error(error);
      dataStatus.textContent = 'Não foi possível carregar a lista de municípios. Tente novamente ou use o índice por UF abaixo.';
      retry.hidden = false;
    });
  };
  retry.onclick = () => { if (!started) void start(); };
  void start();
}
