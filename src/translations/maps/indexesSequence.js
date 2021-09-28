import { IndexMap } from './indexMap';
import { getListWithRemovedItems, getListWithInsertedItems } from './utils/indexesSequence';
import { getDecreasedIndexes, getIncreasedIndexes } from './utils';

/**
 * Map for storing mappings from an index to a physical index.
 *
 * It also updates the physical indexes (remaining in the map) on remove/add row or column action.
 */
export class IndexesSequence extends IndexMap {
  constructor() {
    // Not handling custom init function or init value.
    super(index => index);
  }

  /**
   * Add values to list and reorganize.
   *
   * @private
   * @param {number} insertionIndex Position inside the list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  insert(insertionIndex, insertedIndexes) {
    const listAfterUpdate = getIncreasedIndexes(this.indexedValues, insertedIndexes);

    this.indexedValues = getListWithInsertedItems(listAfterUpdate, insertionIndex, insertedIndexes);

    super.insert(insertionIndex, insertedIndexes);
  }

  /**
   * Remove values from the list and reorganize.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  remove(removedIndexes) {
    const listAfterUpdate = getListWithRemovedItems(this.indexedValues, removedIndexes);

    this.indexedValues = getDecreasedIndexes(listAfterUpdate, removedIndexes);

    super.remove(removedIndexes);
  }
}
