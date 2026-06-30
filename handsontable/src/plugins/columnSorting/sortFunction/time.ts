import { createIntlTimeCompareFunction } from '../utils';

/**
 * Date sorting compare function factory. Method get as parameters `sortOrder` and `columnMeta` and return compare function.
 *
 * @param {string} sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @param {object} _columnMeta Column meta object (unused).
 * @param {object} columnPluginSettings Plugin settings for the column.
 * @returns {Function} The compare function.
 */
export function compareFunctionFactory(
  sortOrder: string, _columnMeta: Record<string, unknown>, columnPluginSettings: Record<string, unknown>
) {
  return createIntlTimeCompareFunction(sortOrder, columnPluginSettings);
}

export const COLUMN_DATA_TYPE = 'time';
