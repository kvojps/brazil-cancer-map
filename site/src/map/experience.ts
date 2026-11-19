import { createHomeAddress, type Navigation } from './address';
import { mountSeriesCharts } from '../profile/series-chart';
import { mountMobileLayout } from '../shared/mobile-layout';
import { mountVisualization, type ViewContext } from './view';
import { mountMunicipalityNavigation, type MunicipalityContext } from "../map/navigation-view";
import { mountIndicatorTable, type ListContext } from "../map/indicator-table";
import { updateLegend, updateLegendCorner } from '../map/legend';
import { createMapCamera } from './camera';
import {
  CANCER_TYPES,
  INDICATORS,
  mapOption,
  cancerTypeNotes,
  noStatusNote,
  type IndicatorLayer,
  type MunicipalityListing,
} from "../map/indicator-layer";

import { filterSummary, normalizeMapState, sameMapState, type MapState } from "../map/map-state";

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
const legendCorner = document.querySelector<HTMLElement>('.legend-corner');
const mapNotes = document.querySelector<HTMLElement>('.map-notes');
const filtersToggle = document.querySelector<HTMLElement>('.filters-toggle');
const filterSummaryText = document.querySelector<HTMLElement>('[data-filter-summary]');

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
    // With a municipality selected, the panel carries this caveat in full.
    caveat.toggleAttribute('data-in-panel', layer.indicator === 'within_60_days' && !layer.has_status);
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

/** The reading context each part of the home map leaves on a history entry. */
interface ReadingContexts { view: ViewContext; list: ListContext; municipality: MunicipalityContext }

