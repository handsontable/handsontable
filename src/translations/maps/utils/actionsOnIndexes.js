import { arrayMap } from '../../../helpers/array';

/**
 * Transform mappings after removal.
 *
 * @private
 * @param {Array} indexesList List of indexes.
 * @param {Array} removedIndexes List of removed indexes.
 */
export function getDecreasedIndexes(indexesList, removedIndexes) {
  return arrayMap(indexesList, index => index - removedIndexes.filter(removedIndex => removedIndex < index).length);
}

/**
 * Transform mappings after insertion.
 *
 * @private
 * @param {Array} indexesList List of indexes.
 * @param {Number} insertionIndex Position inside the actual list.
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
