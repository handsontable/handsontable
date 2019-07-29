import { isUndefined, isDefined } from '../helpers/mixed';
import { mixin } from '../helpers/object';
import localHooks from '../mixins/localHooks';

class MapCollection {
  constructor() {
    this.mappings = new Map();
  }

  /**
   * Register custom indexes map.
   *
   * @param {String} name Unique name of the indexes list.
   * @param {BaseMap} map Map containing miscellaneous (i.e. meta data, indexes sequence), updated after remove and insert data actions.
   * @returns {BaseMap}
   */
  register(name, map) {
    if (this.mappings.has(name) === false) {
      this.mappings.set(name, map);
    }

    map.addLocalHook('change', () => this.runLocalHooks('change', map));

    this.runLocalHooks('change', map);

    return this.mappings.get(name);
  }

  /**
   * Unregister custom indexes map.
   *
   * @param {String} name Unique name of the indexes list.
   */
  unregister(name) {
    const map = this.mappings.get(name);

    if (isDefined(map)) {
      map.clearLocalHooks();
      this.mappings.delete(name);
    }

    this.runLocalHooks('change', map);
  }

  /**
   * Get indexes list by it's name.
   *
   * @param {String} [name] Name of the indexes list.
   * @returns {Array|IndexMap}
   */
  get(name) {
    if (isUndefined(name)) {
      return this.mappings.values();
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
   * Remove some indexes and update value of the previous ones.
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
   * Insert new indexes and update value of the previous ones.
   *
   * @private
   * @param {Number} firstInsertedVisualIndex First inserted visual index.
   * @param {Number} firstInsertedPhysicalIndex First inserted physical index.
   * @param {Number} amountOfIndexes Amount of inserted indexes.
   */
  insertToEvery(insertionIndex, insertedIndexes) {
    this.mappings.forEach((list) => {
      list.insert(insertionIndex, insertedIndexes);
    });
  }

  /**
   * Reset current index map and create new one.
   *
   * @param {Number} length Custom generated map length.
   */
  initEvery(length) {
    this.mappings.forEach((list) => {
      list.init(length);
    });
  }
}

mixin(MapCollection, localHooks);

export default MapCollection;
