/**
 * Tells whether a `setDataAtCell()` change addressed to the visual column `column` writes past the
 * last column of an object data source. Such a write is deprecated in 19.0.0, with a one-time console
 * warning, and is skipped from 20.0.0 on.
 *
 * It does so for a column past the last one of a data source whose rows are not arrays. An object
 * row cannot gain a column, so the index would only become a property the data schema never declared
 * (#5409). A function `dataSchema` sets `dataType` to `'function'` and is just as object-rowed, which
 * is why the test is `!== 'array'` rather than `=== 'object'`. A grid that declares no columns at all
 * is exempt: there every index is past the last column, and writing is how an empty dataset gets
 * bootstrapped.
 *
 * `Core#setDataAtCell()` reads it to warn. The 20.0 removal reads the same predicate to skip the
 * change, which is why the rule lives in its own module.
 *
 * @param {string} dataType The grid's data type - `'array'`, `'object'` or `'function'`.
 * @param {number} countCols The number of columns the grid has.
 * @param {number} column The visual column index the change addresses.
 * @returns {boolean} `true` when the change writes past the last column of an object data source.
 */
export function isSkippedPastLastColumn(dataType: string, countCols: number, column: number): boolean {
  return dataType !== 'array' && countCols > 0 && column >= countCols;
}
