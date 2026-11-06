/**
 * Tells whether two rows hold the same values: the same object, or two arrays, or two plain objects, whose
 * cells are strictly equal. A cell is compared by reference, so a nested object that was copied reads as
 * another value.
 *
 * @param {*} previous A row of the dataset the history was recorded on.
 * @param {*} next The row at the same index of the new dataset.
 * @returns {boolean}
 */
function haveEqualValues(previous: unknown, next: unknown): boolean {
  if (previous === next) {
    return true;
  }

  if (Array.isArray(previous) && Array.isArray(next)) {
    return previous.length === next.length && previous.every((value, column) => value === next[column]);
  }

  if (isPlainObject(previous) && isPlainObject(next)) {
    const keys = Object.keys(previous);

    return keys.length === Object.keys(next).length &&
      keys.every(key => Object.prototype.hasOwnProperty.call(next, key) && previous[key] === next[key]);
  }

  return false;
}

/**
 * Tells whether a value is an object literal, or an object with no prototype.
 *
 * @param {*} value The value to test.
 * @returns {boolean}
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const prototype = Reflect.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

/**
 * Tells whether a dataset holds the rows another one holds, in the same order: the same array, a copy of it
 * (`data.slice()`, `[...data]`), or, with `byValue`, an array whose rows hold the same values as the rows
 * they stand for (an immutable row update that copied the edited row). The grid writes into the rows of its
 * array in place, so the rows of the previous array hold what the grid shows now.
 *
 * Rows are compared by reference first, and the values of a row only when its reference differs and `byValue`
 * is set. The first difference ends the walk.
 *
 * @param {Array|null} previous The rows the history was recorded on.
 * @param {Array} next The rows an `updateData()` call brings.
 * @param {boolean} [byValue] `true` to also accept a row that is another object with the same values.
 * @returns {boolean}
 */
export function hasSameRows(previous: unknown[] | null, next: unknown[], byValue = false): boolean {
  if (previous === null) {
    return false;
  }

  if (previous === next) {
    return true;
  }

  // A duck-typed collection (`push` and `splice` are all `replaceData()` requires) has no rows to compare.
  if (!Array.isArray(previous) || !Array.isArray(next)) {
    return false;
  }

  const rowsCount = next.length;

  if (previous.length !== rowsCount) {
    return false;
  }

  for (let row = 0; row < rowsCount; row += 1) {
    if (previous[row] !== next[row] && !(byValue && haveEqualValues(previous[row], next[row]))) {
      return false;
    }
  }

  return true;
}
