/**
 * The Address of the home map: the URL and the history entry, with the reading context
 * each part leaves on an entry. The home map writes its history entries through it.
 */

import { CANCER_TYPES } from './indicator-layer.ts';
import { MAP_STATE_PARAMS, readMapState, writeMapState, type MapState } from './map-state.ts';

export type EntryState = Record<string, unknown> | null;

/** The history the Address writes to: the browser's in production, an in-memory one in tests. */
export interface AddressHistory {
  readonly url: string;
  readonly state: EntryState;
  push(state: EntryState, url: string | URL): void;
  replace(state: EntryState, url: string | URL): void;
  back(): void;
  /** Called when the visitor moves to another entry: Back, Forward or a hash navigation. */
  onPopState(listener: () => void): void;
}

/** The visualization of the home map: the map itself or its List. */
export type View = 'map' | 'list';

const VIEW_PARAM = 'visualizacao';

/** The visualization a home map address asks for: anything but the List is the map. */
export function viewOf(url: URL): View {
  return url.searchParams.get(VIEW_PARAM) === 'lista' ? 'list' : 'map';
}

function withView(url: URL, view: View): URL {
  if (view === 'list') url.searchParams.set(VIEW_PARAM, 'lista');
  else url.searchParams.delete(VIEW_PARAM);
  return url;
}

const TYPE_ANCHOR = '#tipo-';

/** The map state an address asks for: a `#tipo-` link names the cancer type; invalid or incompatible choices are corrected. */
export function mapStateOf(url: URL): MapState {
  const params = new URLSearchParams(url.searchParams);
  const anchored = anchoredType(url);
  if (anchored) params.set('tipo', anchored);
  return readMapState(params);
}

/** The cancer type a `#tipo-` link names, if it names a known one. */
function anchoredType(url: URL): string | undefined {
  const type = url.hash.startsWith(TYPE_ANCHOR) ? decodeURIComponent(url.hash.slice(TYPE_ANCHOR.length)) : '';
  return Object.hasOwn(CANCER_TYPES, type) ? type : undefined;
}

/** The address with `state` written on it, untouched when it already says so. */
function withMapState(url: URL, state: MapState): URL {
  const written = writeMapState(state, url.searchParams);
  const unchanged = MAP_STATE_PARAMS.every(key => written.getAll(key).join() === url.searchParams.getAll(key).join());
  if (!unchanged) url.search = written.toString();
  return url;
}

/** The address written the one way the Address writes it. */
function normalized(url: URL): URL {
  const next = withMapState(new URL(url), mapStateOf(url));
  if (next.searchParams.has(VIEW_PARAM)) withView(next, viewOf(next));
  if (next.hash.startsWith(TYPE_ANCHOR)) next.hash = '';
  return next;
}

/** A scroll position of the page. */
export interface Position { readonly left: number; readonly top: number }

/** Where the visitor was exploring the map when the entry's municipality was selected. */
const EXPLORATION = 'municipalExploration';
/** The municipal path whose details the entry shows open. */
const DETAILS = 'municipalDetails';
/** Whether opening the details created the entry, so closing them is going back. */
const BY_OPENING = 'detailsEntry';

const MUNICIPAL_PATH = '/municipio/';
/** The query that named the municipality before the municipal paths of ADR-0010. */
const LEGACY_MUNICIPALITY = 'municipio';

/** The address of a municipality's query, or of Brazil when `path` is `/`: the hash and the legacy `?municipio=` go away. */
function atMunicipality(url: URL, path: string): URL {
  url.pathname = path;
  url.searchParams.delete(LEGACY_MUNICIPALITY);
  url.hash = '';
  return url;
}

/** Why the home map is being shown again. */
export type NavigationCause = 'initial' | 'back' | 'hash' | 'reset';

export interface Navigation<Contexts> {
  readonly url: URL;
  readonly cause: NavigationCause;
  readonly view: View;
  readonly mapState: MapState;
  /** The anchor without `#`: on load, the one the visitor arrived with, even a `#tipo-` the address has dropped; none on an entry whose reading context comes back. */
  readonly anchor: string;
  /** Where the visitor was exploring the map before the municipality on this entry was selected. */
  readonly exploration: Position | undefined;
  /** Whether the municipality's details are open on this entry. */
  readonly detailsOpen: boolean;
  /** What each part left on this entry; absent on an entry this document has not left. */
  readonly context: Partial<Contexts>;
}

/** What the change signal says: the address now, and why it changed. A `command` is a write asked by a part of the home map. */
export interface AddressChange {
  readonly url: URL;
  readonly cause: NavigationCause | 'command';
}

