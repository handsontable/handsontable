import { arrayMap } from '../../../helpers/array';

/**
 * Transform mappings after removal.
 *
 * @private
 * @param {Array} indexedValues List of values for particular indexes.
 * @param {Array} removedIndexes List of removed indexes.
 * @returns {Array} List with decreased indexes.
 */
export function getDecreasedIndexes(indexedValues: number[], removedIndexes: number[]): number[] {
  return arrayMap(indexedValues, index => index - removedIndexes.filter(removedIndex => removedIndex < index).length);
}

/**
 * Transform mappings after insertion.
 *
 * @private
 * @param {Array} indexedValues List of values for particular indexes.
 * @param {Array} insertedIndexes List of inserted indexes.
 * @returns {Array} List with increased indexes.
 */
export function getIncreasedIndexes(indexedValues: number[], insertedIndexes: number[]): number[] {
  const firstInsertedIndex = insertedIndexes[0];
  const amountOfIndexes = insertedIndexes.length;

  return arrayMap(indexedValues, (index) => {
    if (index >= firstInsertedIndex) {
      return index + amountOfIndexes;
    }

    return index;
  });
}
