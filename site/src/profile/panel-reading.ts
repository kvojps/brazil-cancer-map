import { cancerTypeOfAnchor, type Address } from '../map/address';

/** Where the visitor left the municipal panel on a history entry. */
interface MunicipalityContext {
  code: string;
  axis: string;
  readingTop: number;
  panelTop: number;
  barTop: number;
}

export type MunicipalityReading = { municipality: MunicipalityContext | undefined };

type ReadingDestination =
  | { axis: string; source: 'saved'; position?: MunicipalityContext }
  | { axis: string; source: 'anchor' | 'indicator'; position: boolean };

function axisFor(indicator: string): string {
  if (indicator === 'within_60_days') return 'acesso';
  if (indicator === 'hpv') return 'prevencao';
  if (indicator === 'mortality') return 'panorama';
  return 'deteccao';
}

function axisOfAnchor(anchor: string): string | undefined {
  if (cancerTypeOfAnchor(`#${anchor}`)) return 'acesso';
  if (['acesso', 'deteccao', 'prevencao', 'panorama'].includes(anchor)) return anchor;
}

interface PanelReadingOptions {
  panel: HTMLElement;
  content: HTMLElement;
  heading: HTMLElement;
  toggle: HTMLButtonElement;
  clear: HTMLButtonElement;
  share: HTMLElement;
  panelLegend: HTMLElement;
  sheet: MediaQueryList;
  address: Address<MunicipalityReading>;
  initialIndicator: string;
  onCompositionChanged(expanded: boolean): void;
  onGesture(): void;
}

