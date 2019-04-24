import { isUndefined } from '../helpers/mixed';
import { mixin } from '../helpers/object';
import localHooks from '../mixins/localHooks';

class MapCollection {
  constructor(entries, onSingleMapChange = () => {}) {
    this.mappings = new Map(entries);
    this.onSingleMapChange = onSingleMapChange;
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

    map.addLocalHook('mapChanged', () => this.runLocalHooks('collectionChanged'));

    return this.mappings.get(name);
  }

  /**
   * Get indexes list by it's name.
   *
   * @param {String} name Name of the indexes list.
   * @returns {IndexMap}
   */
  get(name) {
    if (isUndefined(name)) {
      return this.mappings.values();
    }

    return this.mappings.get(name);
  }

  /**
   * Remove some indexes and update value of the previous ones.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  removeIndexes(removedIndexes) {
    this.mappings.forEach((list) => {
      list.removeValuesAndReorganize(removedIndexes);
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
  addIndexes(insertionIndex, insertedIndexes) {
    this.mappings.forEach((list) => {
      list.addValueAndReorganize(insertionIndex, insertedIndexes);
    });
  }

  /**
   * Reset current index map and create new one.
   *
   * @param {Number} length Custom generated map length.
   */
  initToLength(length) {
    this.mappings.forEach((list) => {
      list.init(length);
    });
  }
}

mixin(MapCollection, localHooks);

export default MapCollection;
