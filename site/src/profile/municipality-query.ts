import type { MunicipalityListing } from '../map/indicator-layer.ts';
import { sameMapState, type MapState } from '../map/map-state.ts';
import type { UfProfile } from './profile.ts';

type Municipality = MunicipalityListing['municipalities'][number];
interface Content { html: string; profile: UfProfile }
interface Selection { place: Municipality; pending?: Promise<void>; content?: Content }

/** Where the visitor left the municipal panel on a history entry. */
export interface MunicipalityContext {
  code: string;
  axis: string;
  readingTop: number;
  panelTop: number;
  barTop: number;
}

export type ReadingDestination =
  | { axis: string; source: 'saved'; position?: MunicipalityContext }
  | { axis: string; source: 'anchor' | 'indicator'; position: boolean };

function axisFor(indicator: string): string {
  if (indicator === 'within_60_days') return 'acesso';
  if (indicator === 'hpv') return 'prevencao';
  if (indicator === 'mortality') return 'panorama';
  return 'deteccao';
}

function axisOfAnchor(anchor: string | undefined): string | undefined {
  if (anchor?.startsWith('tipo-')) return 'acesso';
  if (anchor && ['acesso', 'deteccao', 'prevencao', 'panorama'].includes(anchor)) return anchor;
}

function indicatorReading(state: MapState, position = false): ReadingDestination {
  return { axis: axisFor(state.indicator), source: 'indicator', position };
}

interface QueryOptions {
  initialDocument?: { code: string; html: string };
  loadDocument(place: Municipality): Promise<string>;
  loadProfile(uf: string): Promise<UfProfile>;
  selectionChanged(place: Municipality | undefined): void;
  filtersChanged(): void;
  render(place: Municipality, content: Content, state: MapState): void;
  read(destination: ReadingDestination): void;
  rendered(): void;
  failed(error: unknown): void;
}

function loadCached<K, T>(cache: Map<K, Promise<T>>, key: K, load: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached) return cached;
  const pending = load();
  cache.set(key, pending);
  void pending.catch(() => cache.delete(key));
  return pending;
}

/** The selection and filters of Meu município, with its own municipal document and UF profile. */
export function createMunicipalityQuery(initial: MapState, options: QueryOptions) {
  const documents = new Map<string, Promise<string>>();
  const profiles = new Map<string, Promise<UfProfile>>();
  if (options.initialDocument) {
    const { code, html } = options.initialDocument;
    documents.set(code, Promise.resolve(html));
  }
  let state = initial;
  let selection: Selection | undefined;
  let destination: ReadingDestination | undefined;
  let arrival = 0;

  const setReading = (next: ReadingDestination | undefined) => {
    arrival++;
    destination = next;
  };

  const read = () => {
    const next = destination;
    destination = undefined;
    if (next) options.read(next);
  };

  const present = (current: Selection, content: Content) => {
    try {
      options.render(current.place, content, state);
      current.content = content;
      read();
      options.rendered();
    } catch (error) {
      // An unusable profile must be fetched again on retry.
      profiles.delete(current.place.uf);
      current.content = undefined;
      setReading(undefined);
      options.failed(error);
    }
  };

  const load = (current: Selection) => {
    const { place } = current;
    const profile = loadCached(profiles, place.uf, () => options.loadProfile(place.uf));
    const document = loadCached(documents, place.code, () => options.loadDocument(place));
    current.pending = Promise.all([document, profile]).then(([html, profile]) => {
      if (selection !== current) return;
      current.pending = undefined;
      present(current, { html, profile });
    }, error => {
      if (selection !== current) return;
      current.pending = undefined;
      setReading(undefined);
      options.failed(error);
    });
    return current.pending;
  };

  const applySelection = (place: Municipality | undefined, next: MapState) => {
    const changed = !sameMapState(state, next);
    state = next;
    if (place?.code === selection?.place.code) {
      if (!selection) return;
      if (changed) options.filtersChanged();
      if (selection.content) {
        if (changed) present(selection, selection.content);
        else read();
      }
      return selection?.pending;
    }
    selection = place && { place };
    options.selectionChanged(place);
    return selection && load(selection);
  };

  const apply = (place: Municipality | undefined, next: MapState) => {
    if (place?.code !== selection?.place.code) {
      setReading(place && indicatorReading(next));
    } else if (place && next.indicator !== state.indicator) {
      setReading(indicatorReading(next, !!selection?.content));
    }
    return applySelection(place, next);
  };

  return {
    get place() { return selection?.place; },
    get state() { return state; },
    apply,
    select(place: Municipality) {
      setReading(indicatorReading(state));
      return applySelection(place, state);
    },
    restore(place: Municipality | undefined, next: MapState, { anchor, saved }: { anchor?: string; saved?: MunicipalityContext }) {
      const axis = axisOfAnchor(anchor);
      if (!place) setReading(undefined);
      else if (saved?.code === place.code) setReading({ axis: saved.axis, source: 'saved', position: saved });
      else if (axis) setReading({ axis, source: 'anchor', position: true });
      else setReading(indicatorReading(next));
      return applySelection(place, next);
    },
    update(next: MapState) { return apply(selection?.place, next); },
    readIndicator() {
      setReading(indicatorReading(state));
      if (selection?.content) read();
    },
    cancelArrival({ dismissAnchor = false } = {}) {
      arrival++;
      if (!destination) return;
      if (destination.source === 'saved') destination = { ...destination, position: undefined };
      else if (dismissAnchor && destination.source === 'anchor') destination = indicatorReading(state);
      else destination = { ...destination, position: false };
    },
    guardArrival(callback: () => void) {
      const current = arrival;
      return () => { if (current === arrival) callback(); };
    },
    retry() {
      if (selection && !selection.pending && !selection.content) {
        setReading(indicatorReading(state));
        return load(selection);
      }
    },
  };
}
