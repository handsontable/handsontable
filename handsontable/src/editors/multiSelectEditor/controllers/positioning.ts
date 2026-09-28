/**
 * Horizontal placement helpers for the `MultiSelectEditor` dropdown.
 *
 * Vertical flipping lives on `DropdownController`. Horizontal flipping uses the
 * same space comparison as `HandsontableEditor.flipDropdownHorizontallyIfNeeded()`
 * and is applied to the editor wrapper, which already owns `left` / `right`.
 *
 * These helpers stay local: `HandsontableEditor` applies a relative offset on a
 * nested container, not an absolute wrapper offset, so sharing the pair would
 * change four editors (autocomplete / dropdown inherit that class).
 *
 * The flip decision is evaluated when the editor opens or the grid scrolls —
 * not on filter keystrokes or check/uncheck. Re-running it as the list width
 * changes would jump the dropdown from one side to the other while the user types.
 */

/**
 * Edited-cell box fields the inline-space calculation needs.
 *
 * Callers pass the already-fetched `getEditedCellRect()` result so the layout
 * is not forced a second time on the same refresh.
 */
export type CellInlineBox = {
  start: number;
  width: number;
};

/**
 * Optional window-scroll adjustment for `getDropdownInlineSpace()`.
 *
 * When the table scrolls with the window, `spaceInlineStart` is viewport-relative
 * and the right boundary must be the viewport width, not the holder's offsetWidth.
 */
export type WindowScrollInlineMetrics = {
  inlineStartOffset: number;
  viewportWidth: number;
};

/**
 * Returns `true` when the dropdown should open toward the inline start.
 *
 * Matches `HandsontableEditor`: the list does not fit in the remaining
 * inline-end space, and the inline-start side of the cell has more room.
 * The start side does not have to fit the list — a leftover overhang is the
 * same tradeoff autocomplete and dropdown already make.
 *
 * @param {number} dropdownWidth Pixel width of the dropdown box, including padding and border.
 * @param {number} spaceInlineStart Space from the workspace inline start to the cell's inline end.
 * @param {number} spaceInlineEnd Space from the cell's inline start to the workspace inline end.
 * @returns {boolean}
 */
export function shouldFlipDropdownHorizontally(
  dropdownWidth: number,
  spaceInlineStart: number,
  spaceInlineEnd: number
): boolean {
  return dropdownWidth > spaceInlineEnd && spaceInlineStart > spaceInlineEnd;
}

/**
 * Returns the inline-start offset that aligns the dropdown's inline end with the cell's inline end.
 *
 * @param {number} start Inline-start position of the edited cell.
 * @param {number} dropdownWidth Pixel width of the dropdown box.
 * @param {number} cellWidth Pixel width of the edited cell.
 * @returns {number}
 */
export function getFlippedInlineStartOffset(
  start: number,
  dropdownWidth: number,
  cellWidth: number
): number {
  return start - (dropdownWidth - cellWidth);
}

/**
 * Calculates the remaining inline-start and inline-end space around the edited cell.
 *
 * Uses the same workspace / window-scroll split as
 * `HandsontableEditor.flipDropdownHorizontallyIfNeeded()`. The cell box is an
 * argument so `refreshDimensions()` can reuse one `getEditedCellRect()` read.
 *
 * @param {object} cellRect Edited-cell start and width from `getEditedCellRect()`.
 * @param {number} cellRect.start Inline-start position of the cell.
 * @param {number} cellRect.width Pixel width of the cell.
 * @param {number} workspaceWidth Width of the grid workspace in pixels.
 * @param {object} [windowScroll] Viewport metrics when the table scrolls with the window.
 * @param {number} [windowScroll.inlineStartOffset] Table offset minus window scroll on the inline axis.
 * @param {number} [windowScroll.viewportWidth] Viewport width used as the workspace when window-scrolled.
 * @returns {object} Remaining inline-start and inline-end space in pixels.
 */
export function getDropdownInlineSpace(
  cellRect: CellInlineBox,
  workspaceWidth: number,
  windowScroll?: WindowScrollInlineMetrics
): { spaceInlineStart: number; spaceInlineEnd: number } {
  let spaceInlineStart = cellRect.start + cellRect.width;
  let resolvedWorkspaceWidth = workspaceWidth;

  if (windowScroll) {
    spaceInlineStart = Math.max(spaceInlineStart + windowScroll.inlineStartOffset, 0);
    resolvedWorkspaceWidth = windowScroll.viewportWidth;
  }

  return {
    spaceInlineStart,
    spaceInlineEnd: resolvedWorkspaceWidth - spaceInlineStart + cellRect.width,
  };
}
