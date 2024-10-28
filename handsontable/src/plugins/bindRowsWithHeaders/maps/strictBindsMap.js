import { IndexMap, alterUtilsFactory } from '../../../translations';

const { getListWithInsertedItems, getListWithRemovedItems } = alterUtilsFactory('physicallyIndexed');

/**
 * Map from physical index to another index.
 */
class StrictBindsMap extends IndexMap {
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
    this.indexedValues = getListWithInsertedItems(this.indexedValues, insertionIndex, insertedIndexes,
      (_, ordinalNumber) => this.getNextValue(ordinalNumber));

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

  /**
   * Get next values, which should be greater than actual maximum value in the list.
   *
   * @param {number} ordinalNumber Position in the list.
   * @returns {number}
   */
  getNextValue(ordinalNumber) {
    return Math.max(...this.getValues()) + 1 + ordinalNumber;
  }
}

export default StrictBindsMap;
