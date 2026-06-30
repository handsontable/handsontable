import {
  compareFunctionFactory as defaultSort,
  COLUMN_DATA_TYPE as DEFAULT_DATA_TYPE,
} from '../sortFunction/default';
import {
  compareFunctionFactory as numericSort,
  COLUMN_DATA_TYPE as NUMERIC_DATA_TYPE,
} from '../sortFunction/numeric';
import {
  compareFunctionFactory as checkboxSort,
  COLUMN_DATA_TYPE as CHECKBOX_DATA_TYPE
} from '../sortFunction/checkbox';
import {
  compareFunctionFactory as dateSort,
  COLUMN_DATA_TYPE as DATE_DATA_TYPE,
} from '../sortFunction/date';
import {
  compareFunctionFactory as intlDateSort,
  COLUMN_DATA_TYPE as INTL_DATE_DATA_TYPE,
} from '../sortFunction/intlDate';
import {
  compareFunctionFactory as timeSort,
  COLUMN_DATA_TYPE as TIME_DATA_TYPE,
} from '../sortFunction/time';
import {
  compareFunctionFactory as intlTimeSort,
  COLUMN_DATA_TYPE as INTL_TIME_DATA_TYPE,
} from '../sortFunction/intlTime';
import { staticRegister } from '../../../utils/staticRegister';

const {
  register: registerCompareFunctionFactory,
  getItem: getGloballyCompareFunctionFactory,
  hasItem: hasGloballyCompareFunctionFactory,
} = staticRegister('sorting.compareFunctionFactory');

const {
  register: registerRootComparator,
  getItem: getRootComparator,
} = staticRegister('sorting.mainSortComparator');

type CompareFunctionFactory = (
  sortOrder: unknown, columnMeta: unknown, columnPluginSettings: unknown
) => (value: unknown, nextValue: unknown) => number;

/**
 * Gets sort function for the particular column basing on it's data type.
 *
 * @param {string} type The data type.
 * @returns {Function}
 */
export function getCompareFunctionFactory(type: string): CompareFunctionFactory {
  if (hasGloballyCompareFunctionFactory(type)) {
    return getGloballyCompareFunctionFactory(type) as CompareFunctionFactory;
  }

  return getGloballyCompareFunctionFactory(DEFAULT_DATA_TYPE) as CompareFunctionFactory;
}

registerCompareFunctionFactory(CHECKBOX_DATA_TYPE, checkboxSort);
registerCompareFunctionFactory(DATE_DATA_TYPE, dateSort);
registerCompareFunctionFactory(INTL_DATE_DATA_TYPE, intlDateSort);
registerCompareFunctionFactory(DEFAULT_DATA_TYPE, defaultSort);
registerCompareFunctionFactory(NUMERIC_DATA_TYPE, numericSort);
registerCompareFunctionFactory(TIME_DATA_TYPE, timeSort);
registerCompareFunctionFactory(INTL_TIME_DATA_TYPE, intlTimeSort);

export {
  registerRootComparator,
  getRootComparator
};
