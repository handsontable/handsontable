import IndexMap from './indexMap';
import { getListWithRemovedItems, getListWithInsertedItems } from './utils/physicallyIndexed';
import { getListWithRemovedItems as getListWithoutIndexes } from './utils/indexesSequence';
import { getDecreasedIndexes, getIncreasedIndexes } from './utils/actionsOnIndexes';

/**
 * Map for storing mappings from an physical index to a value. Some values are stored in a certain order.
 *
 * Does not update stored values on remove/add row or column action. Otherwise, queue of indexes related to ordered
 * values is updated after such changes.
 */
class QueuedPhysicalIndexToValueMap extends IndexMap {
  /**
   * Some values are stored in a certain order. Queue of indexes represent indexes related to ordered values.
   *
   * @private
   * @type {Array<number>}
   */
  queueOfIndexes = []

  /**
   * Get full list of values for particular indexes.
   *
   * @returns {Array}
   */
  getValues() {
    return this.queueOfIndexes.map(physicalIndex => this.indexedValues[physicalIndex]);
  }

  /**
   * Set new values for particular indexes.
   *
   * Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately.
   *
   * @param {Array} values List of set values.
   */
  setValues(values) {
    this.queueOfIndexes = [...Array(values.length).keys()];

    super.setValues(values);
  }

  /**
   * Set value at index and add it to the queue of values. Non-default values are stored in a certain order.
   *
   * Note: Queued value will be added at the end of the queue.
   *
   * @param {number} index The index.
   * @param {*} value The value to save.
   *
   * @returns {boolean}
   */
  setValueAtIndex(index, value) {
    if (index < this.indexedValues.length) {
      this.indexedValues[index] = value;

      if (this.queueOfIndexes.includes(index) === false) {
        this.queueOfIndexes.push(index);
      }

      this.runLocalHooks('change');

      return true;
    }

    return false;
  }

  /**
   * Remove every queued value.
   */
  clear() {
    this.queueOfIndexes.length = 0;

    super.clear();
  }

  /**
   * Get length of the index map.
   *
   * @returns {number}
   */
  getLength() {
    return this.queueOfIndexes.length;
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
    this.queueOfIndexes.length = 0;

    super.setDefaultValues(length);
  }

  /**
   * Add values to list and reorganize. It updates queue of indexes related to ordered values.
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
    this.queueOfIndexes = getIncreasedIndexes(this.queueOfIndexes, insertedIndexes);

    super.insert(insertionIndex, insertedIndexes);
  }

  /**
   * Remove values from the list and reorganize. It updates queue of indexes related to ordered values.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  remove(removedIndexes) {
    this.indexedValues = getListWithRemovedItems(this.indexedValues, removedIndexes);
    this.queueOfIndexes = getListWithoutIndexes(this.queueOfIndexes, removedIndexes);
    this.queueOfIndexes = getDecreasedIndexes(this.queueOfIndexes, removedIndexes);

    super.remove(removedIndexes);
  }

  /**
   * Get every queued value.
   *
   * @returns {Array}
   */
  getEntries() {
    return this.queueOfIndexes.map(physicalIndex => [physicalIndex, this.getValueAtIndex(physicalIndex)]);
  }
}

export default QueuedPhysicalIndexToValueMap;
