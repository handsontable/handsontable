import { DO_NOT_SWAP, FIRST_BEFORE_SECOND, FIRST_AFTER_SECOND } from '../sortService';
import { compareFunctionFactory as defaultCompareFunctionFactory } from '../sortFunction/default';
import { isEmpty } from '../../../helpers/mixed';

/**
 * Resolves the sort order result for two checkbox values that are both from the template.
 *
 * @param {unknown} unifiedValue The first unified value.
 * @param {unknown} unifiedNextValue The second unified value.
 * @param {unknown} checkedTemplate The checked template value.
 * @param {unknown} uncheckedTemplate The unchecked template value.
 * @param {string} sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @returns {number} The comparison result.
 */
function compareTemplateValues(
  unifiedValue: unknown, unifiedNextValue: unknown,
  checkedTemplate: unknown, uncheckedTemplate: unknown,
  sortOrder: string
): number {
  if (unifiedValue === uncheckedTemplate && unifiedNextValue === checkedTemplate) {
    return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
  }

  if (unifiedValue === checkedTemplate && unifiedNextValue === uncheckedTemplate) {
    return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
  }

  return DO_NOT_SWAP;
}

/**
 * Resolves the sort order result when at least one value is not from the checkbox template.
 *
 * @param {boolean} isValueFromTemplate Whether the first value is from the template.
 * @param {boolean} isNextValueFromTemplate Whether the second value is from the template.
 * @param {string} sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @param {object} columnMeta Column meta object.
 * @param {object} columnPluginSettings Plugin settings for the column.
 * @param {unknown} value The first value.
 * @param {unknown} nextValue The second value.
 * @returns {number | null} The comparison result or null if both values are from template.
 */
function compareBadValues(
  isValueFromTemplate: boolean, isNextValueFromTemplate: boolean,
  sortOrder: string, columnMeta: Record<string, unknown>,
  columnPluginSettings: Record<string, unknown>,
  value: unknown, nextValue: unknown
): number | null {
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

  return null;
}

/**
 * Checkbox sorting compare function factory. Method get as parameters `sortOrder` and `columnMeta` and return compare function.
 *
 * @param {string} sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @param {object} columnMeta Column meta object.
 * @param {object} columnPluginSettings Plugin settings for the column.
 * @returns {Function} The compare function.
 */
export function compareFunctionFactory(
  sortOrder: string, columnMeta: Record<string, unknown>, columnPluginSettings: Record<string, unknown>
) {
  const checkedTemplate = columnMeta.checkedTemplate;
  const uncheckedTemplate = columnMeta.uncheckedTemplate;
  const { sortEmptyCells } = columnPluginSettings;

  return function(value: unknown, nextValue: unknown) {
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

    const badValueResult = compareBadValues(
      isValueFromTemplate, isNextValueFromTemplate,
      sortOrder, columnMeta, columnPluginSettings, value, nextValue
    );

    if (badValueResult !== null) {
      return badValueResult;
    }

    return compareTemplateValues(unifiedValue, unifiedNextValue, checkedTemplate, uncheckedTemplate, sortOrder);
  };
}

export const COLUMN_DATA_TYPE = 'checkbox';
