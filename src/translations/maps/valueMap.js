import BaseMap from './baseMap';
import { getListWithRemovedItems, getListWithInsertedItems } from './utils/physicallyIndexed';

/**
 * Map from physical indexes to value.
 */
class ValueMap extends BaseMap {
  /**
   * Add values to list and reorganize.
   *
   * @private
   * @param {Number} insertionIndex Position inside actual list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  insert(insertionIndex, insertedIndexes) {
    this.list = getListWithInsertedItems(this.list, insertionIndex, insertedIndexes, this.initValuesOrFn);

    this.runLocalHooks('mapChanged');
  }

  /**
   * Remove values from the list and reorganize.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  remove(removedIndexes) {
    this.list = getListWithRemovedItems(this.list, removedIndexes);

    this.runLocalHooks('mapChanged');
  }
}

export default ValueMap;
