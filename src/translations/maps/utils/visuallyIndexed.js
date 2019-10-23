import { arrayFilter } from '../../../helpers/array';

/**
 * Insert new indexes to the list.
 *
 * @private
 * @param {Array} indexesList List of indexes.
 * @param {Number} insertionIndex Position inside the actual list.
 * @param {Array} insertedIndexes List of inserted indexes.
 * @returns List with new mappings.
 */
export function getListWithInsertedItems(indexesList, insertionIndex, insertedIndexes) {
  return [...indexesList.slice(0, insertionIndex), ...insertedIndexes, ...indexesList.slice(insertionIndex)];
}

/**
 * Filter indexes from the list.
 *
 * @private
 * @param {Array} indexesList List of indexes.
 * @param {Array} removedIndexes List of removed indexes.
 * @returns Reduced list of mappings.
 */
export function getListWithRemovedItems(indexesList, removedIndexes) {
  return arrayFilter(indexesList, (index) => {
    return removedIndexes.includes(index) === false;
  });
}
