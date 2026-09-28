/**
 * Clips a removal of `amount` rows or columns that starts at the visual index `start` to the part that
 * exists in a grid with `count` of them.
 *
 * A start above the first row or column is moved to `0`, and the amount shrinks by the part that fell
 * outside. A start at or past the last row or column names nothing. The range is checked against
 * `count` only after the clipping, so a grid with no rows or columns rejects a clipped start of `0`
 * as well - checked before it, an empty grid ran the removal from `0`.
 *
 * `Core#alter()` uses it to skip removals that name no row or column (DEV-117). UndoRedo uses it for
 * `canUndo()` / `canRedo()`, so the undo stack can tell whether a removal would change the grid before
 * any hook runs. Both must read the same rule, which is why it lives here.
 *
 * Pass integer indexes only. A missing index is `alter()`'s "take the rows from the end" case, which is
 * not a range and must not be clipped.
 *
 * @param {number} start The visual index the removal starts at.
 * @param {number} amount The number of rows or columns to remove.
 * @param {number} count The number of rows or columns the grid has.
 * @returns {object|null} The part of the removal inside the grid, as `{ start, amount }`, or `null` when the
 * removal names no row or column.
 */
export function clipRemovalRange(
  start: number,
  amount: number,
  count: number,
): { start: number, amount: number } | null {
  let clippedStart = start;
  let clippedAmount = amount;

  if (clippedStart < 0) {
    // `clippedStart` is negative here, so this subtracts the part above the first row or column.
    clippedAmount += clippedStart;

    if (clippedAmount <= 0) {
      return null;
    }

    clippedStart = 0;
  }

  if (clippedStart >= count) {
    return null;
  }

  return { start: clippedStart, amount: clippedAmount };
}
