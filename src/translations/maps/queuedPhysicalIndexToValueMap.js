import IndexMap from './indexMap';
import { getListWithRemovedItems, getListWithInsertedItems } from './utils/physicallyIndexed';
import { getDecreasedIndexes, getIncreasedIndexes } from './utils/actionsOnIndexes';
import { isFunction } from '../../helpers/function';

/**
 * Map for storing mappings from an physical index to a value. Some values may be stored in a certain order.
 *
 * Does not update stored values on remove/add row or column action.
 */
class QueuedPhysicalIndexToValueMap extends IndexMap {
  constructor() {
    super();
    this.queueOfIndexes = [];
  }

  /**
   * Add values to list and reorganize.
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
   * Remove values from the list and reorganize.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  remove(removedIndexes) {
    this.indexedValues = getListWithRemovedItems(this.indexedValues, removedIndexes);
    this.queueOfIndexes = getDecreasedIndexes(this.queueOfIndexes, removedIndexes);

    super.remove(removedIndexes);
  }

  /**
   * Add new value to queue of values. Some values may be stored in a certain order.
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
