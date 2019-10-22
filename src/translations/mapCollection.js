import { isUndefined, isDefined } from '../helpers/mixed';
import { mixin } from '../helpers/object';
import localHooks from '../mixins/localHooks';

// Counter for checking if there is a memory leak.
let registeredMaps = 0;

class MapCollection {
  constructor() {
    this.mappings = new Map();
  }

  /**
   * Register custom index map.
   *
   * @param {String} uniqueName Unique name of the indexes list.
   * @param {BaseMap} map Map containing miscellaneous (i.e. meta data, indexes sequence), updated after remove and insert data actions.
   * @returns {BaseMap|undefined}
   */
  register(uniqueName, map) {
    if (this.mappings.has(uniqueName) === false) {
      this.mappings.set(uniqueName, map);

      map.addLocalHook('change', () => this.runLocalHooks('change', map));

      registeredMaps += 1;
    }
  }

  /**
   * Unregister custom index map.
   *
   * @param {String} name Name of the indexes list.
   */
  unregister(name) {
    const map = this.mappings.get(name);

    if (isDefined(map)) {
      map.clearLocalHooks();
      this.mappings.delete(name);

      this.runLocalHooks('change', map);

      registeredMaps -= 1;
    }
  }

  /**
   * Get indexes list for provided index map name.
   *
   * @param {String} [name] Name of the indexes list.
   * @returns {Array|IndexMap}
   */
  get(name) {
    if (isUndefined(name)) {
      return Array.from(this.mappings.values());
    }

    return this.mappings.get(name);
  }

  /**
   * Get collection size.
   *
   * @returns {Number}
   */
  getLength() {
    return this.mappings.size;
  }

  /**
   * Remove some indexes and corresponding mappings and update values of the others within all collection's index maps.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  removeFromEvery(removedIndexes) {
    this.mappings.forEach((list) => {
      list.remove(removedIndexes);
    });
  }

  /**
   * Insert new indexes and corresponding mapping and update values of the others all collection's index maps.
   *
   * @private
   * @param {Number} insertionIndex Position inside the actual list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  insertToEvery(insertionIndex, insertedIndexes) {
    this.mappings.forEach((list) => {
      list.insert(insertionIndex, insertedIndexes);
    });
  }

  /**
   * Set default values to index maps within collection.
   *
   * @param {Number} length Destination length for all stored index maps.
   */
  initEvery(length) {
    this.mappings.forEach((list) => {
      list.init(length);
    });
  }
}

mixin(MapCollection, localHooks);

export default MapCollection;

export function getRegisteredMapsCounter() {
  return registeredMaps;
}
