import { DO_NOT_SWAP, FIRST_BEFORE_SECOND, FIRST_AFTER_SECOND } from '../sortService';
import { isUndefined } from '../../../helpers/mixed';

const isEmptyCell = (value) => {
  return value === '' || value === null || isUndefined(value);
};

const emptyCellToFalsyValue = (value, falsyValue) => {
  if (isEmptyCell(value)) {
    return falsyValue;
  }

  return value;
};

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
    const unifiedValue = emptyCellToFalsyValue(value, uncheckedTemplate);
    const unifiedNextValue = emptyCellToFalsyValue(nextValue, uncheckedTemplate);
    const isValueFromTemplate = unifiedValue === uncheckedTemplate || unifiedValue === checkedTemplate;
    const isNextValueFromTemplate = unifiedNextValue === uncheckedTemplate || unifiedNextValue === checkedTemplate;

    // As an empty cell we recognize cells with undefined, null and '' values.
    if (sortEmptyCells === false && (isEmptyCell(value) || isEmptyCell(nextValue))) {
      if (isEmptyCell(value) && isEmptyCell(nextValue) === false) {
        return FIRST_AFTER_SECOND;
      }

      if (isEmptyCell(value) === false && isEmptyCell(nextValue)) {
        return FIRST_BEFORE_SECOND;
      }

      return DO_NOT_SWAP;
    }

    // 1st value === #BAD_VALUE#
    if (isValueFromTemplate === false && isNextValueFromTemplate) {
      if (sortOrder === 'asc') {
        return FIRST_BEFORE_SECOND;
      }

      return FIRST_AFTER_SECOND;
    }

    // 2nd value === #BAD_VALUE#
    if (isValueFromTemplate && isNextValueFromTemplate === false) {
      if (sortOrder === 'asc') {
        return FIRST_AFTER_SECOND;
      }

      return FIRST_BEFORE_SECOND;
    }

    if (unifiedValue === uncheckedTemplate && unifiedNextValue === checkedTemplate) {
      if (sortOrder === 'asc') {
        return FIRST_BEFORE_SECOND;
      }

      return FIRST_AFTER_SECOND;
    }

    if (unifiedValue === checkedTemplate && unifiedNextValue === uncheckedTemplate) {
      if (sortOrder === 'asc') {
        return FIRST_AFTER_SECOND;
      }

      return FIRST_BEFORE_SECOND;
    }

    return DO_NOT_SWAP;
  };
}

export const COLUMN_DATA_TYPE = 'checkbox';
