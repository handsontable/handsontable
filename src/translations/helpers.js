import { arrayMap, arrayReduce } from '../helpers/array';

/**
 * Get built list of values.
 *
 * @param {Number} listLength Length of list.
 * @param {Function} mappingFn Mapping function for every element of created list.
 * @returns {Array}
 */
export function buildIndexToValueList(listLength, mappingFn) {
  return arrayMap(new Array(listLength), (value, physicalIndex) => mappingFn(value, physicalIndex));
}

/**
 * Get indexes list by given condition.
 *
 * @param {Array} valueList List of values.
 * @param {Function} condition Condition for values to meet.
 * @returns {Array}
 */
export function getIndexListByCondition(valueList, condition) {
  return arrayReduce(valueList, (indexList, value, physicalIndex) => {
    if (condition(value, physicalIndex)) {
      return indexList.concat(physicalIndex);
    }

    return indexList;
  }, []);
}
