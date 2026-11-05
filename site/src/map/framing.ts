export interface Box { left: number; top: number; right: number; bottom: number }
export interface Padding { top: number; right: number; bottom: number; left: number }

function covers(map: Box, box: Box | undefined): box is Box {
  return !!box && box.right > box.left && box.bottom > box.top
    && box.left < map.right && box.right > map.left && box.top < map.bottom && box.bottom > map.top;
}

/**
 * The paddings that keep a fit clear of the legend in the map's lower left corner and of a caveat in
 * its upper left corner: beside them or between them, for the caller to keep whichever leaves the
 * larger zoom. What is off the map, or hidden, reserves nothing.
 */
export function framingPaddings(map: Box, { legend, note }: { legend?: Box; note?: Box }, margin: number): Padding[] {
  const base = { top: margin, right: margin, bottom: margin, left: margin };
  const low = covers(map, legend) ? legend : undefined;
  const high = covers(map, note) ? note : undefined;
  if (!low && !high) return [base];
  return [
    { ...base, left: Math.max(low?.right ?? 0, high?.right ?? 0) - map.left + margin },
    { ...base, top: high ? high.bottom - map.top + margin : margin, bottom: low ? map.bottom - low.top + margin : margin },
  ];
}
