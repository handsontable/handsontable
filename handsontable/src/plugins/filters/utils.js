import { getComparisonFunction } from '../../helpers/feature';

const sortCompare = getComparisonFunction();

/**
 * Comparison function for sorting purposes.
 *
 * @param {*} a The first value to compare.
 * @param {*} b The second value to compare.
 * @returns {number} Returns number from -1 to 1.
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
 * @param {*} value The value to convert.
 * @param {string} defaultEmptyValue Default value for empty cells.
 * @returns {*}
 */
export function toVisualValue(value, defaultEmptyValue) {
  let visualValue = value;

  if (visualValue === '') {
    visualValue = `(${defaultEmptyValue})`;
  }

  return visualValue;
}

/**
 * Create an array assertion to compare if an element exists in that array (in a more efficient way than .indexOf).
 *
 * @param {Array} initialData Values to compare.
 * @returns {Function}
 */
export function createArrayAssertion(initialData) {
  const dataset = new Set(initialData);

  return function(value) {
    return dataset.has(value);
  };
}

/**
 * Convert empty-ish values like null and undefined to an empty string.
 *
 * @param {*} value Value to check.
 * @returns {string}
 */
export function toEmptyString(value) {
  return value === null || value === undefined ? '' : value;
}

/**
 * Unify column values (remove duplicated values and sort them).
 *
 * @param {Array} values An array of values.
 * @returns {Array}
 */
export function unifyColumnValues(values) {
  return Array.from(new Set(values))
    .map(value => toEmptyString(value))
    .sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
      }

      if (a === b) {
        return 0;
      }

      return a > b ? 1 : -1;
    });
}

/**
 * Intersect 'base' values with 'selected' values and return an array of object.
 *
 * @param {Array} base An array of base values.
 * @param {Array} selected An array of selected values.
 * @param {string} defaultEmptyValue Default value for empty cells.
 * @param {Function} [callback] A callback function which is invoked for every item in an array.
 * @returns {Array}
 */
export function intersectValues(base, selected, defaultEmptyValue, callback) {
  const result = [];
  const same = base === selected;
  let selectedItemsAssertion;

  if (!same) {
    selectedItemsAssertion = createArrayAssertion(selected);
  }

  base.forEach((value) => {
    let checked = false;

    if (same || selectedItemsAssertion(value)) {
      checked = true;
    }

    const item = {
      checked,
      value,
      visualValue: toVisualValue(value, defaultEmptyValue),
    };

    if (callback) {
      callback(item);
    }

    result.push(item);
  });

  return result;
}
