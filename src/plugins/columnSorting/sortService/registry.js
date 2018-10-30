import { compareFunctionFactory as defaultSort, COLUMN_DATA_TYPE as DEFAULT_DATA_TYPE } from '../sortFunction/default';
import { compareFunctionFactory as numericSort, COLUMN_DATA_TYPE as NUMERIC_DATA_TYPE } from '../sortFunction/numeric';
import { compareFunctionFactory as dateSort, COLUMN_DATA_TYPE as DATE_DATA_TYPE } from '../sortFunction/date';
import staticRegister from '../../../utils/staticRegister';

const {
  register: registerCompareFunctionFactory,
  getItem: getGloballyCompareFunctionFactory,
  hasItem: hasGloballyCompareFunctionFactory,
} = staticRegister('sorting.compareFunctionFactory');

const {
  register: registerRootComparator,
  getItem: getRootComparator,
} = staticRegister('sorting.mainSortComparator');

/**
 * Gets sort function for the particular column basing on it's data type.
 *
 * @param {String} dataType Data type for the particular column.
 * @returns {Function}
 */
export function getCompareFunctionFactory(type) {
  if (hasGloballyCompareFunctionFactory(type)) {
    return getGloballyCompareFunctionFactory(type);
  }

  return getGloballyCompareFunctionFactory(DEFAULT_DATA_TYPE);
}

registerCompareFunctionFactory(NUMERIC_DATA_TYPE, numericSort);
registerCompareFunctionFactory(DATE_DATA_TYPE, dateSort);
registerCompareFunctionFactory(DEFAULT_DATA_TYPE, defaultSort);

export {
  registerRootComparator,
  getRootComparator
};
