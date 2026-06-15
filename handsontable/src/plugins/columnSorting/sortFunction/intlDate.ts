import { createIntlDateCompareFunction } from '../utils';

/**
 * Date sorting compare function factory. Method get as parameters `sortOrder` and `columnMeta` and return compare function.
 *
 * @param sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @param columnMeta Column meta object.
 * @param columnPluginSettings Plugin settings for the column.
 * @returns The compare function.
 */
export function compareFunctionFactory(
  sortOrder: string,
  _columnMeta: Record<string, unknown>,
  columnPluginSettings: Record<string, unknown>
) {
  return createIntlDateCompareFunction(sortOrder, columnPluginSettings);
}

export const COLUMN_DATA_TYPE = 'intl-date';
