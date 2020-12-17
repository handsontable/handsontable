import { isNumeric } from '../../helpers/number';
import { isFunction } from '../../helpers/function';

/* eslint-disable import/prefer-default-export */
export const ASC = 'asc';
export const DESC = 'desc';
const ORDER_MAP = new Map([
  [ASC, [-1, 1]],
  [DESC, [1, -1]],
]);
const DEFAULT_ERROR_PRIORITY_EXISTS = priority => `The priority '${priority}' is already declared in a queue.`;
const DEFAULT_ERROR_PRIORITY_NAN = priority => `The priority '${priority}' is not a number.`;

/**
 * @typedef {object} PriorityQueue
 * @property {(priority: number, item: *) => void} addItem Adds items to the priority queue.
 * @property {() => *[]} getItems Gets items from the passed queue in a ASC or DESC order of priorities.
 */
/**
 * Creates a new priority queue.
 *
 * @param {object} config The config for priority queue.
 * @param {(priority: number) => string} config.errorPriorityExists The function to generate a custom error message if priority is already taken.
 * @param {(priority: number) => string} config.errorPriorityNan The function to generate a custom error message if priority is not a number.
 * @returns {PriorityQueue}
 */
export function createPriorityQueue({ errorPriorityExists, errorPriorityNan } = {}) {
  const queue = new Map();

  errorPriorityExists = isFunction(errorPriorityExists) ? errorPriorityExists : DEFAULT_ERROR_PRIORITY_EXISTS;
  errorPriorityNan = isFunction(errorPriorityNan) ? errorPriorityNan : DEFAULT_ERROR_PRIORITY_NAN;

  /**
   * Adds items to priority queue.
   *
   * @param {number} priority The priority for adding item.
   * @param {*} item The adding item.
   */
  function addItem(priority, item) {
    if (!isNumeric(priority)) {
      throw new Error(errorPriorityNan(priority));
    }
    if (queue.has(priority)) {
      throw new Error(errorPriorityExists(priority));
    }

    queue.set(priority, item);
  }

  /**
   * Gets items from the passed queue in a ASC or DESC order of priorities.
   *
   * @param {string} [order] The order for getting items. ASC is an default.
   * @returns {*[]}
   */
  function getItems(order = ASC) {
    const [left, right] = ORDER_MAP.get(order) || ORDER_MAP.get(ASC);

    return [...queue]
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
