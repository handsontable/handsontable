import { stringToArray, getIntersectionOfArrays } from '../../../helpers/array';
import { isObjectEqual, isKeyValueObject } from '../../../helpers/object';
import { isJSON } from '../../../helpers/string';

/**
 * Retrieves checkbox element from the item element.
 *
 * @param {HTMLLIElement} itemElement
 * @returns {HTMLInputElement|null}
 */
export function getCheckboxElement(itemElement) {
  return itemElement.querySelector('input[type="checkbox"]');
}

/**
 * Retrieves values from the textarea value.
 *
 * @param {string} textareaValue The value of the textarea.
 * @returns {string[]} The values from the textarea.
 */
export function getValuesFromTextarea(textareaValue) {
  return stringToArray(textareaValue, ',').map(value => value.trim());
}

/**
 * Retrieves the list item element that belongs to a checkbox with a given value.
 *
 * @param {string} value Value used in the checkbox id suffix.
 * @param {HTMLUListElement} listElement List element that contains the options.
 * @returns {HTMLLIElement|null} Matching list item or null when nothing matches.
 */
export function getItemElementByValue(value, listElement) {
  return listElement
    .querySelector(`input[type="checkbox"][id="htMultiSelectItem-${value}"]`)
    ?.closest('li') || null;
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
 * Retrieves a source item that matches the provided value.
 *
 * @param {*} value Value to match against the source items.
 * @param {Array} source Array of source items with a `value` key.
 * @returns {*|undefined}
 */
export function getSourceItemByValue(value, source) {
  return source.find(item => isKeyValueObject(item) ? item.value === value : item === value);
}

/**
 * Checks if an array contains a value using JSON.stringify for comparison.
 *
 * @param {Array} array
 * @param {*} element
 * @returns {boolean}
 */
export function includesValue(array, element) {
  if (isKeyValueObject(element)) {
    return Array.isArray(array) && array.some(
      value => isKeyValueObject(value) ? isObjectEqual(value, element) : value === element
    );

  } else {
    return array.includes(element);
  }
}