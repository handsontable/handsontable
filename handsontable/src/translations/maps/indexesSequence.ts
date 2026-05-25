import { IndexMap } from './indexMap';
import { getListWithRemovedItems, getListWithInsertedItems } from './utils/indexesSequence';
import { getDecreasedIndexes, getIncreasedIndexes } from './utils';

/**
 * Map for storing mappings from an index to a physical index.
 *
 * It also updates the physical indexes (remaining in the map) on remove/add row or column action.
 *
 * @class IndexesSequence
 */
export class IndexesSequence extends IndexMap {
  constructor() {
    // Not handling custom init function or init value.
    super((index: number) => index);
  }

  /**
   * Get sequence of physical indexes.
   *
   * @returns {number[]} Physical indexes.
   */
  getValues(): number[] {
    return this.indexedValues as number[];
  }

  /**
   * Add values to list and reorganize.
   *
   * @private
   * @param {number} insertionIndex Position inside the list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  insert(insertionIndex: number, insertedIndexes: number[]) {
    const listAfterUpdate = getIncreasedIndexes(this.getValues(), insertedIndexes);

    this.indexedValues = getListWithInsertedItems(listAfterUpdate, insertionIndex, insertedIndexes);

    super.insert(insertionIndex, insertedIndexes);
  }

  /**
   * Remove values from the list and reorganize.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  remove(removedIndexes: number[]) {
    const listAfterUpdate = getListWithRemovedItems(this.getValues(), removedIndexes);

    this.indexedValues = getDecreasedIndexes(listAfterUpdate, removedIndexes);

    super.remove(removedIndexes);
  }
}
