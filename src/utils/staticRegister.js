export const collection = new Map();

export default function staticRegister(namespace = 'common') {
  if (!collection.has(namespace)) {
    collection.set(namespace, new Map());
  }
  const subCollection = collection.get(namespace);

  /**
   * Register an item to the collection. If the item under the same was exist earlier then this item will be replaced with new one.
   *
   * @param {String} name Identification of the item.
   * @param {*} item Item to save in the collection.
   */
  function register(name, item) {
    subCollection.set(name, item);
  }

  /**
   * Retrieve the item from the collection.
   *
   * @param {String} name Identification of the item.
   * @returns {*} Returns item which was saved in the collection.
   */
  function getItem(name) {
    return subCollection.get(name);
  }

  /**
   * Check if item under specyfied name is exists.
   *
   * @param {String} name Identification of the item.
   * @returns {Boolean} Returns `true` or `false` depends on if element exists in the collection.
   */
  function hasItem(name) {
    return subCollection.has(name);
  }

  /**
   * Retrieve list of names registered from the collection.
   *
   * @returns {Array} Returns an array of strings with all names under which objects are stored.
   */
  function getNames() {
    return [...subCollection.keys()];
  }

  /**
   * Retrieve all registered values from the collection.
   *
   * @returns {Array} Returns an array with all values stored in the collection.
   */
  function getValues() {
    return [...subCollection.values()];
  }

  return {
    register,
    getItem,
    hasItem,
    getNames,
    getValues,
  };
}
