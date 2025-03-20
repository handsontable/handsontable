import { isFunction } from '../../helpers/function';

const DEFAULT_ERROR_ITEM_EXISTS = (item: any): string => `'${item}' value is already declared in a unique set.`;

/**
 * @typedef {object} UniqueSet
 * @property {Function} addItem Adds items to the priority set.
 * @property {Function} getItems Gets items from the set in order of addition.
 */
export interface UniqueSet<T> {
  /**
   * Adds items to the unique set. Throws an error if `item` is already added.
   */
  addItem(item: T): void;
  /**
   * Clears the unique set.
   */
  clear(): void;
  /**
   * Gets items from the set in order of addition.
   */
  getItems(): T[];
}

interface UniqueSetConfig {
  errorItemExists?: (item: any) => string;
}

/**
 * Creates a new unique set.
 *
 * @param {object} config The config for priority set.
 * @param {Function} config.errorItemExists The function to generate custom error message if item is already in the set.
 * @returns {UniqueSet}
 */
export function createUniqueSet<T>({ errorItemExists }: UniqueSetConfig = {}): UniqueSet<T> {
  const uniqueSet = new Set<T>();

  const errorFn = isFunction(errorItemExists) ? errorItemExists : DEFAULT_ERROR_ITEM_EXISTS;

  /**
   * Adds items to the unique set. Throws an error if `item` is already added.
   *
   * @param {*} item The adding item.
   */
  function addItem(item: T): void {
    if (uniqueSet.has(item)) {
      throw new Error(errorFn(item));
    }

    uniqueSet.add(item);
  }

  /**
   * Gets items from the set in order of addition.
   *
   * @returns {*}
   */
  function getItems(): T[] {
    return [...uniqueSet];
  }

  /**
   * Clears the unique set.
   */
  function clear(): void {
    uniqueSet.clear();
  }

  return {
    addItem,
    clear,
    getItems,
  };
}
