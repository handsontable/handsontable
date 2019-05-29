import { getListWithInsertedItems, getListWithRemovedItems } from './utils/physical';
import { getIncreasedIndexes, getDecreasedIndexes } from './utils/actionsOnIndexes';

class PhysicallyIndexedUpdatedStrategy {
  /**
   * Map physically indexed and additionally updated (reindexed) after item removal / insertion.
   *
   * @returns {String}
   */
  static get STRATEGY_NAME() {
    return 'physicallyIndexedUpdated';
  }

  /**
   * Add values to list and reorganize.
   *
   * @private
   * @param {Number} insertionIndex Position inside actual list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  getItemsAfterInsertion(list, insertionIndex, insertedIndexes, initValueOrFn) {
    const listAfterUpdate = getIncreasedIndexes(list, insertionIndex, insertedIndexes);

    return getListWithInsertedItems(listAfterUpdate, insertionIndex, insertedIndexes, initValueOrFn);
  }

  /**
   * Remove values from the list and reorganize.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  getItemsAfterRemoval(list, removedIndexes) {
    const listAfterUpdate = getListWithRemovedItems(list, removedIndexes);

    return getDecreasedIndexes(listAfterUpdate, removedIndexes);
  }
}

export default PhysicallyIndexedUpdatedStrategy;
