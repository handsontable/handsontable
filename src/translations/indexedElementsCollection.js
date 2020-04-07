import { isUndefined, isDefined } from '../helpers/mixed';
import { mixin } from '../helpers/object';
import localHooks from '../mixins/localHooks';

// Counter for checking if there is a memory leak.
let registeredElements = 0;

/**
 * Collection of index maps or indexes sequences having unique names. It allow us to perform bulk operations such as init,
 * remove, insert on stored elements that have been registered in the collection.
 */
class IndexedElementsCollection {
  constructor() {
    /**
     * Collection of indexed elements.
     *
     * @type {Map<string, IndexedElement>}
     */
    this.collection = new Map();
  }

  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * Register custom indexed element.
   *
   * @param {string} uniqueName Unique name for the indexed element.
   * @param {IndexedElement} indexedElement Index map containing miscellaneous (i.e. meta data, information whether
   * index is hidden or trimmed) or sequence of indexes.
   */
  /* eslint-enable jsdoc/require-description-complete-sentence */
  register(uniqueName, indexedElement) {
    if (this.collection.has(uniqueName) === false) {
      this.collection.set(uniqueName, indexedElement);

      indexedElement.addLocalHook('change', () => this.runLocalHooks('change', indexedElement));

      registeredElements += 1;
    }
  }

  /**
   * Unregister custom indexed element.
   *
   * @param {string} name Name of the indexed element.
   */
  unregister(name) {
    const indexedElement = this.collection.get(name);

    if (isDefined(indexedElement)) {
      indexedElement.clearLocalHooks();
      this.collection.delete(name);

      this.runLocalHooks('change', indexedElement);

      registeredElements -= 1;
    }
  }

  /**
   * Get indexed element for the provided name.
   *
   * @param {string} [name] Name of the indexed element.
   * @returns {Array|IndexedElement}
   */
  get(name) {
    if (isUndefined(name)) {
      return Array.from(this.collection.values());
    }

    return this.collection.get(name);
  }

  /**
   * Get collection size.
   *
   * @returns {number}
   */
  getLength() {
    return this.collection.size;
  }

  /**
   * Remove some indexes and update corresponding values within all collection's indexed elements.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  removeFromEvery(removedIndexes) {
    this.collection.forEach((indexMap) => {
      indexMap.remove(removedIndexes);
    });
  }

  /**
   * Insert new indexes and corresponding values and update all collection's indexed elements.
   *
   * @private
   * @param {number} insertionIndex Position inside the actual list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  insertToEvery(insertionIndex, insertedIndexes) {
    this.collection.forEach((indexMap) => {
      indexMap.insert(insertionIndex, insertedIndexes);
    });
  }

  /**
   * Set default values to indexed elements within collection.
   *
   * @param {number} length Destination length for all stored maps.
   */
  initEvery(length) {
    this.collection.forEach((indexMap) => {
      indexMap.init(length);
    });
  }
}

mixin(IndexedElementsCollection, localHooks);

export default IndexedElementsCollection;

/**
 * @returns {number}
 */
export function getRegisteredElementsCounter() {
  return registeredElements;
}
