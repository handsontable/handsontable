import { hasOwnProperty } from '../helpers/object';
import type { SourceRowData } from '../settings';

/**
 * A row key: a property path read from the source row, or a function that returns the id of a source row.
 */
export type RowIdKey = string | ((rowData: SourceRowData) => unknown);

/**
 * A row key, or no key.
 */
export type RowIdOption = RowIdKey | undefined | null;

/**
 * Tells whether a value can be a source row: an object or an array.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
export function isSourceRowData(value: unknown): value is SourceRowData {
  return typeof value === 'object' && value !== null;
}

/**
 * Reads a dot-separated property path. A step that is not an object (`null` included) ends the walk with
 * `undefined`, so a row like `{ meta: null }` has no `'meta.id'` instead of throwing. An array is read by index.
 *
 * @param {object|Array} rowData The source row.
 * @param {string} path The property path.
 * @returns {*}
 */
function readPath(rowData: SourceRowData, path: string): unknown {
  let value: unknown = rowData;

  for (const name of path.split('.')) {
    if (typeof value !== 'object' || value === null) {
      return undefined;
    }

    value = Reflect.get(value, name);
  }

  return value;
}

/**
 * Reads a string row key. The row's own property named exactly the key wins, a literal dotted key included, the
 * same as for a cell (`DataMap#get`). Otherwise a dotted key walks nested objects, whatever `dataDotNotation` says,
 * so a nested id keeps working when the option is off. The walk reads through the prototype chain, so a getter on
 * a class instance row still gives the id.
 *
 * @param {object|Array} rowData The source row.
 * @param {string} key The row key.
 * @returns {*}
 */
function readKey(rowData: SourceRowData, key: string): unknown {
  if (hasOwnProperty(rowData, key)) {
    return Reflect.get(rowData, key);
  }

  return readPath(rowData, key);
}

/**
 * Reads the id of a source row with a row key. A string key is a property of the row: its own property named
 * exactly the key first, then a dot-separated path into nested objects. A function key is called with the source
 * row.
 *
 * @param {object|Array} rowData The source row.
 * @param {string|Function|undefined|null} rowIdOption The row key.
 * @returns {*} The id, or `undefined` when there is no key, no row, or no value under the key.
 */
export function getRowIdFromRowData(rowData: unknown, rowIdOption: RowIdOption): unknown {
  if (!isSourceRowData(rowData)) {
    return undefined;
  }

  if (typeof rowIdOption === 'function') {
    return rowIdOption(rowData);
  }

  if (typeof rowIdOption === 'string') {
    return readKey(rowData, rowIdOption);
  }

  return undefined;
}