/** Choose and apply the current reading to the mounted municipal panel. */
export function mountPanelReading({
  panel, content, heading, toggle, clear, share, panelLegend, sheet, address,
  initialIndicator, onCompositionChanged, onGesture,
}: PanelReadingOptions) {
  const reading = panel.querySelector<HTMLElement>('.panel-reading')!;
  const bar = panel.querySelector<HTMLElement>('.panel-bar')!;
  const closeDetails = panel.querySelector<HTMLButtonElement>('[data-close-details]')!;
  let indicator = initialIndicator;
  let available = false;
  let destination: ReadingDestination | undefined;
  let arrival = 0;
  let focusSummaryOnLoad = false;
  const indicatorReading = (position = false): ReadingDestination => ({ axis: axisFor(indicator), source: 'indicator', position });
  const setDestination = (next?: ReadingDestination) => {
    arrival++;
    destination = next;
  };
  const guardArrival = (callback: () => void) => {
    const current = arrival;
    return () => { if (current === arrival) callback(); };
  };
  const cancelPositioning = (dismissAnchor = false) => {
    if (dismissAnchor && destination?.source === 'anchor') setDestination(indicatorReading());
    else if (destination?.source === 'saved') setDestination({ ...destination, position: undefined });
    else setDestination(destination && { ...destination, position: false });
  };
  // A gesture cancels both arrivals: the reading's and the camera's.
  const cancelArrival = () => {
    cancelPositioning();
    focusSummaryOnLoad = false;
    onGesture();
  };
  for (const event of ['wheel', 'touchmove', 'pointerdown', 'keydown']) {
    window.addEventListener(event, cancelArrival, { passive: true, capture: true });
  }

  const expand = (expanded: boolean, preserveShareFocus = false) => {
    const wasExpanded = !panel.hasAttribute('data-collapsed');
    const focused = document.activeElement;
    const shareFocused = focused instanceof HTMLElement && share.contains(focused);
    panel.toggleAttribute('data-collapsed', !expanded);
    const nextToShare = expanded ? clear : panelLegend;
    const movingShare = share.nextElementSibling !== nextToShare;
    if (!expanded && wasExpanded && (movingShare || !shareFocused)) panel.scrollTop = 0;
    if (movingShare) {
      // Keep pending sharing and its feedback with the control in either layout.
      nextToShare.before(share);
      if (preserveShareFocus && shareFocused) {
        focused.focus({ preventScroll: true });
        requestAnimationFrame(guardArrival(() => {
          if (document.activeElement === focused) focused.scrollIntoView({ block: 'nearest' });
        }));
      }
    }
    toggle.setAttribute('aria-expanded', String(expanded));
    onCompositionChanged(expanded);
  };
  const syncDetails = ({ resizing = false, restoring = false } = {}) => {
    const focused = document.activeElement;
    const hadFocus = panel.contains(focused);
    const wasExpanded = !panel.hasAttribute('data-collapsed');
    expand(!sheet.matches || address.detailsOpen, resizing);
    if (sheet.matches && wasExpanded && !address.detailsOpen) {
      if (hadFocus && !(resizing && share.contains(document.activeElement))) {
        focusSummaryOnLoad = toggle.hasAttribute('hidden');
        if (focusSummaryOnLoad) panel.focus({ preventScroll: true });
        else toggle.focus({ preventScroll: true });
      }
    } else if (restoring && sheet.matches && !wasExpanded && address.detailsOpen && hadFocus) {
      heading.focus({ preventScroll: true });
    } else if (resizing && hadFocus && focused?.getClientRects().length === 0) {
      heading.focus({ preventScroll: true });
    }
  };
  toggle.onclick = () => {
    cancelArrival();
    address.openDetails();
    setDestination(indicatorReading());
    readWhenAvailable();
    heading.focus({ preventScroll: true });
  };
  closeDetails.onclick = () => {
    closeDetails.focus({ preventScroll: true });
    cancelPositioning(true);
    // The change signal syncs them; closing details the opening created is Back, synced by the navigation that follows.
    if (address.closeDetails() && address.exploration) {
      const { left, top } = address.exploration;
      requestAnimationFrame(guardArrival(() => window.scrollTo({ left, top, behavior: 'instant' })));
    }
  };
  // The address arrived before this part mounted, so apply its initial composition now.
  syncDetails();
  sheet.addEventListener('change', () => syncDetails({ resizing: true }));
  const prepareAxes = () => {
    for (const axis of content.querySelectorAll<HTMLDetailsElement>('[data-profile-axis]')) {
      axis.name = 'profile-axis';
      const title = axis.querySelector<HTMLElement>(':scope > summary')!;
      let revealTitle: (() => void) | undefined;
      title.addEventListener('click', () => {
        revealTitle = guardArrival(() => title.scrollIntoView({ block: 'nearest' }));
      });
      // Closing the axis above moves this one. Keep the activated title in view.
      axis.addEventListener('toggle', () => {
        if (axis.open) revealTitle?.();
        revealTitle = undefined;
      });
    }
  };
  const apply = ({ axis: axisId, source, position }: ReadingDestination) => {
    for (const axis of content.querySelectorAll<HTMLDetailsElement>('[data-profile-axis]')) axis.open = axis.id === axisId;
    if (source === 'saved') {
      if (position) {
        // Traversal can still move to the URL fragment after popstate has run.
        const restorePosition = guardArrival(() => {
          reading.scrollTop = position.readingTop;
          panel.scrollTop = position.panelTop;
          bar.scrollTop = position.barTop;
        });
        requestAnimationFrame(() => requestAnimationFrame(restorePosition));
      }
      return;
    }
    const anchored = source === 'anchor';
    if (anchored && sheet.matches) {
      const toggleHadFocus = document.activeElement === toggle;
      address.openDetailsInPlace();
      if (toggleHadFocus) heading.focus({ preventScroll: true });
    }
    if (!position || (!anchored && (!sheet.matches || !address.detailsOpen))) return;
    const target = content.querySelector<HTMLElement>(`#${axisId}`);
    const revealAxis = guardArrival(() => {
      if (target?.isConnected && (!sheet.matches || address.detailsOpen)) target.scrollIntoView({ block: 'start' });
    });
    if (anchored) requestAnimationFrame(() => requestAnimationFrame(revealAxis));
    else revealAxis();
  };
  const readWhenAvailable = () => {
    if (!available || !destination) return;
    const next = destination;
    destination = undefined;
    apply(next);
  };
  // Browsers open closed details around a fragment target. A link to the axis itself needs to open it explicitly.
  content.addEventListener('click', event => {
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
    const click = event as MouseEvent;
    if (!link || link.pathname !== location.pathname || click.ctrlKey || click.metaKey || click.shiftKey || click.altKey || click.button !== 0) return;
    const axis = [...content.querySelectorAll<HTMLDetailsElement>('[data-profile-axis]')].find(axis => `#${axis.id}` === link.hash);
    const phone = sheet.matches;
    if (!axis || (!phone && link.hash !== location.hash)) return;
    // On a phone, Back still returns to the summary; on desktop, an unchanged hash needs a fresh reveal.
    event.preventDefault();
    if (phone) address.followAnchor(axis.id);
    setDestination({ axis: axis.id, source: 'anchor', position: true });
    readWhenAvailable();
    if (phone) axis.querySelector('summary')!.focus({ preventScroll: true });
  });

  return {
    capture(code: string): MunicipalityContext | undefined {
      if (!code) return;
      return {
        code,
        axis: content.querySelector<HTMLDetailsElement>('[data-profile-axis][open]')?.id ?? '',
        readingTop: reading.scrollTop,
        panelTop: panel.scrollTop,
        barTop: bar.scrollTop,
      };
    },
    prepareAxes,
    syncDetails,
    select() {
      focusSummaryOnLoad = false;
      setDestination(indicatorReading());
    },
    clear() {
      setDestination();
    },
    updateIndicator(next: string) {
      if (next === indicator) return;
      indicator = next;
      setDestination(indicatorReading(available));
    },
    restore({ code, indicator: next, anchor, saved, sameSelection, fromBack }: {
      code: string | undefined;
      indicator: string;
      anchor: string;
      saved?: MunicipalityContext;
      sameSelection: boolean;
      fromBack: boolean;
    }, restoreQuery: () => void) {
      indicator = next;
      const axis = axisOfAnchor(anchor);
      if (!code) setDestination();
      else if (saved?.code === code) setDestination({ axis: saved.axis, source: 'saved', position: saved });
      else if (axis) setDestination({ axis, source: 'anchor', position: true });
      else setDestination(indicatorReading());
      focusSummaryOnLoad = false;
      const hadFocus = panel.contains(document.activeElement);
      if (sameSelection) syncDetails({ restoring: fromBack });
      restoreQuery();
      if (!panel.hidden && hadFocus && !panel.contains(document.activeElement)) heading.focus({ preventScroll: true });
    },
    contentReady() {
      available = true;
      readWhenAvailable();
      if (!focusSummaryOnLoad) return;
      focusSummaryOnLoad = false;
      if (document.activeElement === panel && sheet.matches && panel.hasAttribute('data-collapsed')) {
        toggle.focus({ preventScroll: true });
      }
    },
    contentFailed() {
      available = false;
      setDestination();
    },
    retry() {
      setDestination(indicatorReading());
    },
    resetSelection() {
      available = false;
      focusSummaryOnLoad = false;
      panel.scrollTop = 0;
      bar.scrollTop = 0;
    },
    showSelection() {
      expand(!sheet.matches || address.detailsOpen);
    },
    resetSheetPosition() {
      if (sheet.matches) panel.scrollTop = 0;
    },
  };
}
