import { isFunction } from '../../helpers/function';

/* eslint-disable import/prefer-default-export */
const DEFAULT_ERROR_ITEM_EXISTS = item => `'${item}' value is already declared in a unique queue.`;

/**
 * @typedef {object} UniqueQueue
 * @property {Function} addItem Adds items to the priority queue.
 * @property {Function} getItems Gets items from the queue in order of addition.
 */
/**
 * Creates a new unique queue.
 *
 * @param {object} config The config for priority queue.
 * @param {Function} config.errorItemExists The function to generate custom error message if item is already in the queue.
 * @returns {UniqueQueue}
 */
export function createUniqueQueue({ errorItemExists } = {}) {
  const queue = new Set();

  errorItemExists = isFunction(errorItemExists) ? errorItemExists : DEFAULT_ERROR_ITEM_EXISTS;

  /**
   * Adds items to the unique queue.
   *
   * @param {*} item The adding item.
   */
  function addItem(item) {
    if (queue.has(item)) {
      throw new Error(errorItemExists(item));
    }

    queue.add(item);
  }

  /**
   * Gets items from the queue in order of addition.
   *
   * @returns {*}
   */
  function getItems() {
    return [...queue];
  }

  return {
    addItem,
    getItems,
  };
}
