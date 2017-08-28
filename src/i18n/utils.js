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

export function createRange(from, to) {
  if (from.index > to.index) {
    [from, to] = [to, from];
  }

  return `${from.value}-${to.value}`;
}
