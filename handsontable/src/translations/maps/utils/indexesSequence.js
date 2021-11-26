import { arrayFilter } from '../../../helpers/array';

/**
 * Insert new items to the list.
 *
 * @private
 * @param {Array} indexedValues List of values for particular indexes.
 * @param {number} insertionIndex Position inside the actual list.
 * @param {Array} insertedIndexes List of inserted indexes.
 * @returns {Array} List with new mappings.
 */
export function getListWithInsertedItems(indexedValues, insertionIndex, insertedIndexes) {
  return [...indexedValues.slice(0, insertionIndex), ...insertedIndexes, ...indexedValues.slice(insertionIndex)];
}

/**
 * Filter items from the list.
 *
 * @private
 * @param {Array} indexedValues List of values for particular indexes.
 * @param {Array} removedIndexes List of removed indexes.
 * @returns {Array} Reduced list of mappings.
 */
export function getListWithRemovedItems(indexedValues, removedIndexes) {
  return arrayFilter(indexedValues, (index) => {
    return removedIndexes.includes(index) === false;
  });
}
