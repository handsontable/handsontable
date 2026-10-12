/**
 * The vertical stretch of the viewport an editor's `fixed` list can be seen in, in viewport coordinates.
 */
export type VisibleVerticalRange = {
  top: number;
  bottom: number;
};

/**
 * Intersects the box a `fixed` list is laid out in with the viewport.
 *
 * Without a transformed ancestor that box is the viewport, so the result is the viewport. With one, the box
 * is that ancestor, which scrolls with the page: on a page the window scrolls, its bottom can lie far below
 * the viewport's, and room measured to it opens a list into space nobody can see. The room the editors
 * measure is what is both inside the box (an ancestor that clips its content cuts the list there) and
 * inside the viewport.
 *
 * A box wholly outside the viewport collapses to a zero-height range, so no list flips and the clamp pins it
 * to the range's top.
 *
 * @param {{ top: number, height: number }} block The box the `fixed` list is laid out in
 * (`getFixedContainingBlockRect()`).
 * @param {number} viewportHeight The viewport's height (`documentElement.clientHeight`).
 * @returns {VisibleVerticalRange} The top and bottom edges of the visible part of the box.
 */
export function getVisibleVerticalRange(
  block: { top: number, height: number },
  viewportHeight: number
): VisibleVerticalRange {
  const top = Math.max(block.top, 0);

  return {
    top,
    bottom: Math.max(Math.min(block.top + block.height, viewportHeight), top),
  };
}
