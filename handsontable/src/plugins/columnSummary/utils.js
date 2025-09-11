/**
 * Returns `true` if the value is one of the type: `null`, `undefined` or `NaN`.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
export function isNullishOrNaN(value) {
  return value === null || value === undefined || isNaN(value);
}

/**
 * Rounds a number to a specific number of decimal places.
 *
 * @param {number} value The value to round.
 * @param {number|boolean|string|undefined} [option] Either a number of decimal places to round to, a boolean or "auto".
 * @returns {string|number} The (possibly) rounded number as a string (for displaying the correct precision).
 */
export function roundFloat(value, option) {
  if (typeof value !== 'number') {
    return value;
  }

  const stringifyValue = number => number.toString();

  switch (typeof option) {
    case 'number':
      return stringifyValue(value.toFixed(Math.min(Math.max(0, option), 100)));

    case 'boolean':
      return option ? stringifyValue(Math.round(value)) : value;

    case 'string':
      if (option === 'auto') {
        const integerDigits = Math.round(value).toString().length;

        // Make the entire number fit into 8 digits
        return stringifyValue(value.toFixed(8 - integerDigits));
      }

    default:
      return value;
  }
}
