import { getIntersectionOfArrays } from '../../../helpers/array';
import { isObjectEqual, isKeyValueObject } from '../../../helpers/object';
import { isJSON } from '../../../helpers/string';

/**
 * Retrieves checkbox element from the item element.
 *
 * @param {HTMLLIElement} itemElement Parent element.
 * @returns {HTMLInputElement|null}
 */
export function getCheckboxElement(itemElement) {
  return itemElement.querySelector('input[type="checkbox"]');
}

/**
 * Parses a stringified value and returns a JavaScript value when possible.
 *
 * @param {string} value Value originating from the textarea or dataset.
 * @returns {*}
 */
export function parseStringifiedValue(value) {
  return isJSON(value) ? JSON.parse(value) : value;
}

/**
 * Returns an array containing only values present in both provided arrays.
 *
 * @param {Array} valuesArray Values currently selected in the editor.
 * @param {Array} source Array of available source items.
 * @returns {Array}
 */
export function getValuesIntersection(valuesArray, source) {
  return getIntersectionOfArrays(
    valuesArray,
    source,
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  );
}

/**
 * Checks if an array contains a value using JSON.stringify for comparison.
 *
 * @param {Array} array Array of values.
 * @param {string|object} element Value to check.
 * @returns {boolean}
 */
export function includesValue(array, element) {
  if (isKeyValueObject(element)) {
    return Array.isArray(array) && array.some(
      (value) => {
        return isKeyValueObject(value) ? isObjectEqual(value, element) : value === element;
      }
    );

  } else {
    return array.includes(element);
  }
}
