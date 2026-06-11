import { isEmpty } from '../../../helpers/mixed';
import { DO_NOT_SWAP, FIRST_BEFORE_SECOND, FIRST_AFTER_SECOND } from '../sortService';

/**
 * Normalizes a cell value for comparison by converting booleans to numbers and strings to lowercase.
 *
 * @param {unknown} value The value to normalize.
 * @param {string | undefined} locale The locale to use for string lowercasing.
 * @returns {unknown} The normalized value.
 */
function normalizeValue(value: unknown, locale: string | undefined): unknown {
  if (typeof value === 'boolean') {
    return Number(value);
  }

  if (typeof value === 'string') {
    return value.toLocaleLowerCase(locale);
  }

  return value;
}

/**
 * Compares two non-empty values, handling NaN and numeric coercion.
 *
 * @param {unknown} value The first value.
 * @param {unknown} nextValue The second value.
 * @param {string} sortOrder The sort order (`asc` or `desc`).
 * @returns {number} The comparison result.
 */
function compareNonEmptyValues(value: unknown, nextValue: unknown, sortOrder: string): number {
  const valueIsNaN = isNaN(value as number);
  const nextValueIsNaN = isNaN(nextValue as number);

  if (valueIsNaN && !nextValueIsNaN) {
    return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
  }

  if (!valueIsNaN && nextValueIsNaN) {
    return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
  }

  let comparableValue = value;
  let comparableNextValue = nextValue;

  if (!valueIsNaN && !nextValueIsNaN) {
    comparableValue = parseFloat(String(value));
    comparableNextValue = parseFloat(String(nextValue));
  }

  const a = comparableValue as string | number;
  const b = comparableNextValue as string | number;

  if (a < b) {
    return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
  }

  if (a > b) {
    return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
  }

  return DO_NOT_SWAP;
}

/**
 * Default sorting compare function factory. Method get as parameters `sortOrder` and `columnMeta` and return compare function.
 *
 * @param {string} sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @param {object} columnMeta Column meta object.
 * @param {object} columnPluginSettings Plugin settings for the column.
 * @returns {Function} The compare function.
 */
export function compareFunctionFactory(
  sortOrder: string, columnMeta: Record<string, unknown>, columnPluginSettings: Record<string, unknown>
) {
  const locale = columnMeta.locale as string | undefined;

  return function(value: unknown, nextValue: unknown) {
    const { sortEmptyCells } = columnPluginSettings;

    const normalizedValue = normalizeValue(value, locale);
    const normalizedNextValue = normalizeValue(nextValue, locale);

    if (normalizedValue === normalizedNextValue) {
      return DO_NOT_SWAP;
    }

    if (isEmpty(normalizedValue)) {
      if (isEmpty(normalizedNextValue)) {
        return DO_NOT_SWAP;
      }

      // Just fist value is empty and `sortEmptyCells` option was set
      if (sortEmptyCells) {
        return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
      }

      return FIRST_AFTER_SECOND;
    }

    if (isEmpty(normalizedNextValue)) {
      // Just second value is empty and `sortEmptyCells` option was set
      if (sortEmptyCells) {
        return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
      }

      return FIRST_BEFORE_SECOND;
    }

    return compareNonEmptyValues(normalizedValue, normalizedNextValue, sortOrder);
  };
}

export const COLUMN_DATA_TYPE = 'default';
