import { DO_NOT_SWAP, FIRST_BEFORE_SECOND, FIRST_AFTER_SECOND } from '../sortService';
import { compareFunctionFactory as defaultCompareFunctionFactory } from '../sortFunction/default';
import { isEmpty } from '../../../helpers/mixed';

/**
 * Checkbox sorting compare function factory. Method get as parameters `sortOrder` and `columnMeta` and return compare function.
 *
 * @param {string} sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @param {object} columnMeta Column meta object.
 * @param {object} columnPluginSettings Plugin settings for the column.
 * @returns {Function} The compare function.
 */
export function compareFunctionFactory(sortOrder, columnMeta, columnPluginSettings) {
  const checkedTemplate = columnMeta.checkedTemplate;
  const uncheckedTemplate = columnMeta.uncheckedTemplate;
  const { sortEmptyCells } = columnPluginSettings;

  return function(value, nextValue) {
    const isEmptyValue = isEmpty(value);
    const isEmptyNextValue = isEmpty(nextValue);
    const unifiedValue = isEmptyValue ? uncheckedTemplate : value;
    const unifiedNextValue = isEmptyNextValue ? uncheckedTemplate : nextValue;
    const isValueFromTemplate = unifiedValue === uncheckedTemplate || unifiedValue === checkedTemplate;
    const isNextValueFromTemplate = unifiedNextValue === uncheckedTemplate || unifiedNextValue === checkedTemplate;

    // As an empty cell we recognize cells with undefined, null and '' values.
    if (sortEmptyCells === false) {
      if (isEmptyValue && isEmptyNextValue === false) {
        return FIRST_AFTER_SECOND;
      }

      if (isEmptyValue === false && isEmptyNextValue) {
        return FIRST_BEFORE_SECOND;
      }
    }

    // 1st value === #BAD_VALUE#
    if (isValueFromTemplate === false && isNextValueFromTemplate) {
      return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
    }

    // 2nd value === #BAD_VALUE#
    if (isValueFromTemplate && isNextValueFromTemplate === false) {
      return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
    }

    // 1st value === #BAD_VALUE# && 2nd value === #BAD_VALUE#
    if (isValueFromTemplate === false && isNextValueFromTemplate === false) {
      // Sorting by values (not just by visual representation).
      return defaultCompareFunctionFactory(sortOrder, columnMeta, columnPluginSettings)(value, nextValue);
    }

    if (unifiedValue === uncheckedTemplate && unifiedNextValue === checkedTemplate) {
      return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
    }

    if (unifiedValue === checkedTemplate && unifiedNextValue === uncheckedTemplate) {
      return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
    }

    return DO_NOT_SWAP;
  };
}

export const COLUMN_DATA_TYPE = 'checkbox';
