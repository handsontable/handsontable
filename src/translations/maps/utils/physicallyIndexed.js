import { isFunction } from '../../../helpers/function';
import { arrayFilter } from '../../../helpers/array';

/**
 * Insert new items to the list.
 *
 * @private
 * @param {Array} indexedValues List of values for particular indexes.
 * @param {number} insertionIndex Position inside the actual list.
 * @param {Array} insertedIndexes List of inserted indexes.
 * @param {*} insertedValuesMapping Mapping which may provide value or function returning value for the specific parameters.
 * @returns {Array} List with new mappings.
 */
export function getListWithInsertedItems(indexedValues, insertionIndex, insertedIndexes, insertedValuesMapping) {
  const firstInsertedIndex = insertedIndexes.length ? insertedIndexes[0] : void 0;

  return [
    ...indexedValues.slice(0, firstInsertedIndex),
    ...insertedIndexes.map((insertedIndex, ordinalNumber) => {
      if (isFunction(insertedValuesMapping)) {
        return insertedValuesMapping(insertedIndex, ordinalNumber);
      }

      return insertedValuesMapping;
    }),
    ...(firstInsertedIndex === void 0 ? [] : indexedValues.slice(firstInsertedIndex)),
  ];
}

/**
 * Filter items from the list.
 *
 * @private
 * @param {Array} indexedValues List of values for particular indexes.
 * @param {Array} removedIndexes List of removed indexes.
 * @returns {Array} Reduced list of mappings.
 */
export function getListWithRemovedItems(indexedValues, removedIndexes) {
  return arrayFilter(indexedValues, (_, index) => removedIndexes.includes(index) === false);
}
