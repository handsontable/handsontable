/**
 * Returns `true` if the value carries no number to calculate from – `null`, `undefined`, `NaN`, a
 * string that is empty or holds only whitespace, or a string that is not numeric.
 *
 * Booleans do carry a number: `true` is `1` and `false` is `0`, which is what makes a `sum` summary
 * over a `checkbox` column count the ticked boxes.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
export function holdsNoNumber(value: unknown) {
  if (value === null || value === undefined) {
    return true;
  }

  // `isNaN()` coerces with `Number()` first, and `Number('')` is `0`. Without this an empty cell
  // reads as a real zero: `min` over 10/20/30 returns 0, and `count` counts the blank.
  if (typeof value === 'string' && value.trim() === '') {
    return true;
  }

  return isNaN(value as number);
}

/**
 * Rounds a number to a specific number of decimal places.
 *
 * @param {number} value The value to round.
 * @param {number|boolean|string|undefined} [option] Either a number of decimal places to round to, a boolean or "auto".
 * @returns {string|number} The (possibly) rounded number as a string (for displaying the correct precision).
 */
export function roundFloat(value: number | string | undefined, option: unknown) {
  if (typeof value !== 'number') {
    return value;
  }

  const stringifyValue = (number: number) => number.toString();

  switch (typeof option) {
    case 'number':
      return value.toFixed(Math.min(Math.max(0, option), 100));

    case 'boolean':
      return option ? stringifyValue(Math.round(value)) : value;

    case 'string':
      if (option === 'auto') {
        const integerDigits = Math.round(value).toString().length;

        // Make the entire number fit into 8 digits
        return value.toFixed(8 - integerDigits);
      }

      return value;

    default:
      return value;
  }
}
