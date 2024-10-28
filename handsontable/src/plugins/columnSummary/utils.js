/**
 * Returns `true` if the value is one of the type: `null`, `undefined` or `NaN`.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
export function isNullishOrNaN(value) {
  return value === null || value === undefined || isNaN(value);
}