export interface Address<Contexts = Record<string, unknown>> {
  /** Read under `name` every time the visitor leaves an entry. */
  registerContext<Name extends keyof Contexts & string>(name: Name, read: () => Contexts[Name]): void;
  /** The single handler of the home map: called now with `initial`, then on every navigation. */
  listen(handler: (navigation: Navigation<Contexts>) => void): void;
  /** The single change signal: heard after every write and every navigation, once the handler has applied it. */
  onChange(listener: (change: AddressChange) => void): void;
  /** Show the map or its List: a new entry only when the address changes. */
  chooseView(view: View): void;
  /** Show another indicator, cancer type or mode: a new entry, which keeps the details open but was not created by opening them. */
  setMapState(state: MapState): void;
  /** Show a municipality's query at its `path`: a new entry, which remembers where the visitor was exploring the map. */
  selectMunicipality(path: string, exploration: Position): void;
  /** Back to Brazil: a new entry, keeping the map state and the visualization. */
  closeMunicipality(): void;
  /** Whether the municipality's details are open on the current entry. */
  readonly detailsOpen: boolean;
  /** Where the visitor was exploring the map behind the current entry's municipality. */
  readonly exploration: Position | undefined;
  /** Open the municipality's details: a new entry, created by the opening; the exploration stays on the entry left behind. */
  openDetails(): void;
  /** Open the details on the current entry, as a link with an Eixo anchor arrives: no entry is added. */
  openDetailsInPlace(): void;
  /** Close the details: Back when opening them created the entry, otherwise the entry rewritten without them nor its anchor. True when they closed on this entry; after Back, the navigation closes them. */
  closeDetails(): boolean;
  /** Arrive at an Eixo anchor of the same municipality: the entry is rewritten, so Back still leaves it as a whole. */
  followAnchor(anchor: string): void;
  /** Turn a legacy `?municipio=<code>` into the municipal path `pathOf` gives for that code, rewriting the entry; a municipal path already on the address wins. */
  convertLegacyMunicipality(pathOf: (code: string) => string | undefined): void;
  /** Back to the default home map at `home`: a new entry only when the address changes, delivered with no reading context. */
  reset(home: string | URL): void;
}

const VISIT = 'visitEntry';

function positionOf(state: EntryState): Position | undefined {
  const position = state?.[EXPLORATION] as Partial<Position> | undefined;
  return typeof position?.left === 'number' && typeof position.top === 'number' ? { left: position.left, top: position.top } : undefined;
}

export function createAddress<Contexts = Record<string, unknown>>(history: AddressHistory): Address<Contexts> {
  const readers: [string, () => unknown][] = [];
  // Only this document's lifetime: a reload starts with no context on any entry.
  const contexts = new Map<number, Partial<Contexts>>();
  let handler: ((navigation: Navigation<Contexts>) => void) | undefined;
  const listeners: ((change: AddressChange) => void)[] = [];
  const signal = (cause: AddressChange['cause']) => {
    for (const listener of listeners) listener({ url: new URL(history.url), cause });
  };
  let sequence = 0;
  const visitOf = (state: EntryState) => (typeof state?.[VISIT] === 'number' ? state[VISIT] : undefined);
  /** The current entry's visit, given one if it has none (a fresh load or a hash navigation). */
  const enter = () => {
    let visit = visitOf(history.state);
    if (visit === undefined) {
      visit = ++sequence;
      history.replace({ ...history.state, [VISIT]: visit }, history.url);
    }
    sequence = Math.max(sequence, visit);
    return visit;
  };
  const arrival = new URL(history.url).hash.slice(1);
  const loaded = normalized(new URL(history.url));
  if (loaded.href !== history.url) history.replace(history.state, loaded);
  sequence = visitOf(history.state) ?? 0;
  let active = enter();
  const leave = () => {
    contexts.set(active, Object.fromEntries(readers.map(([name, read]) => [name, read()])) as Partial<Contexts>);
  };
  const deliver = (cause: NavigationCause) => {
    const url = new URL(history.url);
    const context = cause === 'reset' ? undefined : contexts.get(active);
    // Where the visitor left this entry wins over the anchor of the link that first brought them here.
    const anchor = cause === 'initial' ? arrival : context ? '' : url.hash.slice(1);
    handler?.({ url, cause, view: viewOf(url), mapState: mapStateOf(url), anchor,
      exploration: positionOf(history.state), detailsOpen: detailsOpen(), context: context ?? {} });
    signal(cause);
  };
  const detailsOpen = () => history.state?.[DETAILS] === new URL(history.url).pathname;
  const rewrite = (state: EntryState, url: string | URL) => history.replace({ ...state, [VISIT]: active }, url);
  const push = (state: EntryState, url: string | URL) => {
    leave();
    active = ++sequence;
    history.push({ ...state, [VISIT]: active }, url);
  };
  history.onPopState(() => {
    leave();
    // Only a link followed in the page leaves a `#tipo-` on the address: every entry written here drops it.
    const typed = anchoredType(new URL(history.url)) !== undefined;
    if (typed) history.replace(history.state, normalized(new URL(history.url)));
    active = enter();
    deliver(typed ? 'hash' : 'back');
  });
  return {
    get detailsOpen() { return detailsOpen(); },
    get exploration() { return positionOf(history.state); },
    registerContext(name, read) {
      readers.push([name, read]);
    },
    onChange(listener) {
      listeners.push(listener);
    },
    listen(next) {
      handler = next;
      deliver('initial');
    },
    chooseView(view) {
      const url = new URL(history.url);
      if (viewOf(url) === view) return;
      push(history.state, withView(url, view));
      signal('command');
    },
    setMapState(state) {
      const url = withMapState(new URL(history.url), state);
      if (url.href === history.url) return;
      push(history.state?.[DETAILS] ? { ...history.state, [BY_OPENING]: false } : history.state, url);
      signal('command');
    },
    selectMunicipality(path, exploration) {
      push({ [EXPLORATION]: exploration }, atMunicipality(new URL(history.url), path));
      signal('command');
    },
    closeMunicipality() {
      push(null, atMunicipality(new URL(history.url), '/'));
      signal('command');
    },
    openDetails() {
      if (detailsOpen()) return;
      const exploration = positionOf(history.state) ?? { left: 0, top: 0 };
      rewrite({ ...history.state, [EXPLORATION]: exploration }, history.url);
      push({ ...history.state, [DETAILS]: new URL(history.url).pathname, [BY_OPENING]: true }, history.url);
      signal('command');
    },
    openDetailsInPlace() {
      if (detailsOpen()) return;
      rewrite({ ...history.state, [DETAILS]: new URL(history.url).pathname, [BY_OPENING]: false,
        [EXPLORATION]: positionOf(history.state) ?? { left: 0, top: 0 } }, history.url);
      signal('command');
    },
    closeDetails() {
      if (detailsOpen() && history.state?.[BY_OPENING]) {
        history.back();
        return false;
      }
      const url = new URL(history.url);
      url.hash = '';
      rewrite({ ...history.state, [DETAILS]: undefined, [BY_OPENING]: undefined }, url);
      signal('command');
      return true;
    },
    followAnchor(anchor) {
      const url = new URL(history.url);
      url.hash = anchor;
      rewrite(history.state, url);
      signal('command');
    },
    convertLegacyMunicipality(pathOf) {
      const url = new URL(history.url);
      const code = url.searchParams.get(LEGACY_MUNICIPALITY);
      if (code === null) return;
      url.searchParams.delete(LEGACY_MUNICIPALITY);
      if (!url.pathname.startsWith(MUNICIPAL_PATH)) url.pathname = pathOf(code) ?? url.pathname;
      rewrite(history.state, url);
      signal('command');
    },
    reset(home) {
      const url = new URL(home, history.url);
      if (url.href !== history.url) push(null, url);
      deliver('reset');
    },
  };
}

