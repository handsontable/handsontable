import { getProperty } from '../helpers/object';
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
 * Reads the id of a source row with a row key. A string key is a property path (dot notation walks nested
 * objects), and a function key is called with the source row.
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
    // `getProperty` walks any object by key; an array row is read by index the same way.
    return getProperty(rowData as Record<string, unknown>, rowIdOption);
  }

  return undefined;
}
