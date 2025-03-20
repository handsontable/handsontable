import { isNumeric } from '../../helpers/number';
import { isFunction } from '../../helpers/function';

export const ASC = 'asc';
export const DESC = 'desc';
export type SortOrder = typeof ASC | typeof DESC;

const ORDER_MAP = new Map<SortOrder, [number, number]>([
  [ASC, [-1, 1]],
  [DESC, [1, -1]],
]);
const DEFAULT_ERROR_PRIORITY_EXISTS = (priority: number): string => `The priority '${priority}' is already declared in a map.`;
const DEFAULT_ERROR_PRIORITY_NAN = (priority: any): string => `The priority '${priority}' is not a number.`;

/**
 * @typedef {object} PriorityMap
 * @property {Function} addItem Adds items to the priority map.
 * @property {Function} getItems Gets items from the passed map in a ASC or DESC order of priorities.
 */
export interface PriorityMap<T> {
  /**
   * Adds items to priority map. Throws an error if `priority` is not a number or if is already added.
   */
  addItem(priority: number, item: T): void;
  /**
   * Gets items from the passed map in a ASC or DESC order of priorities.
   */
  getItems(order?: SortOrder): T[];
}

interface PriorityMapConfig {
  errorPriorityExists?: (priority: number) => string;
  errorPriorityNaN?: (priority: any) => string;
}

/**
 * Creates a new priority map.
 *
 * @param {object} config The config for priority map.
 * @param {Function} config.errorPriorityExists The function to generate a custom error message if priority is already taken.
 * @param {Function} config.errorPriorityNaN The function to generate a custom error message if priority is not a number.
 * @returns {PriorityMap}
 */
export function createPriorityMap<T>({ errorPriorityExists, errorPriorityNaN }: PriorityMapConfig = {}): PriorityMap<T> {
  const priorityMap = new Map<number, T>();

  const errorPriorityExistsFn = isFunction(errorPriorityExists) ? errorPriorityExists : DEFAULT_ERROR_PRIORITY_EXISTS;
  const errorPriorityNaNFn = isFunction(errorPriorityNaN) ? errorPriorityNaN : DEFAULT_ERROR_PRIORITY_NAN;

  /**
   * Adds items to priority map. Throws an error if `priority` is not a number or if is already added.
   *
   * @param {number} priority The priority for adding item.
   * @param {*} item The adding item.
   */
  function addItem(priority: number, item: T): void {
    if (!isNumeric(priority)) {
      throw new Error(errorPriorityNaNFn(priority));
    }
    if (priorityMap.has(priority)) {
      throw new Error(errorPriorityExistsFn(priority));
    }

    priorityMap.set(priority, item);
  }

  /**
   * Gets items from the passed map in a ASC or DESC order of priorities.
   *
   * @param {string} [order] The order for getting items. ASC is an default.
   * @returns {*}
   */
  function getItems(order: SortOrder = ASC): T[] {
    const [left, right] = ORDER_MAP.get(order) || ORDER_MAP.get(ASC) as [number, number];

    return [...priorityMap]
      // we want to be sure we sort over a priority key
      // if we are sure we can remove custom compare function
      // then we should replace next line with a default `.sort()`
      .sort((a, b) => (a[0] < b[0] ? left : right))
      .map(item => item[1]);
  }

  return {
    addItem,
    getItems,
  };
}
