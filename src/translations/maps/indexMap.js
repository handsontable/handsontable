import BaseMap from './baseMap';
import { getListWithRemovedItems, getListWithInsertedItems } from './utils/visuallyIndexed';
import { getDecreasedIndexes, getIncreasedIndexes } from './utils/actionsOnIndexes';

/**
 * Map for storing mappings from an visual index to an physical index.
 */
class IndexMap extends BaseMap {
  constructor() {
    // Not handling custom init function or init value.
    super(index => index);
  }

  /**
   * Add values to list and reorganize.
   *
   * @private
   * @param {Number} insertionIndex Position inside actual list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  insert(insertionIndex, insertedIndexes) {
    const listAfterUpdate = getIncreasedIndexes(this.list, insertionIndex, insertedIndexes);

    this.list = getListWithInsertedItems(listAfterUpdate, insertionIndex, insertedIndexes);

    super.insert(insertionIndex, insertedIndexes);
  }

  /**
   * Remove values from the list and reorganize.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  remove(removedIndexes) {
    const listAfterUpdate = getListWithRemovedItems(this.list, removedIndexes);

    this.list = getDecreasedIndexes(listAfterUpdate, removedIndexes);

    super.remove(removedIndexes);
  }
}

export default IndexMap;
