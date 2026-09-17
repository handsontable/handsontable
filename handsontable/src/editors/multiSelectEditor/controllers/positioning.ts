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
 */

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
