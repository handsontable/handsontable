import {isUndefined} from './../helpers/mixed';
import {objectEach} from './../helpers/object';

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

/**
 * Create range from lower to higher value.
 *
 * @param {Object} from Object containing `index` and `value` keys.
 * @param {Object} to Object containing `index` and `value` keys.
 * @returns {string} Value representing range i.e. A-Z, 11-15.
 */
export function createRange(from, to) {
  // Will swap `from` with `to` if it's necessary.
  if (from.index > to.index) {
    [from, to] = [to, from];
  }

  return `${from.value}-${to.value}`;
}
