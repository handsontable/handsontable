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
 * either reading the DOM back. The record also knows whether the transform is currently LIFTED:
 * during a native scrollbar drag the sticky-scroll strategy positions the element through the
 * insets instead, which the offset chain does see, so `getSpreaderOffset()` reports zero for as
 * long as that lasts - otherwise every reader would count the offset twice.
 */
interface SpreaderOffsetRecord {
  x: number;
  y: number;
  lifted: boolean;
}

const offsets = new WeakMap<HTMLElement, SpreaderOffsetRecord>();

/**
 * @param {HTMLElement} spreader The spreader element.
 * @returns {SpreaderOffsetRecord} The element's record, created on first use.
 */
function recordFor(spreader: HTMLElement): SpreaderOffsetRecord {
  let record = offsets.get(spreader);

  if (!record) {
    record = { x: 0, y: 0, lifted: false };
    offsets.set(spreader, record);
  }

  return record;
}

/**
 * Returns the offset the transform currently applies, in physical pixels. `x` is negative in RTL,
 * where the spreader moves away from the hider's right edge. Zero while the transform is lifted:
 * the insets position the element then, and the offset chain already accounts for those.
 *
 * @param {HTMLElement} spreader The spreader element.
 * @returns {{ x: number, y: number }}
 */
export function getSpreaderOffset(spreader: HTMLElement): { x: number; y: number } {
  const record = offsets.get(spreader);

  if (!record || record.lifted) {
    return { x: 0, y: 0 };
  }

  return { x: record.x, y: record.y };
}

/**
 * Records one axis of the spreader offset and, unless the write is suspended, applies the
 * resulting transform. A write that changes nothing is skipped: the master spreader's vertical
 * axis is written by the top AND the bottom overlay on every draw, with the same value.
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
  const record = recordFor(spreader);

  if (record[axis] === value) {
    return;
  }

  record[axis] = value;

  if (!suspended) {
    applySpreaderTransform(spreader);
  }
}

/**
 * Writes the recorded offset to the element as a transform and marks it applied. A zero offset
 * clears the property so an unscrolled grid carries no transform at all.
 *
 * @param {HTMLElement} spreader The spreader element.
 */
export function applySpreaderTransform(spreader: HTMLElement): void {
  const record = recordFor(spreader);

  record.lifted = false;

  if (record.x === 0 && record.y === 0) {
    spreader.style.transform = '';

    return;
  }

  spreader.style.transform = `translate(${record.x}px, ${record.y}px)`;
}

/**
 * Removes the transform and marks it lifted, keeping the recorded offset so it can be re-applied.
 * While lifted, `getSpreaderOffset()` reports zero.
 *
 * @param {HTMLElement} spreader The spreader element.
 */
export function clearSpreaderTransform(spreader: HTMLElement): void {
  recordFor(spreader).lifted = true;
  spreader.style.transform = '';
}
