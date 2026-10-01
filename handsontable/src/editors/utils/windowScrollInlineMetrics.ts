import type { HotInstance } from '../../core/types';

/**
 * The viewport an editor's list measures its horizontal room against when the window scrolls the grid's
 * columns.
 *
 * `inlineStartOffset` is the distance from the viewport's inline-start edge to the grid's: the grid's left
 * edge in LTR, and in RTL the distance from the viewport's right edge to the grid root's right edge.
 * Added to `getEditedCellRect()`'s `start + width`, which counts from that same edge of the grid, it gives
 * the room from the viewport's inline-start edge to the cell's inline end. `viewportWidth` is the inline-end
 * boundary that room is measured up to.
 */
export type WindowScrollInlineMetrics = {
  inlineStartOffset: number;
  viewportWidth: number;
};

/**
 * Measures the viewport the horizontal flip of an editor's list uses when the window scrolls the grid's
 * columns (`view.isHorizontallyScrollableByWindow()`). `HandsontableEditor#flipDropdownHorizontallyIfNeeded()`
 * (and so the `autocomplete` and `dropdown` editors) and `MultiSelectEditor` both read it here, so the two
 * cannot drift apart: the multiselect once copied the old formula, bug included.
 *
 * `getEditedCellRect()` measures the cell from the grid root's inline-start edge, which is its RIGHT edge in
 * RTL, so under RTL the offset runs from the viewport's right edge to the root's right edge. The left-based
 * offset LTR uses (`getTableOffset().left - scrollX`), applied under RTL, was off by the page's horizontal
 * scroll, so once the page was scrolled toward its inline end every list flipped.
 *
 * The room is the viewport's, never the containing block's that the lists write `right` against
 * (`getFixedContainingBlockRect()`): a transformed ancestor makes that block a box that scrolls with the
 * page, and the list is not clipped to it, so a decision measured against it flips every list again once
 * the page scrolls.
 *
 * @param {HotInstance} hot The grid whose editor opens the list.
 * @returns {WindowScrollInlineMetrics} The offset of the grid's inline-start edge and the viewport's width.
 */
export function getWindowScrollInlineMetrics(hot: HotInstance): WindowScrollInlineMetrics {
  // The space is viewport-relative, so the inline-end boundary is the viewport's too, not the holder's
  // `offsetWidth`.
  const viewportWidth = hot.rootDocument.documentElement.clientWidth;

  if (hot.isRtl()) {
    return {
      inlineStartOffset: viewportWidth - hot.rootElement.getBoundingClientRect().right,
      viewportWidth,
    };
  }

  return {
    inlineStartOffset: hot.view.getTableOffset().left - hot.rootWindow.scrollX,
    viewportWidth,
  };
}
