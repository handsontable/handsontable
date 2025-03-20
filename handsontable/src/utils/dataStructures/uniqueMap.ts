import { isFunction } from '../../helpers/function';

const DEFAULT_ERROR_ID_EXISTS = (id: any): string => `The id '${id}' is already declared in a map.`;

/**
 * @typedef {object} UniqueMap
 * @property {Function} addItem Adds a new item to the unique map.
 * @property {Function} clear Clears the map.
 * @property {Function} getId Returns ID for the passed item.
 * @property {Function} getItem Gets item from the passed ID.
 * @property {Function} getItems Gets all items from the map.
 * @property {Function} hasItem Verifies if the passed ID exists in a map.
 * @property {Function} removeItem Removes item from the passed id if exists.
 */
export interface UniqueMap<K, V> {
  /**
   * Adds a new item to the unique map. Throws error if `id` is already added.
   */
  addItem(id: K, item: V): void;
  /**
   * Clears the map.
   */
  clear(): void;
  /**
   * Returns ID for the passed item.
   */
  getId(item: V): K | null;
  /**
   * Returns item from the passed ID.
   */
  getItem(id: K): V | undefined;
  /**
   * Gets all items from the map.
   */
  getItems(): Array<[K, V]>;
  /**
   * Verifies if the passed ID exists in a map.
   */
  hasItem(id: K): boolean;
  /**
   * Removes item from the passed id if exists.
   */
  removeItem(id: K): boolean;
}

interface UniqueMapConfig {
  errorIdExists?: (id: any) => string;
}

/**
 * Creates a new unique map.
 *
 * @param {object} config The config for priority queue.
 * @param {Function} config.errorIdExists The function to generate custom message if ID is already taken.
 * @returns {UniqueMap}
 */
export function createUniqueMap<K, V>({ errorIdExists }: UniqueMapConfig = {}): UniqueMap<K, V> {
  const uniqueMap = new Map<K, V>();

  const errorFn = isFunction(errorIdExists) ? errorIdExists : DEFAULT_ERROR_ID_EXISTS;

  /**
   * Adds a new item to the unique map. Throws error if `id` is already added.
   *
   * @param {*} id The ID of the adding item.
   * @param {*} item The adding item.
   */
  function addItem(id: K, item: V): void {
    if (hasItem(id)) {
      throw new Error(errorFn(id));
    }

    uniqueMap.set(id, item);
  }

  /**
   * Removes item from the passed id if exists.
   *
   * @param {*} id The ID to remove.
   * @returns {boolean}
   */
  function removeItem(id: K): boolean {
    return uniqueMap.delete(id);
  }

  /**
   * Clears the map.
   */
  function clear(): void {
    uniqueMap.clear();
  }

  /**
   * Returns ID for the passed item.
   *
   * @param {*} item The item of the getting ID.
   * @returns {*}
   */
  function getId(item: V): K | null {
    const [itemId] = getItems().find(([id, element]) => {
      if (item === element) {
        return id;
      }

      return false;
    }) || [null];

    return itemId;
  }

  /**
   * Returns item from the passed ID.
   *
   * @param {*} id The ID of the getting item.
   * @returns {*}
   */
  function getItem(id: K): V | undefined {
    return uniqueMap.get(id);
  }

  /**
   * Gets all items from the map.
   *
   * @returns {Array}
   */
  function getItems(): Array<[K, V]> {
    return [...uniqueMap];
  }

  /**
   * Verifies if the passed ID exists in a map.
   *
   * @param {*} id The ID to check if registered.
   * @returns {boolean}
   */
  function hasItem(id: K): boolean {
    return uniqueMap.has(id);
  }

  return {
    addItem,
    clear,
    getId,
    getItem,
    getItems,
    hasItem,
    removeItem,
  };
}
