import IndexedElement from '../indexedElement';
import { getListWithRemovedItems, getListWithInsertedItems } from '../utils/physicallyIndexedElement';

/**
 * Map for storing mappings from an physical index to a value.
 */
class PhysicalIndexToValueMap extends IndexedElement {
  /**
   * Add values to list and reorganize.
   *
   * @private
   * @param {number} insertionIndex Position inside the list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  insert(insertionIndex, insertedIndexes) {
    this.indexedValues = getListWithInsertedItems(this.indexedValues, insertionIndex, insertedIndexes, this.initValueOrFn);

    super.insert(insertionIndex, insertedIndexes);
  }

  /**
   * Remove values from the list and reorganize.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  remove(removedIndexes) {
    this.indexedValues = getListWithRemovedItems(this.indexedValues, removedIndexes);

    super.remove(removedIndexes);
  }
}

export default PhysicalIndexToValueMap;
