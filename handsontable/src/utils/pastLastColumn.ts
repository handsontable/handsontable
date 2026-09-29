/**
 * Tells whether `setDataAtCell()` skips a change addressed to the visual column `column`.
 *
 * It does so for a column past the last one of a data source whose rows are not arrays. An object
 * row cannot gain a column, so the index would only become a property the data schema never declared
 * (#5409). A function `dataSchema` sets `dataType` to `'function'` and is just as object-rowed, which
 * is why the test is `!== 'array'` rather than `=== 'object'`. A grid that declares no columns at all
 * is exempt: there every index is past the last column, and writing is how an empty dataset gets
 * bootstrapped.
 *
 * `Core#setDataAtCell()` uses it to skip the change. UndoRedo uses it to route a replayed change
 * around the grid, because a skipped change fires no `afterChange` and the undo settles on that hook.
 * Both must read the same rule, which is why it lives here.
 *
 * @param {string} dataType The grid's data type - `'array'`, `'object'` or `'function'`.
 * @param {number} countCols The number of columns the grid has.
 * @param {number} column The visual column index the change addresses.
 * @returns {boolean} `true` when the change is skipped.
 */
export function isSkippedPastLastColumn(dataType: string, countCols: number, column: number): boolean {
  return dataType !== 'array' && countCols > 0 && column >= countCols;
}
