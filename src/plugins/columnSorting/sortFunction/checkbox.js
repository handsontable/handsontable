import { DO_NOT_SWAP, FIRST_BEFORE_SECOND, FIRST_AFTER_SECOND } from '../sortService';

/**
 * Checkbox sorting compare function factory. Method get as parameters `sortOrder` and `columnMeta` and return compare function.
 *
 * @param {string} sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @param {object} columnMeta Column meta object.
 * @returns {Function} The compare function.
 */
export function compareFunctionFactory(sortOrder, columnMeta) {
  const checkedTemplate = columnMeta.checkedTemplate;
  const uncheckedTemplate = columnMeta.uncheckedTemplate;

  return function(value, nextValue) {
    if (value === uncheckedTemplate && nextValue === checkedTemplate) {
      if (sortOrder === 'asc') {
        return FIRST_BEFORE_SECOND;
      }

      return FIRST_AFTER_SECOND;
    }

    if (value === checkedTemplate && nextValue === uncheckedTemplate) {
      if (sortOrder === 'asc') {
        return FIRST_AFTER_SECOND;
      }

      return FIRST_BEFORE_SECOND;
    }

    return DO_NOT_SWAP;
  };
}

export const COLUMN_DATA_TYPE = 'checkbox';
