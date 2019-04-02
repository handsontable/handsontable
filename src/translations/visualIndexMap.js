import { arrayMap, arrayFilter } from './../helpers/array';
import { isFunction } from './../helpers/function';

class VisualIndexMap {
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
   * @param {Array} indexes List of set indexes.
   */
  setValues(indexes) {
    this.list = indexes.slice();
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
    this.increaseIndexes(insertionIndex, insertedIndexes);
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
    this.decreaseIndexes(removedIndexes);
  }

  /**
   * Transform list of indexes after insertion.
   *
   * @private
   * @param {Number} insertionIndex Position inside actual list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  increaseIndexes(insertionIndex, insertedIndexes) {
    const firstInsertedIndex = insertedIndexes[0];
    const amountOfIndexes = insertedIndexes.length;

    this.list = arrayMap(this.list, (index) => {
      if (index >= firstInsertedIndex) {
        return index + amountOfIndexes;
      }

      return index;
    });
  }

  /**
   * Insert new indexes to the list.
   *
   * @private
   * @param {Number} insertionIndex Position inside actual list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  insertIndexes(insertionIndex, insertedIndexes) {
    this.list = [...this.list.slice(0, insertionIndex), ...insertedIndexes, ...this.list.slice(insertionIndex)];
  }

  /**
   * Filter indexes from the list.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  filterIndexes(removedIndexes) {
    this.list = arrayFilter(this.list, index => removedIndexes.includes(index) === false);
  }

  /**
   * Transform list of indexes after removal.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  decreaseIndexes(removedIndexes) {
    this.list = arrayMap(this.list, index => index - removedIndexes.filter(removedRow => removedRow < index).length);
  }
}

export default VisualIndexMap;
