import { getListWithInsertedItems, getListWithRemovedItems } from './utils/physical';

class PhysicallyIndexedNotUpdatedStrategy {
  /**
   * Map visually indexed and NOT additionally updated (reindexed) after item removal / insertion.
   *
   * @returns {String}
   */
  static get STRATEGY_NAME() {
    return 'physicallyIndexedNotUpdated';
  }

  /**
   * Add values to list and reorganize.
   *
   * @private
   * @param {Number} insertionIndex Position inside actual list.
   * @param {Array} insertedIndexes
   * List of inserted indexes.
   */
  getItemsAfterInsertion(list, insertionIndex, insertedIndexes, initValueOrFn) {
    return getListWithInsertedItems(list, insertionIndex, insertedIndexes, initValueOrFn);
  }

  /**
   * Remove values from the list and reorganize.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  getItemsAfterRemoval(list, removedIndexes) {
    return getListWithRemovedItems(list, removedIndexes);
  }
}

export default PhysicallyIndexedNotUpdatedStrategy;

