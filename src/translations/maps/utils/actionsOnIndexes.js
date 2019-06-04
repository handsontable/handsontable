import { arrayMap } from '../../../helpers/array';

/**
 * Transform list of indexes after removal.
 *
 * @private
 * @param {Array} removedIndexes List of removed indexes.
 */
export function getDecreasedIndexes(list, removedIndexes) {
  return arrayMap(list, index => index - removedIndexes.filter(removedRow => removedRow < index).length);
}

/**
 * Transform list of indexes after insertion.
 *
 * @private
 * @param {Number} insertionIndex Position inside actual list.
 * @param {Array} insertedIndexes List of inserted indexes.
 */
export function getIncreasedIndexes(indexesList, insertionIndex, insertedIndexes) {
  const firstInsertedIndex = insertedIndexes[0];
  const amountOfIndexes = insertedIndexes.length;

  return arrayMap(indexesList, (index) => {
    if (index >= firstInsertedIndex) {
      return index + amountOfIndexes;
    }

    return index;
  });
}
