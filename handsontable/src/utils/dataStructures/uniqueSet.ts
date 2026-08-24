import { isFunction } from '../../helpers/function';
import { throwWithCause } from '../../helpers/errors';

const DEFAULT_ERROR_ITEM_EXISTS = (item: unknown) => `'${item}' value is already declared in a unique set.`;

/**
 * @typedef {object} UniqueSet
 * @property {Function} addItem Adds items to the priority set.
 * @property {Function} getItems Gets items from the set in order of addition.
 */
/**
 * Creates a new unique set.
 *
 * @param {object} config The config for priority set.
 * @param {Function} config.errorItemExists The function to generate custom error message if item is already in the set.
 * @returns {UniqueSet}
 */
export function createUniqueSet({ errorItemExists }: { errorItemExists?: Function } = {}) {
  const uniqueSet = new Set();

  const errorFn = isFunction(errorItemExists) ? errorItemExists : DEFAULT_ERROR_ITEM_EXISTS;

  /**
   * Adds items to the unique set. Throws an error if `item` is already added.
   *
   * @param {*} item The adding item.
   */
  function addItem(item: unknown) {
    if (uniqueSet.has(item)) {
      throwWithCause(String(errorFn(item)));
    }

    uniqueSet.add(item);
  }

  /**
   * Gets items from the set in order of addition.
   *
   * @returns {*}
   */
  function getItems() {
    return [...uniqueSet];
  }

  /**
   * Clears the unique set.
   */
  function clear() {
    uniqueSet.clear();
  }

  return {
    addItem,
    clear,
    getItems,
  };
}
