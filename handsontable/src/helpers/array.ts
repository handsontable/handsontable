/**
 * @param {Array} arr An array to process.
 */
export function to2dArray(arr) {
  const ilen = arr.length;
  let i = 0;

  while (i < ilen) {
    arr[i] = [arr[i]];
    i += 1;
  }
}

/**
 * @param {Array} arr An array to extend.
 * @param {Array} extension The data to extend from.
 */
export function extendArray(arr, extension) {
  const ilen = extension.length;
  let i = 0;

  while (i < ilen) {
    arr.push(extension[i]);
    i += 1;
  }
}

/**
 * @param {Array} arr An array to pivot.
 * @returns {Array}
 */
export function pivot(arr) {
  const pivotedArr = [];

  if (!arr || arr.length === 0 || !arr[0] || arr[0].length === 0) {
    return pivotedArr;
  }

  const rowCount = arr.length;
  const colCount = arr[0].length;

  for (let i = 0; i < rowCount; i++) {
    for (let j = 0; j < colCount; j++) {
      if (!pivotedArr[j]) {
        pivotedArr[j] = [];
      }

      pivotedArr[j][i] = arr[i][j];
    }
  }

  return pivotedArr;
}

/**
 * A specialized version of `.reduce` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * {@link https://github.com/lodash/lodash/blob/master/lodash.js}.
 *
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {boolean} [initFromArray] Specify using the first element of `array` as the initial value.
 * @returns {*} Returns the accumulated value.
 */
export function arrayReduce(array, iteratee, accumulator, initFromArray) {
  let index = -1;
  let iterable = array;
  let result = accumulator;

  if (!Array.isArray(array)) {
    iterable = Array.from(array);
  }
  const length = iterable.length;

  if (initFromArray && length) {
    index += 1;
    result = iterable[index];
  }

  index += 1;

  while (index < length) {
    result = iteratee(result, iterable[index], index, iterable);
    index += 1;
  }

  return result;
}

/**
 * A specialized version of `.filter` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * {@link https://github.com/lodash/lodash/blob/master/lodash.js}.
 *
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
export function arrayFilter(array, predicate) {
  let index = 0;
  let iterable = array;

  if (!Array.isArray(array)) {
    iterable = Array.from(array);
  }

  const length = iterable.length;
  const result = [];
  let resIndex = -1;

  while (index < length) {
    const value = iterable[index];

    if (predicate(value, index, iterable)) {
      resIndex += 1;
      result[resIndex] = value;
    }

    index += 1;
  }

  return result;
}

/**
 * A specialized version of `.map` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
export function arrayMap(array, iteratee) {
  let index = 0;
  let iterable = array;

  if (!Array.isArray(array)) {
    iterable = Array.from(array);
  }

  const length = iterable.length;
  const result = [];
  let resIndex = -1;

  while (index < length) {
    const value = iterable[index];

    resIndex += 1;
    result[resIndex] = iteratee(value, index, iterable);
    index += 1;
  }

  return result;
}

/**
 * A specialized version of `.forEach` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * {@link https://github.com/lodash/lodash/blob/master/lodash.js}.
 *
 * @param {Array|*} array The array to iterate over or an any element with implemented iterator protocol.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
export function arrayEach(array, iteratee) {
  let index = 0;
  let iterable = array;

  if (!Array.isArray(array)) {
    iterable = Array.from(array);
  }

  const length = iterable.length;

  while (index < length) {
    if (iteratee(iterable[index], index, iterable) === false) {
      break;
    }

    index += 1;
  }

  return array;
}

/**
 * Calculate sum value for each item of the array.
 *
 * @param {Array} array The array to process.
 * @returns {number} Returns calculated sum value.
 */
export function arraySum(array) {
  return arrayReduce(array, (a, b) => (a + b), 0);
}

/**
 * Returns the highest value from an array. Can be array of numbers or array of strings.
 * NOTICE: Mixed values is not supported.
 *
 * @param {Array} array The array to process.
 * @returns {number} Returns the highest value from an array.
 */
export function arrayMax(array) {
  return arrayReduce(array, (a, b) => (a > b ? a : b), Array.isArray(array) ? array[0] : undefined);
}

/**
 * Returns the lowest value from an array. Can be array of numbers or array of strings.
 * NOTICE: Mixed values is not supported.
 *
 * @param {Array} array The array to process.
 * @returns {number} Returns the lowest value from an array.
 */
export function arrayMin(array) {
  return arrayReduce(array, (a, b) => (a < b ? a : b), Array.isArray(array) ? array[0] : undefined);
}

/**
 * Calculate average value for each item of the array.
 *
 * @param {Array} array The array to process.
 * @returns {number} Returns calculated average value.
 */
export function arrayAvg(array) {
  if (!array.length) {
    return 0;
  }

  return arraySum(array) / array.length;
}

/**
 * Flatten multidimensional array.
 *
 * @param {Array} array Array of Arrays.
 * @returns {Array}
 */
export function arrayFlatten(array) {
  return arrayReduce(array, (initial, value) => initial.concat(Array.isArray(value) ? arrayFlatten(value) : value), []);
}

/**
 * Unique values in the array.
 *
 * @param {Array} array The array to process.
 * @returns {Array}
 */
export function arrayUnique(array) {
  const unique = [];

  arrayEach(array, (value) => {
    if (unique.indexOf(value) === -1) {
      unique.push(value);
    }
  });

  return unique;
}

/**
 * Differences from two or more arrays.
 *
 * @param {...Array} arrays Array of strings or array of numbers.
 * @returns {Array} Returns the difference between arrays.
 */
export function getDifferenceOfArrays(...arrays) {
  const [first, ...rest] = [...arrays];
  let filteredFirstArray = first;

  arrayEach(rest, (array) => {
    filteredFirstArray = filteredFirstArray.filter(value => !array.includes(value));
  });

  return filteredFirstArray;
}

/**
 * Intersection of two or more arrays.
 *
 * @param {...Array} arrays Array of strings or array of numbers.
 * @returns {Array} Returns elements that exists in every array.
 */
export function getIntersectionOfArrays(...arrays) {
  const [first, ...rest] = [...arrays];
  let filteredFirstArray = first;

  arrayEach(rest, (array) => {
    filteredFirstArray = filteredFirstArray.filter(value => array.includes(value));
  });

  return filteredFirstArray;
}

/**
 * Union of two or more arrays.
 *
 * @param {...Array} arrays Array of strings or array of numbers.
 * @returns {Array} Returns the elements that exist in any of the arrays, without duplicates.
 */
export function getUnionOfArrays(...arrays) {
  const [first, ...rest] = [...arrays];
  const set = new Set(first);

  arrayEach(rest, (array) => {
    arrayEach(array, (value) => {
      if (!set.has(value)) {
        set.add(value);
      }
    });
  });

  return Array.from(set);
}

/**
 * Convert a separated strings to an array of strings.
 *
 * @param {string} value A string of class name(s).
 * @param {string|RegExp} delimiter The pattern describing where each split should occur.
 * @returns {string[]} Returns array of string or empty array.
 */
export function stringToArray(value, delimiter = ' ') {
  return value.split(delimiter);
}
