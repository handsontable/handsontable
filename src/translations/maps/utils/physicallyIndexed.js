import { isFunction } from '../../../helpers/function';
import { arrayFilter } from '../../../helpers/array';

/**
 * Insert new values to the list.
 *
 * @private
 * @param {Array} indexesList List of indexes.
 * @param {Number} insertionIndex Position inside the actual list.
 * @param {Array} insertedIndexes List of inserted indexes.
 * @param {*} insertedValuesMapping Mapping which may provide value or function returning value for the specific parameters.
 * @returns List with new mappings.
 */
export function getListWithInsertedItems(indexesList, insertionIndex, insertedIndexes, insertedValuesMapping) {
  const firstInsertedIndex = insertedIndexes[0];

  return [
    ...indexesList.slice(0, firstInsertedIndex),
    ...insertedIndexes.map((insertedIndex, ordinalNumber) => {
      if (isFunction(insertedValuesMapping)) {
        return insertedValuesMapping(insertedIndex, ordinalNumber);
      }

      return insertedValuesMapping;
    }),
    ...indexesList.slice(firstInsertedIndex)
  ];
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
  return arrayFilter(indexesList, (_, index) => removedIndexes.includes(index) === false);
}
