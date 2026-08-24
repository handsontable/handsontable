import { createDateTimeCompareFunction } from '../utils';

/**
 * Intl date-time sorting compare function factory.
 *
 * @param {string} sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @param {object} _columnMeta Column meta object (unused).
 * @param {object} columnPluginSettings Plugin settings for the column.
 * @returns {Function} The compare function.
 */
export function compareFunctionFactory(
  sortOrder: string, _columnMeta: Record<string, unknown>, columnPluginSettings: Record<string, unknown>
) {
  return createDateTimeCompareFunction(sortOrder, columnPluginSettings);
}

export const COLUMN_DATA_TYPE = 'intl-datetime';
