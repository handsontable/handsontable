import { arrayFilter } from '../../../helpers/array';

/**
 * Above this many removed indexes a `Set` lookup is used instead of `Array.prototype.includes`,
 * turning the removal scan from O(n × k) into O(n + k). Below it, a linear `includes` is cheaper
 * than building a `Set`.
 *
 * @type {number}
 */
const SET_LOOKUP_THRESHOLD = 16;

/**
 * Insert new items to the list.
 *
 * @private
 * @param {Array} indexedValues List of values for particular indexes.
 * @param {number} insertionIndex Position inside the actual list.
 * @param {Array} insertedIndexes List of inserted indexes.
 * @returns {Array} List with new mappings.
 */
export function getListWithInsertedItems(indexedValues: number[], insertionIndex: number, insertedIndexes: number[]) {
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
export function getListWithRemovedItems(indexedValues: number[], removedIndexes: number[]): number[] {
  if (removedIndexes.length <= SET_LOOKUP_THRESHOLD) {
    return arrayFilter(indexedValues, index => removedIndexes.includes(index) === false);
  }

  const removed = new Set(removedIndexes);

  return arrayFilter(indexedValues, index => removed.has(index) === false);
}
