import IndexMap from './indexMap';
import { getListWithRemovedItems, getListWithInsertedItems } from './utils/physicallyIndexed';
import { getListWithRemovedItems as getListWithoutIndexes } from './utils/indexesSequence';
import { getDecreasedIndexes, getIncreasedIndexes } from './utils/actionsOnIndexes';
import { isFunction } from '../../helpers/function';

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
   * @type {Array<number>}
   */
  queueOfIndexes = []

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
   * Set value at index and add it to the queue of values. Non-default values are stored in a certain order.
   *
   * Note: Queued value will be added at the end of the queue.
   *
   * @param {number} index The index.
   * @param {*} value The value to save.
   */
  setValueAtIndex(index, value) {
    super.setValueAtIndex(index, value);

    this.queueOfIndexes.push(index);
  }

  /**
   * Remove every queued value.
   *
   * Note: Please keep in mind that clear for the rest of the map won't be executed.
   */
  clear() {
    if (isFunction(this.initValueOrFn)) {
      this.queueOfIndexes.forEach((physicalIndex) => {
        super.setValueAtIndex(physicalIndex, this.initValueOrFn(physicalIndex));
      });

    } else {
      this.queueOfIndexes.forEach((physicalIndex) => {
        super.setValueAtIndex(physicalIndex, this.initValueOrFn);
      });
    }

    this.queueOfIndexes = [];
  }

  /**
   * Get every queued value.
   *
   * @returns {Array}
   */
  getEntries() {
    return this.queueOfIndexes.map(physicalIndex => [physicalIndex, this.getValueAtIndex(physicalIndex)]);
  }

  /**
   * Get sequence of indexes related to values which have been queued.
   *
   * @returns {Array}
   */
  getIndexesQueue() {
    return this.queueOfIndexes;
  }
}

export default QueuedPhysicalIndexToValueMap;