const homeListeners: ((change: AddressChange) => void)[] = [];

/** The home map's container, present only on the pages of the home map, whose address an Address owns. */
export function homeMapContainer(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.map[data-mesh-url]');
}

/** Hear the home map's change signal from a part mounted outside the home map, like the shared header; silent on other pages. */
export function onHomeAddressChange(listener: (change: AddressChange) => void): void {
  homeListeners.push(listener);
}

/** The Address of the home map, over the browser's history; its change signal also reaches `onHomeAddressChange`. */
export function createHomeAddress<Contexts>(): Address<Contexts> {
  const address = createAddress<Contexts>(browserHistory());
  address.onChange(change => { for (const listener of homeListeners) listener(change); });
  return address;
}

/** The browser's own history and location. */
export function browserHistory(): AddressHistory {
  return {
    get url() { return location.href; },
    get state() { return history.state as EntryState; },
    push(state, url) { history.pushState(state, '', url); },
    replace(state, url) { history.replaceState(state, '', url); },
    back() { history.back(); },
    onPopState(listener) { window.addEventListener('popstate', listener); },
  };
}

export interface MemoryHistory extends AddressHistory {
  readonly length: number;
  readonly index: number;
  forward(): void;
  /** A hash navigation, as following an in-page link: a new entry with no state. */
  setHash(hash: string): void;
  /** A new document on the same entries: whoever listened to the old one stops hearing. */
  reload(): void;
}

/** A history kept in memory, for driving the Address without a browser. */
export function memoryHistory(url: string): MemoryHistory {
  const entries: { url: string; state: EntryState }[] = [{ url: new URL(url).href, state: null }];
  let index = 0;
  const listeners: (() => void)[] = [];
  const resolve = (next: string | URL) => new URL(next, entries[index]!.url).href;
  const go = (step: number) => {
    const next = index + step;
    if (next < 0 || next >= entries.length) return;
    index = next;
    for (const listener of listeners) listener();
  };
  return {
    get url() { return entries[index]!.url; },
    get state() { return entries[index]!.state; },
    get length() { return entries.length; },
    get index() { return index; },
    push(state, next) {
      entries.splice(index + 1, Infinity, { url: resolve(next), state: structuredClone(state) });
      index += 1;
    },
    replace(state, next) {
      entries[index] = { url: resolve(next), state: structuredClone(state) };
    },
    onPopState(listener) { listeners.push(listener); },
    back() { go(-1); },
    forward() { go(1); },
    reload() { listeners.length = 0; },
    setHash(hash) {
      const next = new URL(entries[index]!.url);
      next.hash = hash;
      entries.splice(index + 1, Infinity, { url: next.href, state: null });
      go(1);
    },
  };
}
