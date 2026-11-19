/**
 * The Address of the home map: the URL and the history entry, with the reading context
 * each part leaves on an entry. The home map writes its history entries through it.
 */

export type EntryState = Record<string, unknown> | null;

/** The history the Address writes to: the browser's in production, an in-memory one in tests. */
export interface AddressHistory {
  readonly url: string;
  readonly state: EntryState;
  push(state: EntryState, url: string | URL): void;
  replace(state: EntryState, url: string | URL): void;
  /** Called when the visitor moves to another entry: Back, Forward or a hash navigation. */
  onPopState(listener: () => void): void;
}

/** Why the home map is being shown again. */
export type NavigationCause = 'initial' | 'back';

export interface Navigation<Contexts> {
  readonly url: URL;
  readonly cause: NavigationCause;
  /** What each part left on this entry; absent on an entry this document has not left. */
  readonly context: Partial<Contexts>;
}

export interface Address<Contexts = Record<string, unknown>> {
  /** Read under `name` every time the visitor leaves an entry. */
  registerContext<Name extends keyof Contexts & string>(name: Name, read: () => Contexts[Name]): void;
  /** The single handler of the home map: called now with `initial`, then on every navigation. */
  listen(handler: (navigation: Navigation<Contexts>) => void): void;
  /** Provisional: a new entry, for the parts that do not yet ask the Address by domain commands. */
  pushVisit(state: EntryState, url: string | URL): void;
  /** Provisional: the current entry rewritten, keeping its reading context. */
  replaceVisit(state: EntryState, url: string | URL): void;
}

const VISIT = 'visitEntry';

export function createAddress<Contexts = Record<string, unknown>>(history: AddressHistory): Address<Contexts> {
  const readers: [string, () => unknown][] = [];
  // Only this document's lifetime: a reload starts with no context on any entry.
  const contexts = new Map<number, Partial<Contexts>>();
  let handler: ((navigation: Navigation<Contexts>) => void) | undefined;
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
  sequence = visitOf(history.state) ?? 0;
  let active = enter();
  const leave = () => {
    contexts.set(active, Object.fromEntries(readers.map(([name, read]) => [name, read()])) as Partial<Contexts>);
  };
  const deliver = (cause: NavigationCause) => {
    handler?.({ url: new URL(history.url), cause, context: contexts.get(active) ?? {} });
  };
  history.onPopState(() => {
    leave();
    active = enter();
    deliver('back');
  });
  return {
    registerContext(name, read) {
      readers.push([name, read]);
    },
    listen(next) {
      handler = next;
      deliver('initial');
    },
    pushVisit(state, url) {
      leave();
      active = ++sequence;
      history.push({ ...state, [VISIT]: active }, url);
    },
    replaceVisit(state, url) {
      history.replace({ ...state, [VISIT]: active }, url);
    },
  };
}

/** The browser's own history and location. */
export function browserHistory(): AddressHistory {
  return {
    get url() { return location.href; },
    get state() { return history.state as EntryState; },
    push(state, url) { history.pushState(state, '', url); },
    replace(state, url) { history.replaceState(state, '', url); },
    onPopState(listener) { window.addEventListener('popstate', listener); },
  };
}

export interface MemoryHistory extends AddressHistory {
  readonly length: number;
  readonly index: number;
  back(): void;
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
