import { isEmpty } from '../../../helpers/mixed';
import { DO_NOT_SWAP, FIRST_BEFORE_SECOND, FIRST_AFTER_SECOND } from '../sortService';

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

    if (typeof value === 'boolean') {
      value = Number(value);
    }

    if (typeof nextValue === 'boolean') {
      nextValue = Number(nextValue);
    }

    if (typeof value === 'string') {
      value = value.toLocaleLowerCase(locale);
    }

    if (typeof nextValue === 'string') {
      nextValue = nextValue.toLocaleLowerCase(locale);
    }

    if (value === nextValue) {
      return DO_NOT_SWAP;
    }

    if (isEmpty(value)) {
      if (isEmpty(nextValue)) {
        return DO_NOT_SWAP;
      }

      // Just fist value is empty and `sortEmptyCells` option was set
      if (sortEmptyCells) {
        return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
      }

      return FIRST_AFTER_SECOND;
    }

    if (isEmpty(nextValue)) {
      // Just second value is empty and `sortEmptyCells` option was set
      if (sortEmptyCells) {
        return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
      }

      return FIRST_BEFORE_SECOND;
    }

    if (isNaN(value as number) && !isNaN(nextValue as number)) {
      return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;

    } else if (!isNaN(value as number) && isNaN(nextValue as number)) {
      return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;

    } else if (!(isNaN(value as number) || isNaN(nextValue as number))) {
      value = parseFloat(String(value));
      nextValue = parseFloat(String(nextValue));
    }

    if (value < nextValue) {
      return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
    }

    if (value > nextValue) {
      return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
    }

    return DO_NOT_SWAP;
  };
}

export const COLUMN_DATA_TYPE = 'default';
