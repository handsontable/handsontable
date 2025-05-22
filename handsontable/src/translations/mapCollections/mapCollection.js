import { isUndefined, isDefined } from '../../helpers/mixed';
import { mixin } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';

// Counter for checking if there is a memory leak.
let registeredMaps = 0;

/**
 * Collection of index maps having unique names. It allow us to perform bulk operations such as init, remove, insert on all index maps that have been registered in the collection.
 */
export class MapCollection {
  /**
   * Collection of index maps.
   *
   * @type {Map<string, IndexMap>}
   */
  collection = new Map();

  /**
   * Register custom index map.
   *
   * @param {string} uniqueName Unique name of the index map.
   * @param {IndexMap} indexMap Index map containing miscellaneous (i.e. Meta data, indexes sequence), updated after remove and insert data actions.
   */
  register(uniqueName, indexMap) {
    if (this.collection.has(uniqueName) === false) {
      this.collection.set(uniqueName, indexMap);

      indexMap.addLocalHook('change', () => this.runLocalHooks('change', indexMap));

      registeredMaps += 1;
    }
  }

  /**
   * Unregister custom index map.
   *
   * @param {string} name Name of the index map.
   */
  unregister(name) {
    const indexMap = this.collection.get(name);

    if (isDefined(indexMap)) {
      indexMap.destroy();
      this.collection.delete(name);

      this.runLocalHooks('change', indexMap);

      registeredMaps -= 1;
    }
  }

  /**
   * Unregisters and destroys all collected index map instances.
   */
  unregisterAll() {
    this.collection.forEach((indexMap, name) => this.unregister(name));
    this.collection.clear();
  }

  /**
   * Get index map for the provided name.
   *
   * @param {string} [name] Name of the index map.
   * @returns {Array|IndexMap}
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
   * Remove some indexes and corresponding mappings and update values of the others within all collection's index maps.
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
   * Insert new indexes and corresponding mapping and update values of the others all collection's index maps.
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
   * Set default values to index maps within collection.
   *
   * @param {number} length Destination length for all stored maps.
   */
  initEvery(length) {
    this.collection.forEach((indexMap) => {
      indexMap.init(length);
    });
  }
}

mixin(MapCollection, localHooks);

/**
 * @returns {number}
 */
export function getRegisteredMapsCounter() {
  return registeredMaps;
}
