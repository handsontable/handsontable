import { isFunction } from '../../../helpers/function';
import { arrayFilter } from '../../../helpers/array';

/**
 * Insert new values to the list.
 *
 * @private
 * @param {Number} insertionIndex Position inside actual list.
 * @param {Array} insertedIndexes List of inserted indexes.
 */
export function getListWithInsertedItems(list, insertionIndex, insertedIndexes, initValueOrFn) {
  const firstInsertedIndex = insertedIndexes[0];

  return [
    ...list.slice(0, firstInsertedIndex),
    ...insertedIndexes.map((insertedIndex) => {
      if (isFunction(initValueOrFn)) {
        return initValueOrFn(insertedIndex);
      }

      return initValueOrFn;
    }),
    ...list.slice(firstInsertedIndex)
  ];
}

/**
 * Filter indexes from the list.
 *
 * @private
 * @param {Array} removedIndexes List of removed indexes.
 */
export function getListWithRemovedItems(list, removedIndexes) {
  return arrayFilter(list, (_, index) => removedIndexes.includes(index) === false);
}
