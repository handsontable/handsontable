import { arrayMap, arrayFilter } from './../helpers/array';
import { isFunction } from './../helpers/function';

class PhysicalIndexMap {
  constructor(initValueOrFn = index => index) {
    this.list = [];
    this.initValueOrFn = initValueOrFn;
  }

  /**
   * Initialize list with default values for particular indexes.
   *
   * @param {Number} length New length of list.
   */
  init(length) {
    this.list = arrayMap(new Array(length), (_, indexOfArray) => {
      if (isFunction(this.initValueOrFn)) {
        return this.initValueOrFn(indexOfArray);
      }

      return this.initValueOrFn;
    });

    return this;
  }

  /**
   * Get full list of values for particular indexes.
   *
   * @returns {Array}
   */
  getValues() {
    return this.list.slice();
  }

  /**
   * Set new values for particular indexes.
   *
   * @param {Array} values List of set values.
   */
  setValues(values) {
    this.list = values.slice();
  }

  /**
   * Get length of index map.
   *
   * @returns {Number}
   */
  getLength() {
    return this.getValues().length;
  }

  /**
   * Add indexes to list and reorganize.
   *
   * @private
   * @param {Number} insertionIndex Position inside actual list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  addIndexesAndReorganize(insertionIndex, insertedIndexes) {
    this.insertIndexes(insertionIndex, insertedIndexes);
  }

  /**
   * Remove indexes from the list and reorganize.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  removeIndexesAndReorganize(removedIndexes) {
    this.filterIndexes(removedIndexes);
  }

  /**
   * Insert new indexes to the list.
   *
   * @private
   * @param {Number} insertionIndex Position inside actual list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  insertIndexes(insertionIndex, insertedIndexes) {
    const firstInsertedIndex = insertedIndexes[0];

    this.list = [...this.list.slice(0, firstInsertedIndex),
      ...insertedIndexes.map((insertedIndex) => {
        if (isFunction(this.initValueOrFn)) {
          return this.initValueOrFn(insertedIndex);
        }

        return this.initValueOrFn;
      }), ...this.list.slice(firstInsertedIndex)];
  }

  /**
   * Filter indexes from the list.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  filterIndexes(removedIndexes) {
    this.list = arrayFilter(this.list, (_, index) => removedIndexes.includes(index) === false);
  }
}

export default PhysicalIndexMap;
