/**
 * Places the spreader - the box that holds the rendered rows and columns - at the offset of the
 * first rendered row and column inside the hider.
 *
 * The offset is written as a CSS transform, not as the `top`/`left` insets. The spreader is
 * repositioned on every scroll draw, and a change to an inset is a layout move that the browser
 * reports as a layout shift: it subtracts the scroll distance, but the spreader can only sit on a
 * row boundary, so a sub-row remainder is reported on every frame and the page's CLS grows without
 * bound (DEV-54). A transform moves pixels without moving layout and is exempt from that accounting.
 *
 * The consequence for readers: `offsetTop`/`offsetLeft` and the `offset()` helper walk the layout
 * chain, so they no longer see this movement. Read it back with `getSpreaderOffset()` and add it
 * wherever a cell's document position is compared against an element outside the spreader.
 * `getBoundingClientRect()` is unaffected.
 *
 * The last written offset is kept per element so each axis can be written by a different overlay
 * (the top overlay owns the vertical axis, the inline-start overlay the horizontal one) without
 * either reading the DOM back.
 */
const offsets = new WeakMap<HTMLElement, { x: number; y: number }>();

/**
 * Returns the spreader's current offset in physical pixels. `x` is negative in RTL, where the
 * spreader moves away from the hider's right edge.
 *
 * @param {HTMLElement} spreader The spreader element.
 * @returns {{ x: number, y: number }}
 */
export function getSpreaderOffset(spreader: HTMLElement): { x: number; y: number } {
  const offset = offsets.get(spreader);

  return offset ? { x: offset.x, y: offset.y } : { x: 0, y: 0 };
}

/**
 * Records one axis of the spreader offset and, unless the write is suspended, applies the
 * resulting transform.
 *
 * @param {HTMLElement} spreader The spreader element.
 * @param {'x' | 'y'} axis The axis to set.
 * @param {number} value The offset in physical pixels.
 * @param {boolean} [suspended=false] When `true` only the record is updated - the sticky-scroll
 * strategy owns the element's position for the duration of a scrollbar drag.
 */
export function setSpreaderOffset(
  spreader: HTMLElement, axis: 'x' | 'y', value: number, suspended: boolean = false
): void {
  let offset = offsets.get(spreader);

  if (!offset) {
    offset = { x: 0, y: 0 };
    offsets.set(spreader, offset);
  }

  offset[axis] = value;

  if (!suspended) {
    applySpreaderTransform(spreader);
  }
}

/**
 * Writes the recorded offset to the element as a transform. A zero offset clears the property so
 * an unscrolled grid carries no transform at all.
 *
 * @param {HTMLElement} spreader The spreader element.
 */
export function applySpreaderTransform(spreader: HTMLElement): void {
  const offset = offsets.get(spreader);

  if (!offset || (offset.x === 0 && offset.y === 0)) {
    spreader.style.transform = '';

    return;
  }

  spreader.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
}

/**
 * Removes the transform without forgetting the recorded offset, so it can be re-applied later.
 *
 * @param {HTMLElement} spreader The spreader element.
 */
export function clearSpreaderTransform(spreader: HTMLElement): void {
  spreader.style.transform = '';
}
