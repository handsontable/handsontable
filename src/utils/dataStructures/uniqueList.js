import { isFunction } from '../../helpers/function';

/* eslint-disable import/prefer-default-export */
const DEFAULT_ERROR_ID_EXISTS = id => `The id '${id}' is already declared in a list.`;
const DEFAULT_ERROR_ID_NOT_EXISTS = id => `The id '${id}' is not declared in a list.`;

/**
 * @typedef {object} UniqueList
 * @property {(id: *, item: *) => void} addItem Adds a new item to the unique list.
 * @property {(item: *) => *} getId Returns ID for the passed item.
 * @property {(id: *) => *} getItem Gets item from the passed ID.
 * @property {() => *[]} getItems Gets all items from the list.
 */
/**
 * Creates a new unique list.
 *
 * @param {object} config The config for priority queue.
 * @param {(id: *) => string} config.errorItemExists The function to generate custom message.
 * @param {(id: *) => string} config.errorItemNotExists The function to generate custom message.
 * @returns {UniqueList}
 */
export function createUniqueList({ errorIdExists, errorIdNotExists } = {}) {
  const list = new Map();

  errorIdExists = isFunction(errorIdExists) ? errorIdExists : DEFAULT_ERROR_ID_EXISTS;
  errorIdNotExists = isFunction(errorIdNotExists) ? errorIdNotExists : DEFAULT_ERROR_ID_NOT_EXISTS;

  /**
   * Adds a new item to the unique list.
   *
   * @param {*} id The ID of the adding item.
   * @param {*} item The adding item.
   */
  function addItem(id, item) {
    if (list.has(id)) {
      throw new Error(errorIdExists(id));
    }

    list.set(id, item);
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
    if (!list.has(id)) {
      throw new Error(errorIdNotExists(id));
    }

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

  return {
    addItem,
    getId,
    getItem,
    getItems,
  };
}
