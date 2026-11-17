/** Reading context belongs to a history entry only for this document's lifetime. */
let sequence = 0;
const entryId = () => {
  if (!history.state?.visitEntry) history.replaceState({ ...history.state, visitEntry: ++sequence }, '', location.href);
  sequence = Math.max(sequence, history.state.visitEntry);
  return history.state.visitEntry as number;
};
let active: number | undefined;
const participants: { save(id: number): void; restore(id: number): void }[] = [];

function start(): number {
  if (active !== undefined) return active;
  sequence = history.state?.visitEntry ?? 0;
  active = entryId();
  window.addEventListener('popstate', () => {
    for (const participant of participants) participant.save(active!);
    active = entryId();
    for (const participant of participants) participant.restore(active);
  });
  return active;
}

export function keepVisitContext<T>(read: () => T, restore: (context: T | undefined) => void): void {
  start();
  const entries = new Map<number, T>();
  participants.push({
    save: id => { entries.set(id, read()); },
    restore: id => { restore(entries.get(id)); },
  });
}

export function pushVisit(state: Record<string, unknown> | null, url: string | URL): void {
  const previous = start();
  for (const participant of participants) participant.save(previous);
  active = ++sequence;
  history.pushState({ ...state, visitEntry: active }, '', url);
}

