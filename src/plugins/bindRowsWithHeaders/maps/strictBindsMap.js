import { BaseMap } from '../../../translations';
import { getListWithInsertedItems, getListWithRemovedItems } from '../../../translations/maps/utils/physicallyIndexed';

/**
 * Map from physical index to another index.
 */
class StrictBindsMap extends BaseMap {
  constructor() {
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
    this.list = getListWithInsertedItems(this.list, insertionIndex, insertedIndexes, (_, ordinalNumber) => this.getNextValue(ordinalNumber));

    super.insert(insertionIndex, insertedIndexes);
  }

  /**
   * Remove values from the list and reorganize.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  remove(removedIndexes) {
    this.list = getListWithRemovedItems(this.list, removedIndexes);

    super.remove(removedIndexes);
  }

  getNextValue(ordinalNumber) {
    return Math.max(...this.getValues()) + 1 + ordinalNumber;
  }
}

export default StrictBindsMap;
