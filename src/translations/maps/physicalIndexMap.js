import { arrayFilter } from '../../helpers/array';
import { isFunction } from '../../helpers/function';
import IndexMap from './indexMap';

/**
 * Map from physical index to value.
 */
class PhysicalIndexMap extends IndexMap {
  constructor(initValueOrFn = index => index) {
    super(initValueOrFn);

    this.list = [];
    this.initValueOrFn = initValueOrFn;
  }

  /**
   * Add values to list and reorganize.
   *
   * @private
   * @param {Number} insertionIndex Position inside actual list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  addValueAndReorganize(insertionIndex, insertedIndexes) {
    this.insertValues(insertionIndex, insertedIndexes);
  }

  /**
   * Remove values from the list and reorganize.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  removeValuesAndReorganize(removedIndexes) {
    this.filterValues(removedIndexes);
  }

  /**
   * Insert new values to the list.
   *
   * @private
   * @param {Number} insertionIndex Position inside actual list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  insertValues(insertionIndex, insertedIndexes) {
    const firstInsertedIndex = insertedIndexes[0];

    this.list = [
      ...this.list.slice(0, firstInsertedIndex),
      ...insertedIndexes.map((insertedIndex) => {
        if (isFunction(this.initValueOrFn)) {
          return this.initValueOrFn(insertedIndex);
        }

        return this.initValueOrFn;
      }),
      ...this.list.slice(firstInsertedIndex)
    ];
  }

  /**
   * Filter indexes from the list.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  filterValues(removedIndexes) {
    this.list = arrayFilter(this.list, (_, index) => removedIndexes.includes(index) === false);
  }
}

export default PhysicalIndexMap;
