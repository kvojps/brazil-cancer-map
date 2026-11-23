import type { MunicipalityListing } from '../map/indicator-layer.ts';
import { sameMapState, type MapState } from '../map/map-state.ts';
import type { UfProfile } from './profile.ts';

type Municipality = MunicipalityListing['municipalities'][number];
interface Content { html: string; profile: UfProfile }
interface Selection { place: Municipality; pending?: Promise<void>; content?: Content }

interface QueryOptions {
  initialDocument?: { code: string; html: string };
  loadDocument(place: Municipality): Promise<string>;
  loadProfile(uf: string): Promise<UfProfile>;
  selectionChanged(place: Municipality | undefined): void;
  filtersChanged(): void;
  render(place: Municipality, content: Content, state: MapState): void;
  /** The current content is in the document, possibly reused from an earlier render. */
  contentReady(): void;
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
  const present = (current: Selection, content: Content) => {
    try {
      options.render(current.place, content, state);
    } catch (error) {
      // An unusable profile must be fetched again on retry.
      profiles.delete(current.place.uf);
      current.content = undefined;
      options.failed(error);
      return;
    }
    current.content = content;
    options.contentReady();
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
      options.failed(error);
    });
    return current.pending;
  };

  const apply = (place: Municipality | undefined, next: MapState) => {
    const changed = !sameMapState(state, next);
    state = next;
    if (place?.code === selection?.place.code) {
      if (!selection) return;
      if (changed) options.filtersChanged();
      if (selection.content) {
        if (changed) present(selection, selection.content);
        else options.contentReady();
      }
      return selection.pending;
    }
    selection = place && { place };
    options.selectionChanged(place);
    return selection && load(selection);
  };

  return {
    get place() { return selection?.place; },
    get state() { return state; },
    apply,
    retry() {
      if (selection && !selection.pending && !selection.content) {
        return load(selection);
      }
    },
  };
}
