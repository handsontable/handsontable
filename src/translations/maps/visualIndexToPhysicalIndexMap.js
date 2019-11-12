import IndexMap from './indexMap';
import { getListWithRemovedItems, getListWithInsertedItems } from './utils/visuallyIndexed';
import { getDecreasedIndexes, getIncreasedIndexes } from './utils/actionsOnIndexes';

/**
 * Map for storing mappings from an visual index to an physical index.
 */
class VisualIndexToPhysicalIndexMap extends IndexMap {
  constructor() {
    // Not handling custom init function or init value.
    super(index => index);
  }

  /**
   * Add values to list and reorganize.
   *
   * @private
   * @param {Number} insertionIndex Position inside the list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  insert(insertionIndex, insertedIndexes) {
    const listAfterUpdate = getIncreasedIndexes(this.indexedValues, insertionIndex, insertedIndexes);

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

export default VisualIndexToPhysicalIndexMap;
