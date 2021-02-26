import { IndexMap, alterUtilsFactory, getDecreasedIndexes, getIncreasedIndexes } from '../../../translations';

const { getListWithInsertedItems, getListWithRemovedItems } = alterUtilsFactory('physicallyIndexed');

/**
 * Map from physical index to another index.
 */
class LooseBindsMap extends IndexMap {
  constructor() {
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

    this.indexedValues = getListWithInsertedItems(listAfterUpdate, insertionIndex, insertedIndexes, this.initValueOrFn);

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

export default LooseBindsMap;
