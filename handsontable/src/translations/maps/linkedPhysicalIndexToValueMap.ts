import { IndexMap } from './indexMap';
import { getListWithRemovedItems, getListWithInsertedItems } from './utils/physicallyIndexed';
import { getListWithRemovedItems as getListWithoutIndexes } from './utils/indexesSequence';
import { getDecreasedIndexes, getIncreasedIndexes } from './utils/actionsOnIndexes';
import { isFunction } from '../../helpers/function';
import { IndexValue } from '../types';

/**
 * Map for storing mappings from an physical index to a value. Those entries are linked and stored in a certain order.
 *
 * It does not update stored values on remove/add row or column action. Otherwise, order of entries is updated after
 * such changes.
 *
 * @class LinkedPhysicalIndexToValueMap
 */
export class LinkedPhysicalIndexToValueMap extends IndexMap {
  /**
   * Indexes and values corresponding to them (entries) are stored in a certain order.
   *
   * @private
   * @type {Array<number>}
   */
  orderOfIndexes: number[] = []

  /**
   * Get full list of ordered values for particular indexes.
   *
   * @returns {Array}
   */
  getValues(): IndexValue[] {
    return this.orderOfIndexes.map(physicalIndex => this.indexedValues[physicalIndex]);
  }

  /**
   * Set new values for particular indexes. Entries are linked and stored in a certain order.
   *
   * Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately.
   *
   * @param {Array} values List of set values.
   */
  setValues(values: IndexValue[]): void {
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
  setValueAtIndex(index: number, value: IndexValue, position: number = this.orderOfIndexes.length): boolean {
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
  clearValue(physicalIndex: number): void {
    this.orderOfIndexes = getListWithoutIndexes(this.orderOfIndexes, [physicalIndex]) as number[];

    if (isFunction(this.initValueOrFn)) {
      super.setValueAtIndex(physicalIndex, (this.initValueOrFn as Function)(physicalIndex));

    } else {
      super.setValueAtIndex(physicalIndex, this.initValueOrFn as IndexValue);
    }
  }

  /**
   * Get length of the index map.
   *
   * @returns {number}
   */
  getLength(): number {
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
  setDefaultValues(length: number = this.indexedValues.length): void {
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
  insert(insertionIndex: number, insertedIndexes: number[]): void {
    this.indexedValues = getListWithInsertedItems(
      this.indexedValues,
      insertionIndex,
      insertedIndexes,
      this.initValueOrFn
    );
    this.orderOfIndexes = getIncreasedIndexes(this.orderOfIndexes, insertedIndexes) as number[];

    super.insert(insertionIndex, insertedIndexes);
  }

  /**
   * Remove values from the list and reorganize. It updates list of indexes related to ordered values.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  remove(removedIndexes: number[]): void {
    this.indexedValues = getListWithRemovedItems(this.indexedValues, removedIndexes);
    this.orderOfIndexes = getListWithoutIndexes(this.orderOfIndexes, removedIndexes) as number[];
    this.orderOfIndexes = getDecreasedIndexes(this.orderOfIndexes, removedIndexes) as number[];

    super.remove(removedIndexes);
  }

  /**
   * Get every entry containing index and value, respecting order of indexes.
   *
   * @returns {Array}
   */
  getEntries(): Array<[number, IndexValue]> {
    return this.orderOfIndexes.map(physicalIndex => [physicalIndex, this.getValueAtIndex(physicalIndex)]);
  }
}
