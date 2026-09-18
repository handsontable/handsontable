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
import {
  compareFunctionFactory as intlDatetimeSort,
  COLUMN_DATA_TYPE as INTL_DATETIME_DATA_TYPE,
} from '../sortFunction/intlDatetime';
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

export type PositionComparatorFactory = (
  sortingOrders: unknown[], columnMetas: unknown[], columnValues: unknown[][]
) => (position: number, nextPosition: number) => number;

/**
 * The built-in root comparators, keyed by the comparator function itself, each mapped to the
 * equivalent comparator over parallel value arrays.
 *
 * The key is the function, never the plugin id: `staticRegister.register()` replaces silently, so
 * `registerRootComparator('columnSorting', myComparator)` overwrites the built-in under the very
 * key the plugin sorts with. A key whitelist would take the parallel-array path and never call
 * that comparator - a lookup through the registry can only match when the function registered
 * right now is one of ours.
 */
const builtInRootComparators = new Map<unknown, unknown>();

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
registerCompareFunctionFactory(INTL_DATETIME_DATA_TYPE, intlDatetimeSort);

/**
 * Declares a root comparator as built-in and pairs it with the comparator factory that compares
 * two positions against parallel value arrays instead of two `[rowIndex, ...values]` tuples.
 *
 * @param {Function} rootComparator The built-in root comparator function.
 * @param {Function} positionComparatorFactory The equivalent factory working on parallel value arrays.
 */
function markBuiltInRootComparator(rootComparator: unknown, positionComparatorFactory: unknown) {
  builtInRootComparators.set(rootComparator, positionComparatorFactory);
}

/**
 * Gets the parallel-value-arrays comparator factory equivalent to the root comparator registered
 * under the given id, or `undefined` when that comparator is not a built-in one.
 *
 * Call it on every sort run - the registry is global and mutable, so the answer can change between
 * two sorts of the same table.
 *
 * @param {string} rootComparatorId The comparator logic to look up.
 * @returns {Function|undefined}
 */
function getBuiltInPositionComparator(rootComparatorId: string): PositionComparatorFactory | undefined {
  return builtInRootComparators.get(getRootComparator(rootComparatorId)) as PositionComparatorFactory | undefined;
}

export {
  registerRootComparator,
  getRootComparator,
  markBuiltInRootComparator,
  getBuiltInPositionComparator
};
