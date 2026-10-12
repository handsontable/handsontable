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
 * A box wholly above the viewport collapses to a zero-height range at the viewport's top, so no list flips there.
 * A box wholly below it collapses at its own top, so a cell inside it still measures room above.
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

/**
 * Measures the room above and below an edited cell for the editor's `fixed` list: the cell's distance to
 * the top and bottom edges of `getVisibleVerticalRange()`. Both editors that flip their list vertically
 * read it here, so the two cannot drift apart.
 *
 * @param {{ top: number, bottom: number }} cellRect The edited cell's box in viewport coordinates.
 * @param {{ top: number, height: number }} block The box the `fixed` list is laid out in
 * (`getFixedContainingBlockRect()`).
 * @param {number} viewportHeight The viewport's height (`documentElement.clientHeight`).
 * @returns {{ spaceAbove: number, spaceBelow: number }} The room above and below the cell, never negative.
 */
export function getVerticalRoom(
  cellRect: { top: number, bottom: number },
  block: { top: number, height: number },
  viewportHeight: number
): { spaceAbove: number, spaceBelow: number } {
  const visible = getVisibleVerticalRange(block, viewportHeight);

  return {
    spaceAbove: Math.max(cellRect.top - visible.top, 0),
    spaceBelow: Math.max(visible.bottom - cellRect.bottom, 0),
  };
}
