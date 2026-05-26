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
 * @param {Array} arr An array to pivot.
 * @returns {Array}
 */
export function pivot(arr: unknown[][]): unknown[] {
  const pivotedArr: unknown[][] = [];

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
 * Unique values in the array.
 *
 * @param {Array} array The array to process.
 * @returns {Array}
 */
export function arrayUnique<T = unknown>(array: T[]): T[] {
  const unique: T[] = [];

  arrayEach(array, (value: T) => {
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
export function getDifferenceOfArrays<T extends string | number>(...arrays: Array<T[]>): T[] {
  const [first, ...rest] = [...arrays];
  let filteredFirstArray = first;

  arrayEach(rest, (array) => {
    filteredFirstArray = filteredFirstArray.filter(value => !array.includes(value));
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

  const isMatch = comparator
    ? (value: string | number, array: Array<string | number>) => array.some(item => comparator!(value, item))
    : (value: string | number, array: Array<string | number>) => array.includes(value);
  const [first, ...rest] = arrays;
  let filteredFirstArray = first;

  arrayEach(rest, (array) => {
    filteredFirstArray = filteredFirstArray.filter(value => isMatch(value, array));
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
