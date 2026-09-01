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
  if (removedIndexes.length === 0) {
    return indexedValues.slice();
  }

  // Sort the removed indexes once, then for each value count how many removed indexes are below it
  // with a binary search. This replaces a per-element `removedIndexes.filter(...)` (O(n × k)) with
  // O(n log k) — the dominant cost when removing many rows from a large dataset.
  const sortedRemoved = Int32Array.from(removedIndexes).sort();

  return arrayMap(indexedValues, (index) => {
    let low = 0;
    let high = sortedRemoved.length;

    while (low < high) {
      const mid = Math.floor((low + high) / 2);

      if (sortedRemoved[mid] < index) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    return index - low;
  });
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
