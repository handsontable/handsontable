import { arrayFilter } from '../../../helpers/array';

/**
 * Insert new indexes to the list.
 *
 * @private
 * @param {Number} insertionIndex Position inside actual list.
 * @param {Array} insertedIndexes List of inserted indexes.
 */
export function getListWithInsertedItems(list, insertionIndex, insertedIndexes) {
  return [...list.slice(0, insertionIndex), ...insertedIndexes, ...list.slice(insertionIndex)];
}

/**
 * Filter indexes from the list.
 *
 * @private
 * @param {Array} removedIndexes List of removed indexes.
 */
export function getListWithRemovedItems(list, removedIndexes) {
  return arrayFilter(list, (index) => {
    return removedIndexes.includes(index) === false;
  });
}
