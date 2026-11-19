/**
 * What the camera asks of the map engine. The MapLibre adapter measures what floats
 * over the map and remembers the clicked point; the camera only decides when to move.
 */
export interface CameraRenderer {
  /** Whether the map takes up space now: the list view hides it, and a hidden map cannot be framed. */
  isVisible(): boolean;
  /** Frame the country clear of the overlays, the first time a layer fills them. */
  frameCountry(): void;
  /** Restart deliberate exploration from the whole country. */
  resetCountry(): void;
  /**
   * Frame a municipality, or with `preserveCamera` only reveal its point when an overlay covers it.
   * `revealOutside` also reveals a point outside the map, for a selection made while it was hidden.
   */
  focusMunicipality(code: string, options: { preserveCamera: boolean; revealOutside: boolean }): void;
  /** Outline a municipality, or none, without moving the camera. */
  highlightMunicipality(code: string | undefined): void;
  /** Remove the outline without moving the camera. */
  clearMunicipality(): void;
}

/** The arrival policy of the home map camera, fed with intentions and facts. */
export interface MapCamera {
  /** A municipality was selected; `preserveCamera` keeps the exploration of a click on the map or on the list. */
  select(code: string, options?: { preserveCamera?: boolean }): void;
  /** The selection was cleared: only the outline goes away. */
  clear(): void;
  /** The logo restarts exploration from the whole country, even with a selection pending. */
  resetCountry(): void;
  /** A layer is shown, or none is. */
  layerShown(shown: boolean): void;
  /** The map changed size, for instance coming back from the list view. */
  mapResized(): void;
  /** The page layout changed; `sheetOpen` says the details sheet covers the map. */
  layoutChanged(options: { sheetOpen: boolean }): void;
  /** The user moved the map or the page: a pending arrival must not move the camera afterwards. */
  userTookOver(): void;
  /** The map engine is ready; a retry after a failure attaches a new one. */
  attach(renderer: CameraRenderer): void;
}

export function createMapCamera(): MapCamera {
  let selected: string | undefined;
  let preserveCamera = false;
  let arrivalAllowed = true;
  let hasLayer = false;
  let renderer: CameraRenderer | undefined;
  // Each renderer starts its own framing.
  let frameWhenShown = false;
  let countryFramed = false;
  let countryResetPending = false;

  const show = (target: CameraRenderer, code: string | undefined, preserve: boolean) => {
    if (code) {
      countryFramed = true;
      countryResetPending = false;
    }
    const returning = frameWhenShown;
    frameWhenShown = !!code && !target.isVisible();
    if (code) target.focusMunicipality(code, { preserveCamera: preserve, revealOutside: returning });
    else target.clearMunicipality();
  };
  // Frame the country once, against a filled legend and a map the list does not hide.
  const frameCountryOnce = (target: CameraRenderer) => {
    if (countryFramed || !hasLayer || selected || !target.isVisible()) return;
    countryFramed = true;
    if (countryResetPending) target.resetCountry();
    else target.frameCountry();
    countryResetPending = false;
  };

  return {
    select(code, { preserveCamera: preserve = false } = {}) {
      if (selected !== code) arrivalAllowed = true;
      selected = code;
      preserveCamera = preserve;
      if (renderer) show(renderer, code, preserve);
    },
    clear() {
      selected = undefined;
      preserveCamera = false;
      if (renderer) show(renderer, undefined, false);
    },
    resetCountry() {
      if (!renderer) { arrivalAllowed = true; return; }
      countryFramed = false;
      countryResetPending = true;
      renderer.resetCountry();
      frameCountryOnce(renderer);
    },
    layerShown(shown) {
      hasLayer = shown;
      if (shown && renderer) frameCountryOnce(renderer);
    },
    mapResized() {
      if (!renderer) return;
      if (frameWhenShown && renderer.isVisible()) show(renderer, selected, preserveCamera);
      frameCountryOnce(renderer);
    },
    layoutChanged({ sheetOpen }) {
      if (renderer && selected && !sheetOpen && renderer.isVisible()) {
        renderer.focusMunicipality(selected, { preserveCamera: true, revealOutside: false });
      }
    },
    userTookOver() {
      arrivalAllowed = false;
    },
    attach(next) {
      renderer = next;
      frameWhenShown = false;
      countryFramed = false;
      countryResetPending = false;
      if (arrivalAllowed) {
        show(next, selected, preserveCamera);
        frameCountryOnce(next);
      } else {
        // A camera the user already took over only receives the outline.
        countryFramed = true;
        preserveCamera = true;
        frameWhenShown = !!selected && !next.isVisible();
        next.highlightMunicipality(selected);
      }
    },
  };
}
