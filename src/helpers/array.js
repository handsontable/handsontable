
export function to2dArray(arr) {
  var i = 0,
    ilen = arr.length;

  while (i < ilen) {
    arr[i] = [arr[i]];
    i++;
  }
}

export function extendArray(arr, extension) {
  var i = 0,
    ilen = extension.length;

  while (i < ilen) {
    arr.push(extension[i]);
    i++;
  }
}

export function pivot(arr) {
  var pivotedArr = [];

  if (!arr || arr.length === 0 || !arr[0] || arr[0].length === 0) {
    return pivotedArr;
  }

  var rowCount = arr.length;
  var colCount = arr[0].length;

  for (var i = 0; i < rowCount; i++) {
    for (var j = 0; j < colCount; j++) {
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
 * {@link https://github.com/lodash/lodash/blob/master/lodash.js}
 *
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {Boolean} [initFromArray] Specify using the first element of `array` as the initial value.
 * @returns {*} Returns the accumulated value.
 */
export function arrayReduce(array, iteratee, accumulator, initFromArray) {
  let index = -1,
    length = array.length;

  if (initFromArray && length) {
    accumulator = array[++index];
  }
  while (++index < length) {
    accumulator = iteratee(accumulator, array[index], index, array);
  }

  return accumulator;
}

/**
 * A specialized version of `.filter` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * {@link https://github.com/lodash/lodash/blob/master/lodash.js}
 *
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
export function arrayFilter(array, predicate) {
  let index = -1,
    length = array.length,
    resIndex = -1,
    result = [];

  while (++index < length) {
    let value = array[index];

    if (predicate(value, index, array)) {
      result[++resIndex] = value;
    }
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
  let index = -1,
    length = array.length,
    resIndex = -1,
    result = [];

  while (++index < length) {
    let value = array[index];

    result[++resIndex] = iteratee(value, index, array);
  }

  return result;
}

/**
 * A specialized version of `.forEach` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * {@link https://github.com/lodash/lodash/blob/master/lodash.js}
 *
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
export function arrayEach(array, iteratee) {
  let index = -1,
    length = array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }

  return array;
}

/**
 * Calculate sum value for each item of the array.
 *
 * @param {Array} array The array to process.
 * @returns {Number} Returns calculated sum value.
 */
export function arraySum(array) {
  return arrayReduce(array, (a, b) => (a + b), 0);
}

/**
 * Returns the highest value from an array. Can be array of numbers or array of strings.
 * NOTICE: Mixed values is not supported.
 *
 * @param {Array} array The array to process.
 * @returns {Number} Returns the highest value from an array.
 */
export function arrayMax(array) {
  return arrayReduce(array, (a, b) => (a > b ? a : b), Array.isArray(array) ? array[0] : void 0);
}

/**
 * Returns the lowest value from an array. Can be array of numbers or array of strings.
 * NOTICE: Mixed values is not supported.
 *
 * @param {Array} array The array to process.
 * @returns {Number} Returns the lowest value from an array.
 */
export function arrayMin(array) {
  return arrayReduce(array, (a, b) => (a < b ? a : b), Array.isArray(array) ? array[0] : void 0);
}

/**
 * Calculate average value for each item of the array.
 *
 * @param {Array} array The array to process.
 * @returns {Number} Returns calculated average value.
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
 * @param {Array} array Array of Arrays
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
  let unique = [];

  arrayEach(array, (value) => {
    if (unique.indexOf(value) === -1) {
      unique.push(value);
    }
  });

  return unique;
}
