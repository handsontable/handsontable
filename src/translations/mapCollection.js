import { isUndefined } from '../helpers/mixed';

class MapCollection {
  constructor(indexMapper, entries) {
    this.indexMapper = indexMapper;
    this.mappings = new Map(entries);
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

    map.addLocalHook('mapChanged', () => this.indexMapper.clearCache());

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
   * Update indexes after removing some indexes.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  updateIndexesAfterRemoval(removedIndexes) {
    this.mappings.forEach((list) => {
      list.removeValuesAndReorganize(removedIndexes);
    });

    this.indexMapper.clearCache();
  }

  /**
   * Update indexes after inserting new indexes.
   *
   * @private
   * @param {Number} firstInsertedVisualIndex First inserted visual index.
   * @param {Number} firstInsertedPhysicalIndex First inserted physical index.
   * @param {Number} amountOfIndexes Amount of inserted indexes.
   */
  updateIndexesAfterInsertion(insertionIndex, insertedIndexes) {
    this.mappings.forEach((list) => {
      list.addValueAndReorganize(insertionIndex, insertedIndexes);
    });

    this.indexMapper.clearCache();
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

    this.indexMapper.clearCache();
  }
}

export default MapCollection;
