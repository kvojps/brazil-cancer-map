export interface Box { left: number; top: number; right: number; bottom: number }
export interface Padding { top: number; right: number; bottom: number; left: number }

function covers(map: Box, box: Box | undefined): box is Box {
  return !!box && box.right > box.left && box.bottom > box.top
    && box.left < map.right && box.right > map.left && box.top < map.bottom && box.bottom > map.top;
}

/**
 * The paddings that keep a fit clear of the legend in the map's lower left corner and of what floats
 * over its top, a caveat and the phone's controls: beside them or between them, for the caller to keep
 * whichever leaves the larger zoom. What is off the map, or hidden, reserves nothing.
 */
export function framingPaddings(map: Box, { legend, note, controls }: { legend?: Box; note?: Box; controls?: Box }, margin: number): Padding[] {
  const base = { top: margin, right: margin, bottom: margin, left: margin };
  const low = covers(map, legend) ? legend : undefined;
  const high = [note, controls].filter((box): box is Box => covers(map, box));
  if (!low && !high.length) return [base];
  const highRight = Math.max(0, ...high.map(box => box.right));
  const highBottom = Math.max(map.top, ...high.map(box => box.bottom));
  return [
    { ...base, left: Math.max(low?.right ?? 0, highRight) - map.left + margin },
    { ...base, top: highBottom - map.top + margin, bottom: low ? map.bottom - low.top + margin : margin },
  ];
}
