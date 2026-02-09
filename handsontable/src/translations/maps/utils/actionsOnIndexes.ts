import { arrayMap } from '../../../helpers/array';

/**
 * Transform mappings after removal.
 *
 * @private
 * @param {Array} indexedValues List of values for particular indexes.
 * @param {Array} removedIndexes List of removed indexes.
 * @returns {Array} List with decreased indexes.
 */
export function getDecreasedIndexes(indexedValues: number[], removedIndexes: number[]) {
  return arrayMap(indexedValues, (index: unknown) => (index as number) - removedIndexes.filter((removedIndex: number) => removedIndex < (index as number)).length);
}

/**
 * Transform mappings after insertion.
 *
 * @private
 * @param {Array} indexedValues List of values for particular indexes.
 * @param {Array} insertedIndexes List of inserted indexes.
 * @returns {Array} List with increased indexes.
 */
export function getIncreasedIndexes(indexedValues: number[], insertedIndexes: number[]) {
  const firstInsertedIndex = insertedIndexes[0];
  const amountOfIndexes = insertedIndexes.length;

  return arrayMap(indexedValues, (index) => {
    if ((index as number) >= firstInsertedIndex) {
      return (index as number) + amountOfIndexes;
    }

    return index;
  });
}
