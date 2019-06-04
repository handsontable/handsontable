import { BaseMap } from '../../../translations';
import { getListWithInsertedItems, getListWithRemovedItems } from '../../../translations/maps/utils/physicallyIndexed';
import { getDecreasedIndexes, getIncreasedIndexes } from '../../../translations/maps/utils/actionsOnIndexes';

/**
 * Map from visual index to physical index.
 */
class LooseBindsMap extends BaseMap {
  /**
   * Add values to list and reorganize.
   *
   * @private
   * @param {Number} insertionIndex Position inside actual list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  insert(insertionIndex, insertedIndexes) {
    const listAfterUpdate = getIncreasedIndexes(this.list, insertionIndex, insertedIndexes);

    this.list = getListWithInsertedItems(listAfterUpdate, insertionIndex, insertedIndexes, this.initValueOrFn);

    this.runLocalHooks('mapChanged');
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

    this.runLocalHooks('mapChanged');
  }
}

export default LooseBindsMap;
