import { createIntlTimeCompareFunction } from '../utils';

/**
 * Time sorting compare function factory. Method get as parameters `sortOrder` and `columnMeta` and return compare function.
 *
 * @param {string} sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @param {object} columnMeta Column meta object.
 * @param {object} columnPluginSettings Plugin settings for the column.
 * @returns {Function} The compare function.
 */
export function compareFunctionFactory(sortOrder, columnMeta, columnPluginSettings) {
  return createIntlTimeCompareFunction(sortOrder, columnMeta.timeFormat, columnPluginSettings);
}

export const COLUMN_DATA_TYPE = 'intl-time';
