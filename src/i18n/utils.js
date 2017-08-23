import {isUndefined} from './../helpers/mixed';
import {objectEach} from './../helpers/object';
import {arrayEach} from './../helpers/array';

/**
 * Perform shallow extend of a target object with only this extension's properties which doesn't exist in the target.
 *
 * @param {Object} target An object that will receive the new properties.
 * @param {Object} extension An object containing additional properties to merge into the target.
 */

// TODO: Maybe it should be moved to global helpers? It's changed `extend` function.
export function extendNotExistingKeys(target, extension) {
  objectEach(extension, (value, key) => {
    if (isUndefined(target[key])) {
      target[key] = value;
    }
  });

  return target;
}

export function hasArrayRangeOfNextNumbers(numbers) {
  if (numbers.length <= 1) {
    return false;
  }

  return numbers.every((number, index) => {
    if (index > 0) {
      return number - numbers[index - 1] === 1;
    }

    return true;
  });
};

function formatArrayToStringRange(array) {
  if (Array.isArray(array) && hasArrayRangeOfNextNumbers(array)) {
    return `${array[0]}-${array[array.length - 1]}`;
  }

  return array;
}

export function getFormattedObjectValues(object) {
  arrayEach(Object.keys(object), (key) => {
    object[key] = formatArrayToStringRange(object[key]);
  });

  return object;
}