if (container && status) {
  const address = createHomeAddress<ReadingContexts>();
  mountSeriesCharts();
  mountMobileLayout();
  const visualization = mountVisualization(address);
  // The map state the address asks for, applied once the listing has loaded.
  let requested: MapState | undefined;
  let arrivalAnchor = '';
  let applyMapState = (_navigation: Navigation<ReadingContexts>) => {};
  let restoreList = (_context: ListContext | undefined) => {};
  let restoreMunicipality = (_context: MunicipalityContext | undefined) => {};
  // The parts are applied in this order: map state, visualization, then each reading context.
  address.listen(navigation => {
    const { cause, view, context } = navigation;
    requested = navigation.mapState;
    if (cause === 'initial') arrivalAnchor = navigation.anchor;
    applyMapState(navigation);
    if (cause === 'back') visualization.restore(context.view);
    visualization.show(view);
    if (cause !== 'back') return;
    restoreList(context.list);
    restoreMunicipality(context.municipality);
  });
  const { meshUrl, listingUrl } = container.dataset;
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
      const initial = requested!;
      let mapLayer: IndicatorLayer | undefined;
      let mapState = initial;
      // The camera keeps the intentions until a map is attached to it.
      const camera = createMapCamera();
      const indicatorTable = table ? mountIndicatorTable(table, listing, address) : undefined;
      if (indicatorTable) restoreList = indicatorTable.restoreReading;
      const notice = document.querySelector<HTMLElement>("#map-selection-notice");
      let updatePreview = (_layer: IndicatorLayer | undefined, _state: MapState) => {};
      let current = initial;
      let request = 0;
      const syncControls = (state: MapState) => {
        if (selector) selector.value = state.cancerType;
        if (filterSummaryText) filterSummaryText.textContent = filterSummary(state);
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
      const show = (shown: IndicatorLayer | undefined, state: MapState) => {
        current = state;
        syncControls(state);
        document.querySelector('#map-indicator-heading')!.textContent = INDICATORS[state.indicator]!.name;
        mapLayer = shown;
        mapState = state;
        showOnMap(shown, state.mode);
        const legend = document.querySelector<HTMLElement>('.legend')!;
        legend.hidden = !shown;
        legendCorner!.hidden = !shown;
        if (shown) { updateLegend(legend, shown, state.mode); updateLegendCorner(legendCorner!, shown, state.mode); showNotes(shown); }
        else {
          notes?.replaceChildren();
          const caveat = document.querySelector<HTMLElement>('#indicator-caveat');
          if (caveat) { caveat.textContent = ''; caveat.hidden = true; }
        }
        // The legend reserves its area only once a layer has filled it.
        camera.layerShown(!!shown);
        window.dispatchEvent(new Event('navigation-state-change'));
        indicatorTable?.show(shown, state.mode);
        updatePreview(shown, state);
      };
      const showAvailability = (available: boolean) => {
        dataStatus.textContent = available ? '' : 'Os dados desta seleção não estão disponíveis. Busque um município ou use o índice por UF para acessar sua ficha.';
        retry.hidden = available;
      };
      const selectState = async (next: MapState, message = "") => {
        const pending = ++request;
        show(undefined, next);
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
      const municipalityNavigation = mountMunicipalityNavigation(camera, listing, listingUrl!.replace(/\/municipalities.json$/, ""), address, arrivalAnchor);
      updatePreview = municipalityNavigation.update;
      restoreMunicipality = municipalityNavigation.restoreReading;
      /** The notice when the cancer type chosen leaves the indicator shown without data. */
      const incompatibility = (previous: MapState, next: MapState) => next.indicator !== previous.indicator
        ? `${INDICATORS[previous.indicator]?.name} não se aplica a ${CANCER_TYPES[next.cancerType]}; mostrando até 60 dias.` : '';
      applyMapState = ({ cause, mapState: next }) => {
        if (cause !== 'reset' && sameMapState(next, current)) updatePreview(mapLayer, current);
        else void selectState(next, cause === 'hash' ? incompatibility(current, next) : '');
        if (cause === 'reset') camera.resetCountry();
      };
      const choose = (next: MapState, message = '') => {
        address.setMapState(next);
        void selectState(next, message);
      };
      void selectState(initial);
      retry.onclick = () => { void selectState(current); };
      document.querySelector<HTMLAnchorElement>('.identity')!.addEventListener('click', event => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        const link = event.currentTarget as HTMLAnchorElement;
        // The brand has a native destination too; only a ready dashboard handles it in place.
        address.reset(link.href);
        link.focus({ preventScroll: true });
      });
      let resizing = false;
      window.addEventListener('resize', () => {
        if (resizing) return;
        resizing = true;
        requestAnimationFrame(() => {
          resizing = false;
          camera.layoutChanged();
        });
      });
      // Loading the optional renderer never gates the text alternatives.
      const loadMap = () => {
        status.hidden = false;
        status.textContent = 'Carregando o mapa…';
        void import('../map/municipality-map').then(async renderer => {
          const map = await renderer.mountMunicipalityMap(container, meshUrl!);
          showOnMap = renderer.mountIndicatorPaint(map, listing);
          showOnMap(mapLayer, mapState.mode);
          const overlays = { legend: legendCorner, note: mapNotes, controls: filtersToggle, floor: [document.querySelector<HTMLElement>('#municipality-preview'), document.querySelector<HTMLElement>('.view-controls')] };
          map.on('resize', () => camera.mapResized());
          camera.attach(renderer.createCameraRenderer(map, overlays));
          renderer.onMunicipalityClick(map, code => {
            window.dispatchEvent(new CustomEvent('municipality-map-select', { detail: code }));
          });
          status.hidden = true;
        }).catch(error => {
          console.error(error);
          status.hidden = false;
          status.textContent = 'Não foi possível carregar o mapa. A busca, a lista e o índice por UF continuam disponíveis.';
          const retryMap = document.createElement('button');
          retryMap.type = 'button';
          retryMap.textContent = 'Tentar mapa novamente';
          retryMap.onclick = loadMap;
          status.append(' ', retryMap);
        });
      };
      loadMap();
      for (const control of [indicatorSelector, readingSelector]) {
        if (!control) continue;
        control.disabled = false;
        control.addEventListener('change', () => {
          choose(normalizeMapState({ indicator: indicatorSelector!.value, mode: readingSelector!.value, cancerType: current.cancerType }));
        });
      }
      if (selector) {
        selector.disabled = false;
        selector.addEventListener("change", () => {
          const next = normalizeMapState({ indicator: current.indicator, mode: current.mode, cancerType: selector.value });
          choose(next, incompatibility(current, next));
        });
      }
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
