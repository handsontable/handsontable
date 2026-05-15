import { getIntersectionOfArrays } from '../../../helpers/array';
import { isObjectEqual, isKeyValueObject } from '../../../helpers/object';
import { isJSON } from '../../../helpers/string';

/**
 * Retrieves checkbox element from the item element.
 *
 * @param {HTMLLIElement} itemElement Parent element.
 * @returns {HTMLInputElement|null}
 */
export function getCheckboxElement(itemElement: HTMLLIElement): HTMLInputElement | null {
  return itemElement.querySelector('input[type="checkbox"]');
}

/**
 * Parses a stringified value and returns a JavaScript value when possible.
 *
 * @param {string} value Value originating from the textarea or dataset.
 * @returns {*}
 */
export function parseStringifiedValue(value: unknown): unknown {
  return typeof value === 'string' && isJSON(value) ? JSON.parse(value) : value;
}

/**
 * Returns an array containing only values present in both provided arrays.
 *
 * @param {Array} valuesArray Values currently selected in the editor.
 * @param {Array} source Array of available source items.
 * @returns {Array}
 */
export function getValuesIntersection(valuesArray: unknown[], source: unknown[]): unknown[] {
  return getIntersectionOfArrays(
    valuesArray as (string | number)[],
    source as (string | number)[],
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
export function includesValue(array: unknown[], element: unknown): boolean {
  if (isKeyValueObject(element)) {
    return Array.isArray(array) && array.some(
      (value) => {
        return isKeyValueObject(value) ? isObjectEqual(value as object, element as object) : value === element;
      }
    );
  }

  return array.includes(element);
}
