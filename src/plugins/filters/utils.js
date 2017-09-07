import {getComparisonFunction} from 'handsontable/helpers/feature';
import {arrayMap, arrayUnique, arrayEach} from 'handsontable/helpers/array';

const sortCompare = getComparisonFunction();

/**
 * Comparison function for sorting purposes.
 *
 * @param {*} a
 * @param {*} b
 * @returns {Number} Returns number from -1 to 1.
 */
export function sortComparison(a, b) {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  return sortCompare(a, b);
}

/**
 * Convert raw value into visual value.
 *
 * @param {*} value
 * @returns {*}
 */
export function toVisualValue(value) {
  if (value === '') {
    value = '(Blank cells)';
  }

  return value;
}

const SUPPORT_SET_CONSTRUCTOR = new Set([1]).has(1);
const SUPPORT_FAST_DEDUPE = SUPPORT_SET_CONSTRUCTOR && typeof Array.from === 'function';

/**
 * Create an array assertion to compare if an element exists in that array (in a more efficient way than .indexOf).
 *
 * @param {Array} initialData Values to compare.
 * @returns {Function}
 */
export function createArrayAssertion(initialData) {
  if (SUPPORT_SET_CONSTRUCTOR) {
    initialData = new Set(initialData);
  }

  return function(value) {
    let result;

    if (SUPPORT_SET_CONSTRUCTOR) {
      result = initialData.has(value);
    } else {
      /* eslint-disable no-bitwise */
      result = !!~initialData.indexOf(value);
    }

    return result;
  };
}

/**
 * Convert empty-ish values like null and undefined to an empty string.
 *
 * @param value Value to check.
 * @returns {String}
 */
export function toEmptyString(value) {
  return value == null ? '' : value;
}

/**
 * Unify column values (replace `null` and `undefined` values into empty string, unique values and sort them).
 *
 * @param {Array} values An array of values.
 * @returns {Array}
 */
export function unifyColumnValues(values) {
  if (SUPPORT_FAST_DEDUPE) {
    values = Array.from(new Set(values));
  } else {
    values = arrayUnique(values);
  }
  values = values.sort(function(a, b) {
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    if (a === b) {
      return 0;
    }

    return a > b ? 1 : -1;
  });

  return values;
}

/**
 * Intersect 'base' values with 'selected' values and return an array of object.
 *
 * @param {Array} base An array of base values.
 * @param {Array} selected An array of selected values.
 * @param {Function} [callback] A callback function which is invoked for every item in an array.
 * @returns {Array}
 */
export function intersectValues(base, selected, callback) {
  const result = [];
  const same = base === selected;
  let selectedItemsAssertion;

  if (!same) {
    selectedItemsAssertion = createArrayAssertion(selected);
  }

  arrayEach(base, (value) => {
    let checked = false;

    if (same || selectedItemsAssertion(value)) {
      checked = true;
    }
    const item = {checked, value, visualValue: toVisualValue(value)};

    if (callback) {
      callback(item);
    }
    result.push(item);
  });

  return result;
}
