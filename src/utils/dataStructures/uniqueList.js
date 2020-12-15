import { isFunction } from '../../helpers/function';

/* eslint-disable import/prefer-default-export */
const DEFAULT_ERROR_ID_EXISTS = id => `The id '${id}' is already declared in a list.`;
const DEFAULT_ERROR_ID_NOT_EXISTS = id => `The id '${id}' is not declared in a list.`;

/**
 * @typedef {object} UniqueList
 * @property {(id: *, item: *) => void} addItem Adds a new item to the unique list.
 * @property {(id: *) => *} getItem Gets item from the passed ID.
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
      throw Error(errorIdExists(id));
    }

    list.set(id, item);
  }

  /**
   * Gets item from the passed ID.
   *
   * @param {*} id The ID of the getting item.
   * @returns {*}
   */
  function getItem(id) {
    if (!list.has(id)) {
      throw Error(errorIdNotExists(id));
    }

    return list.get(id);
  }

  return {
    addItem,
    getItem,
  };
}
