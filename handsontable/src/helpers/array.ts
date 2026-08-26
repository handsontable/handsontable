/**
 * @param {Array} arr An array to process.
 */
export function to2dArray(arr: unknown[]): void {
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
export function extendArray(arr: unknown[], extension: unknown[]): void {
  const ilen = extension.length;
  let i = 0;

  while (i < ilen) {
    arr.push(extension[i]);
    i += 1;
  }
}

/**
 * Transposes a two-dimensional array, turning its rows into columns.
 *
 * Rows of unequal length are supported: the widest row decides how many columns come out, and
 * a shorter row contributes the empty-cell value (`null`) for the positions it does not reach.
 *
 * @param {Array} arr An array to pivot.
 * @returns {Array}
 */
export function pivot(arr: unknown[][]): unknown[] {
  const pivotedArr: unknown[][] = [];

  if (!arr || arr.length === 0) {
    return pivotedArr;
  }

  const rowCount = arr.length;
  let colCount = 0;

  // The widest row decides the width. Taking it from the first row alone silently drops every
  // cell past that width, which is data loss for a ragged input.
  for (let i = 0; i < rowCount; i++) {
    const row = arr[i];

    if (row && row.length > colCount) {
      colCount = row.length;
    }
  }

  for (let j = 0; j < colCount; j++) {
    const pivotedRow: unknown[] = new Array(rowCount);

    for (let i = 0; i < rowCount; i++) {
      const row = arr[i];
      const value = row ? row[j] : undefined;

      // A row shorter than the widest one has no value here. Keep the output dense with the
      // empty-cell value rather than leaving a hole for the caller to trip over.
      pivotedRow[i] = value === undefined ? null : value;
    }

    pivotedArr[j] = pivotedRow;
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
 * @param {A} [accumulator] The initial value.
 * @param {boolean} [initFromArray] Specify using the first element of `array` as the initial value.
 * @returns {A} Returns the accumulated value.
 */
export function arrayReduce<T, A>(
  array: T[] | Iterable<T>, iteratee: (acc: A, value: T, index: number, array: T[]) => A,
  accumulator: A, initFromArray?: boolean): A {
  let index = -1;
  const iterable: T[] = Array.isArray(array) ? array : Array.from(array);
  const length = iterable.length;

  if (initFromArray && length) {
    index += 1;
    accumulator = iterable[index] as unknown as A;
  }

  let result = accumulator;

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
export function arrayFilter<T>(
  array: T[] | Iterable<T>, predicate: (value: T, index: number, array: T[]) => unknown): T[] {
  let index = 0;
  const iterable: T[] = Array.isArray(array) ? array : Array.from(array);
  const length = iterable.length;
  const result: T[] = [];
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
export function arrayMap<T, U>(
  array: T[] | Iterable<T>, iteratee: (value: T, index: number, array: T[]) => U): U[] {
  let index = 0;
  const iterable: T[] = Array.isArray(array) ? array : Array.from(array);
  const length = iterable.length;
  const result: U[] = [];
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
export function arrayEach<T>(
  array: T[] | Iterable<T>, iteratee: (value: T, index: number, array: T[]) => unknown): T[] {
  let index = 0;
  let iterable: T[];

  if (Array.isArray(array)) {
    iterable = array;
  } else {
    iterable = Array.from(array);
  }

  const length = iterable.length;

  while (index < length) {
    if (iteratee(iterable[index], index, iterable) === false) {
      break;
    }

    index += 1;
  }

  return iterable;
}

/**
 * Calculate sum value for each item of the array.
 *
 * @param {Array} array The array to process.
 * @returns {number} Returns calculated sum value.
 */
export function arraySum(array: number[]): number {
  return arrayReduce<number, number>(array, (a, b) => a + b, 0);
}

/**
 * Returns the highest value from an array. Can be array of numbers or array of strings.
 * NOTICE: Mixed values is not supported.
 *
 * @param {Array} array The array to process.
 * @returns {number} Returns the highest value from an array.
 */
export function arrayMax(array: number[]): number {
  return arrayReduce<number, number | undefined>(
    array, (a, b) => (a !== undefined && a > b ? a : b), array[0]) as number;
}

/**
 * Returns the lowest value from an array. Can be array of numbers or array of strings.
 * NOTICE: Mixed values is not supported.
 *
 * @param {Array} array The array to process.
 * @returns {number} Returns the lowest value from an array.
 */
export function arrayMin(array: number[]): number {
  return arrayReduce<number, number | undefined>(
    array, (a, b) => (a !== undefined && a < b ? a : b), array[0]) as number;
}

/**
 * Calculate average value for each item of the array.
 *
 * @param {Array} array The array to process.
 * @returns {number} Returns calculated average value.
 */
export function arrayAvg(array: number[]): number {
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
export function arrayFlatten(array: unknown[]): unknown[] {
  return arrayReduce<unknown, unknown[]>(array,
    (initial, value) => initial.concat(Array.isArray(value) ? arrayFlatten(value) : value), []);
}

/**
 * Removes the elements at the given indexes from the array. The array is compacted in one
 * pass and mutated in place, so external references to it stay valid. Cost is O(array length)
 * regardless of how many indexes are removed - unlike one `splice` call per removed index,
 * which re-shifts the tail every time.
 *
 * @param {Array} array The array to mutate.
 * @param {Set<number>} indexes The indexes of the elements to remove.
 * @returns {Array} Returns the same, mutated array.
 */
export function removeIndexesInPlace<T>(array: T[], indexes: Set<number>): T[] {
  let writeIndex = 0;

  for (let readIndex = 0; readIndex < array.length; readIndex++) {
    if (!indexes.has(readIndex)) {
      array[writeIndex] = array[readIndex];
      writeIndex += 1;
    }
  }

  array.length = writeIndex;

  return array;
}

/**
 * Inserts `amount` copies of `value` into the array at the given index. The tail is shifted
 * right once by `amount` and the array is mutated in place, so external references to it stay
 * valid. An index greater than the array length is clamped to it (the values are appended),
 * matching `Array.prototype.splice` semantics. Cost is O(array length + amount) regardless of
 * `amount` - unlike one `splice` call per inserted value, which re-shifts the tail every time.
 *
 * @param {Array} array The array to mutate.
 * @param {number} index The index at which to insert the values.
 * @param {number} amount The number of copies to insert.
 * @param {*} value The value to insert.
 * @returns {Array} Returns the same, mutated array.
 */
export function insertValuesInPlace<T>(array: T[], index: number, amount: number, value: T): T[] {
  if (amount <= 0) {
    return array;
  }

  const oldLength = array.length;
  const insertAt = Math.min(index, oldLength);

  array.length = oldLength + amount;

  for (let i = oldLength - 1; i >= insertAt; i--) {
    array[i + amount] = array[i];
  }

  array.fill(value, insertAt, insertAt + amount);

  return array;
}

/**
 * Unique values in the array.
 *
 * @param {Array} array The array to process.
 * @returns {Array}
 */
export function arrayUnique<T = unknown>(array: T[]): T[] {
  const unique: T[] = [];
  const seen = new Set<T>();

  arrayEach(array, (value: T) => {
    if (!seen.has(value)) {
      seen.add(value);
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
export function getDifferenceOfArrays<T extends string | number>(...arrays: Array<T[]>): T[] {
  const [first, ...rest] = [...arrays];
  let filteredFirstArray = first;

  arrayEach(rest, (array) => {
    const lookup = new Set(array);

    filteredFirstArray = filteredFirstArray.filter(value => !lookup.has(value));
  });

  return filteredFirstArray;
}

type IntersectionComparator = (a: string | number, b: string | number) => boolean;
type IntersectionArg = Array<string | number> | IntersectionComparator;

/**
 * Intersection of two or more arrays.
 *
 * @param {...Array<*|Function>} args Array of elements followed by a comparator function.
 * @returns {Array} Returns elements that exists in every array.
 */
export function getIntersectionOfArrays(
  ...args: IntersectionArg[]
): (string | number)[] {
  const arrays: Array<Array<string | number>> = [];
  let comparator: IntersectionComparator | undefined;

  arrayEach(args, (arg, index) => {
    if (typeof arg === 'function') {
      if (index === args.length - 1) {
        comparator = arg;
      }
    } else {
      arrays.push(arg);
    }
  });

  const [first, ...rest] = arrays;
  let filteredFirstArray = first;

  arrayEach(rest, (array) => {
    if (comparator) {
      filteredFirstArray = filteredFirstArray.filter(value => array.some(item => comparator!(value, item)));

    } else {
      const lookup = new Set(array);

      filteredFirstArray = filteredFirstArray.filter(value => lookup.has(value));
    }
  });

  return filteredFirstArray;
}

/**
 * Union of two or more arrays.
 *
 * @param {...Array} arrays Array of strings or array of numbers.
 * @returns {Array} Returns the elements that exist in any of the arrays, without duplicates.
 */
export function getUnionOfArrays(...arrays: Array<Array<string | number>>): (string | number)[] {
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
export function stringToArray(value: string, delimiter: string | RegExp = ' '): string[] {
  return value.split(delimiter);
}

/**
 * Convert an array of strings to a single string.
 *
 * @param {string[]} array Array of strings.
 * @param {string} separator Separator string.
 * @returns {string} Returns a string made by joining all array elements with a separator.
 */
export function arrayToString(array: string[], separator = ' ') {
  return array.join(separator);
}
