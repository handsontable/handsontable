import { IndexMap } from './indexMap';
import { getListWithRemovedItems, getListWithInsertedItems } from './utils/physicallyIndexed';
import { getListWithRemovedItems as getListWithoutIndexes } from './utils/indexesSequence';
import { getDecreasedIndexes, getIncreasedIndexes } from './utils/actionsOnIndexes';
import { isFunction } from '../../helpers/function';

/**
 * Map for storing mappings from an physical index to a value. Those entries are linked and stored in a certain order.
 *
 * It does not update stored values on remove/add row or column action. Otherwise, order of entries is updated after
 * such changes.
 */
export class LinkedPhysicalIndexToValueMap extends IndexMap {
  /**
   * Indexes and values corresponding to them (entries) are stored in a certain order.
   *
   * @private
   * @type {Array<number>}
   */
  orderOfIndexes = []

  /**
   * Get full list of ordered values for particular indexes.
   *
   * @returns {Array}
   */
  getValues() {
    return this.orderOfIndexes.map(physicalIndex => this.indexedValues[physicalIndex]);
  }

  /**
   * Set new values for particular indexes. Entries are linked and stored in a certain order.
   *
   * Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately.
   *
   * @param {Array} values List of set values.
   */
  setValues(values) {
    this.orderOfIndexes = [...Array(values.length).keys()];

    super.setValues(values);
  }

  /**
   * Set value at index and add it to the linked list of entries. Entries are stored in a certain order.
   *
   * Note: Value will be added at the end of the queue.
   *
   * @param {number} index The index.
   * @param {*} value The value to save.
   * @param {number} position Position to which entry will be added.
   *
   * @returns {boolean}
   */
  setValueAtIndex(index, value, position = this.orderOfIndexes.length) {
    if (index < this.indexedValues.length) {
      this.indexedValues[index] = value;

      if (this.orderOfIndexes.includes(index) === false) {
        this.orderOfIndexes.splice(position, 0, index);
      }

      this.runLocalHooks('change');

      return true;
    }

    return false;
  }

  /**
   * Clear value for particular index.
   *
   * @param {number} physicalIndex Physical index.
   */
  clearValue(physicalIndex) {
    this.orderOfIndexes = getListWithoutIndexes(this.orderOfIndexes, [physicalIndex]);

    if (isFunction(this.initValueOrFn)) {
      super.setValueAtIndex(physicalIndex, this.initValueOrFn(physicalIndex));

    } else {
      super.setValueAtIndex(physicalIndex, this.initValueOrFn);
    }
  }

  /**
   * Get length of the index map.
   *
   * @returns {number}
   */
  getLength() {
    return this.orderOfIndexes.length;
  }

  /**
   * Set default values for elements from `0` to `n`, where `n` is equal to the handled variable.
   *
   * Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately.
   *
   * @private
   * @param {number} [length] Length of list.
   */
  setDefaultValues(length = this.indexedValues.length) {
    this.orderOfIndexes.length = 0;

    super.setDefaultValues(length);
  }

  /**
   * Add values to list and reorganize. It updates list of indexes related to ordered values.
   *
   * @private
   * @param {number} insertionIndex Position inside the list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  insert(insertionIndex, insertedIndexes) {
    this.indexedValues = getListWithInsertedItems(
      this.indexedValues,
      insertionIndex,
      insertedIndexes,
      this.initValueOrFn
    );
    this.orderOfIndexes = getIncreasedIndexes(this.orderOfIndexes, insertedIndexes);

    super.insert(insertionIndex, insertedIndexes);
  }

  /**
   * Remove values from the list and reorganize. It updates list of indexes related to ordered values.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  remove(removedIndexes) {
    this.indexedValues = getListWithRemovedItems(this.indexedValues, removedIndexes);
    this.orderOfIndexes = getListWithoutIndexes(this.orderOfIndexes, removedIndexes);
    this.orderOfIndexes = getDecreasedIndexes(this.orderOfIndexes, removedIndexes);

    super.remove(removedIndexes);
  }

  /**
   * Get every entry containing index and value, respecting order of indexes.
   *
   * @returns {Array}
   */
  getEntries() {
    return this.orderOfIndexes.map(physicalIndex => [physicalIndex, this.getValueAtIndex(physicalIndex)]);
  }
}
