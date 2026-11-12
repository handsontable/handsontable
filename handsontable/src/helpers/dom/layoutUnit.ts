/**
 * How many steps a browser divides one CSS pixel into when it lays an element out. Chromium and
 * WebKit use 1/64 (`LayoutUnit`); Firefox uses 1/60, where a snap to 1/64 is off by about 0.001px,
 * which a layout that rounds a height again on write absorbs.
 */
const LAYOUT_UNITS_PER_PIXEL = 64;

/**
 * Snaps a measured length to the layout grid.
 *
 * A computed style serializes at most three decimals (`118.266px` for a box that is laid out at
 * `118.265625px`). Written back as a height, that value lands on the next grid step up or down, so
 * the element ends up a fraction of a pixel away from the one it was measured on. Snapping the
 * measured value first writes back exactly the height the browser laid out.
 *
 * @param {number} value The length in CSS pixels.
 * @returns {number} The length on the layout grid.
 */
export function snapToLayoutUnit(value: number): number {
  return Math.round(value * LAYOUT_UNITS_PER_PIXEL) / LAYOUT_UNITS_PER_PIXEL;
}

/**
 * Resolves the used height of an element from its computed `height`, when that carries the
 * fraction that `offsetHeight` rounds away.
 *
 * `offsetHeight` is a whole number of pixels, so a row that is laid out at `118.27px` reads `118`.
 * A height recorded from that read and written onto the same row in another table (the row-header
 * clone) makes that table's row `0.27px` shorter, and the error stacks row after row.
 *
 * The value comes from the computed style, not from `getBoundingClientRect()`: a rect is scaled by
 * an ancestor's CSS `zoom` while `offsetHeight` is not, so a height taken from it would sit in a
 * different space than the one the caller compares it with. The computed style is in the same
 * space as `offsetHeight` at any zoom.
 *
 * A computed height that is not a length (`auto` on an element that is not rendered) or that
 * is a pixel or more away from the whole-pixel read is not a refinement of it, and the whole-pixel
 * read is returned.
 *
 * @param {string} usedHeight The element's computed `height`.
 * @param {number} roundedHeight The element's `offsetHeight`.
 * @param {number} [zoom=1] The element's effective CSS zoom (`currentCSSZoom`).
 * @returns {number} The used height on the layout grid, or `roundedHeight` when it cannot be refined.
 */
export function resolveFractionalHeight(usedHeight: string, roundedHeight: number, zoom = 1): number {
  const used = Number.parseFloat(usedHeight);

  if (!Number.isFinite(used) || Math.abs(used - roundedHeight) >= 1) {
    return roundedHeight;
  }

  // Under an ancestor's CSS `zoom` the computed height is in unzoomed pixels, while the browser lays
  // the row out on a grid of zoomed ones: a snap in the unzoomed space lands a step off (`99.8625px`
  // under `zoom: 1.25` is laid out at `99.859375px` after a snap, and a row is `0.003px` off each time).
  // The snap is made where the layout is, then brought back.
  return snapToLayoutUnit(used * zoom) / zoom;
}

/**
 * Whether a height is below another by more than the layout grid can tell apart.
 *
 * A height that is on the layout grid compares equal to itself, and one that is not (a height a
 * caller provided) is below another only when the browser would lay the two out differently.
 *
 * @param {number} height The height to test.
 * @param {number} other The height it is compared with.
 * @returns {boolean} `true` when `height` is below `other` by more than half a layout step.
 */
export function isHeightBelow(height: number, other: number): boolean {
  return height < other - (0.5 / LAYOUT_UNITS_PER_PIXEL);
}
