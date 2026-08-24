import { IndexMap, getDecreasedIndexes, getIncreasedIndexes } from '../../../translations';
import {
  getListWithInsertedItems,
  getListWithRemovedItems
} from '../../../translations/maps/utils/physicallyIndexed';

/**
 * Map from physical index to another index.
 */
class LooseBindsMap extends IndexMap {
  /**
   * Initializes the loose binds map with an identity function so each row header index initially maps to itself.
   */
  constructor() {
    super((index: number) => index);
  }

  /**
   * Add values to list and reorganize.
   *
   * @private
   * @param {number} insertionIndex Position inside the list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  insert(insertionIndex: number, insertedIndexes: number[]) {
    const listAfterUpdate = getIncreasedIndexes(this.indexedValues as number[], insertedIndexes);

    this.indexedValues = getListWithInsertedItems(listAfterUpdate, insertionIndex, insertedIndexes, this.initValueOrFn);

    super.insert(insertionIndex, insertedIndexes);
  }

  /**
   * Remove values from the list and reorganize.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  remove(removedIndexes: number[]) {
    const listAfterUpdate = getListWithRemovedItems(this.indexedValues, removedIndexes);

    this.indexedValues = getDecreasedIndexes(listAfterUpdate as number[], removedIndexes);

    super.remove(removedIndexes);
  }
}

export default LooseBindsMap;
