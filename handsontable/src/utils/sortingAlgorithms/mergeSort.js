import LinkedList from '../dataStructures/linkedList';

/**
 * Refactored implementation of mergeSort (part of javascript-algorithms project) by Github users:
 * mgechev, AndriiHeonia and lekkas (part of javascript-algorithms project - all project contributors
 * at repository website).
 *
 * Link to repository: https://github.com/mgechev/javascript-algorithms.
 */

/**
 * Specifies a function that defines the sort order. The array is sorted according to each
 * character's Unicode code point value, according to the string conversion of each element.
 *
 * @param {*} a The first compared element.
 * @param {*} b The second compared element.
 * @returns {number}
 */
const defaultCompareFunction = function(a, b) {
  // sort lexically

  const firstValue = a.toString();
  const secondValue = b.toString();

  if (firstValue === secondValue) {
    return 0;

  } else if (firstValue < secondValue) {
    return -1;
  }

  return 1;
};

/**
 * Mergesort method which is recursively called for sorting the input array.
 *
 * @param {Array} array The array which should be sorted.
 * @param {Function} compareFunction Compares two items in an array. If compareFunction is not supplied,
 * elements are sorted by converting them to strings and comparing strings in Unicode code point order.
 * @param {number} startIndex Left side of the subarray.
 * @param {number} endIndex Right side of the subarray.
 * @returns {Array} Array with sorted subarray.
 */
export default function mergeSort(array, compareFunction = defaultCompareFunction, startIndex = 0, endIndex = array.length) { // eslint-disable-line max-len
  if (Math.abs(endIndex - startIndex) <= 1) {
    return [];
  }

  const middleIndex = Math.ceil((startIndex + endIndex) / 2);

  mergeSort(array, compareFunction, startIndex, middleIndex);
  mergeSort(array, compareFunction, middleIndex, endIndex);

  return merge(array, compareFunction, startIndex, middleIndex, endIndex);
}

/**
 * Devides and sort merges two subarrays of given array.
 *
 * @param {Array} array The array which subarrays should be sorted.
 * @param {Function} compareFunction The function with comparision logic.
 * @param {number} startIndex The start of the first subarray.
 * This subarray is with end middle - 1.
 * @param {number} middleIndex The start of the second array.
 * @param {number} endIndex End - 1 is the end of the second array.
 * @returns {Array} The array with sorted subarray.
 */
function merge(array, compareFunction, startIndex, middleIndex, endIndex) {
  const leftElements = new LinkedList();
  const rightElements = new LinkedList();
  const leftSize = middleIndex - startIndex;
  const rightSize = endIndex - middleIndex;
  const maxSize = Math.max(leftSize, rightSize);
  const size = endIndex - startIndex;

  for (let i = 0; i < maxSize; i += 1) {
    if (i < leftSize) {
      leftElements.push(array[startIndex + i]);
    }

    if (i < rightSize) {
      rightElements.push(array[middleIndex + i]);
    }
  }

  let i = 0;

  while (i < size) {
    if (leftElements.first && rightElements.first) {
      if (compareFunction(leftElements.first.data, rightElements.first.data) > 0) {
        array[startIndex + i] = rightElements.shift().data;

      } else {
        array[startIndex + i] = leftElements.shift().data;
      }

    } else if (leftElements.first) {

      array[startIndex + i] = leftElements.shift().data;
    } else {

      array[startIndex + i] = rightElements.shift().data;
    }

    i += 1;
  }

  return array;
}
