import { BaseMap } from '../../../translations';
import { getListWithInsertedItems, getListWithRemovedItems } from '../../../translations/maps/utils/physicallyIndexed';
import { getDecreasedIndexes, getIncreasedIndexes } from '../../../translations/maps/utils/actionsOnIndexes';

/**
 * Map from physical index to another index.
 */
class LooseBindsMap extends BaseMap {
  constructor() {
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
