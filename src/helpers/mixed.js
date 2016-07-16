
/**
 * Converts any value to string.
 *
 * @param {*} value
 * @returns {String}
 */
export function stringify(value) {
  switch (typeof value) {
    case 'string':
    case 'number':
      return value + '';

    case 'object':
      if (value === null) {
        return '';

      } else {
        return value.toString();
      }
      break;
    case 'undefined':
      return '';

    default:
      return value.toString();
  }
}

/**
 * Checks if variable is defined.
 *
 * @param variable
 * @returns {boolean}
 */
export function isDefined(variable) {
  return typeof variable !== 'undefined';
}

/**
 * Checks if variable is undefined.
 *
 * @param variable
 * @returns {boolean}
 */
export function isUndefined(variable) {
  return typeof variable === 'undefined';
}
