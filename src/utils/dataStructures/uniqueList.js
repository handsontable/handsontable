import { isFunction } from '../../helpers/function';

const DEFAULT_ERROR_ID_EXISTS = id => `The id '${id}' is already declared in a list.`;

/**
 * @typedef {object} UniqueList
 * @property {Function} addItem Adds a new item to the unique list.
 * @property {Function} clear Clears the list.
 * @property {Function} getId Returns ID for the passed item.
 * @property {Function} getItem Gets item from the passed ID.
 * @property {Function} getItems Gets all items from the list.
 * @property {Function} hasItem Verifies if the passed ID exists in a list.
 */
/**
 * Creates a new unique list.
 *
 * @param {object} config The config for priority queue.
 * @param {(id: *) => string} config.errorItemExists The function to generate custom message.
 * @param {(id: *) => string} config.errorItemNotExists The function to generate custom message.
 * @returns {UniqueList}
 */
export function createUniqueList({ errorIdExists } = {}) {
  const list = new Map();

  errorIdExists = isFunction(errorIdExists) ? errorIdExists : DEFAULT_ERROR_ID_EXISTS;

  /**
   * Adds a new item to the unique list.
   *
   * @param {*} id The ID of the adding item.
   * @param {*} item The adding item.
   */
  function addItem(id, item) {
    if (hasItem(id)) {
      throw new Error(errorIdExists(id));
    }

    list.set(id, item);
  }

  /**
   * Clears the list.
   */
  function clear() {
    list.clear();
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
    return list.get(id);
  }

  /**
   * Gets all items from the list.
   *
   * @returns {*[]}
   */
  function getItems() {
    return [...list];
  }

  /**
   * Verifies if the passed ID exists in a list.
   *
   * @param {*} id The ID to check if registered.
   * @returns {boolean}
   */
  function hasItem(id) {
    return list.has(id);
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
