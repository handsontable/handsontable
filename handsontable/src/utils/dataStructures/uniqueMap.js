import { isFunction } from '../../helpers/function';

const DEFAULT_ERROR_ID_EXISTS = id => `The id '${id}' is already declared in a map.`;

/**
 * @typedef {object} UniqueMap
 * @property {Function} addItem Adds a new item to the unique map.
 * @property {Function} clear Clears the map.
 * @property {Function} getId Returns ID for the passed item.
 * @property {Function} getItem Gets item from the passed ID.
 * @property {Function} getItems Gets all items from the map.
 * @property {Function} hasItem Verifies if the passed ID exists in a map.
 */
/**
 * Creates a new unique map.
 *
 * @param {object} config The config for priority queue.
 * @param {Function} config.errorIdExists The function to generate custom message if ID is already taken.
 * @returns {UniqueMap}
 */
export function createUniqueMap({ errorIdExists } = {}) {
  const uniqueMap = new Map();

  errorIdExists = isFunction(errorIdExists) ? errorIdExists : DEFAULT_ERROR_ID_EXISTS;

  /**
   * Adds a new item to the unique map. Throws error if `id` is already added.
   *
   * @param {*} id The ID of the adding item.
   * @param {*} item The adding item.
   */
  function addItem(id, item) {
    if (hasItem(id)) {
      throw new Error(errorIdExists(id));
    }

    uniqueMap.set(id, item);
  }

  /**
   * Clears the map.
   */
  function clear() {
    uniqueMap.clear();
  }

  /**
   * Returns ID for the passed item.
   *
   * @param {*} item The item of the getting ID.
   * @returns {*}
   */
  function getId(item) {
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
  function getItem(id) {
    return uniqueMap.get(id);
  }

  /**
   * Gets all items from the map.
   *
   * @returns {Array}
   */
  function getItems() {
    return [...uniqueMap];
  }

  /**
   * Verifies if the passed ID exists in a map.
   *
   * @param {*} id The ID to check if registered.
   * @returns {boolean}
   */
  function hasItem(id) {
    return uniqueMap.has(id);
  }

  return {
    addItem,
    clear,
    getId,
    getItem,
    getItems,
    hasItem,
  };
}
