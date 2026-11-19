import { isPlainObject } from '../../helpers/object';

/**
 * Tells whether two dialog descriptions would render the same dialog. Plain objects (`a11y`, `template`) and
 * arrays (`template.buttons`) are compared by value, so a wrapper that sends an equal object on every render does
 * not count as a change. Anything else is compared by identity: a content element or a button callback is the same
 * only when it is the same object. A generic deep comparison does not fit here, because it reads an element or a
 * function as an empty value and would call two different contents equal.
 *
 * @param {*} first The first value.
 * @param {*} second The second value.
 * @returns {boolean}
 */
export function isSameDialogDescription(first: unknown, second: unknown): boolean {
  if (first === second) {
    return true;
  }

  if (Array.isArray(first) && Array.isArray(second)) {
    return first.length === second.length &&
      first.every((value, index) => isSameDialogDescription(value, second[index]));
  }

  if (isPlainObject(first) && isPlainObject(second)) {
    const firstKeys = Object.keys(first);

    return firstKeys.length === Object.keys(second).length &&
      firstKeys.every(key => key in second && isSameDialogDescription(first[key], second[key]));
  }

  return false;
}
