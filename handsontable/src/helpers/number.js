/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * Checks if the passed value is numeric one. For example these values (passed as string or number)
 * are considered as numeric values:
 *  - 0.001
 *  - .001
 *  - 10000
 *  - 1e+26
 *  - 22e-26
 *  - .45e+26
 *  - 0xabcdef (hex)
 *  - 0x1 (hex)
 *
 * these values are not considered as numeric:
 *  - - 1000
 *  - 100 000
 *
 * @param {*} value The value to check.
 * @param {string[]} additionalDelimiters An additional delimiters to be used while checking the numeric value.
 * @returns {boolean}
 */
export function isNumeric(value, additionalDelimiters = []) {
  const type = typeof value;

  if (type === 'number') {
    return !isNaN(value) && isFinite(value);

  } else if (type === 'string') {
    if (value.length === 0) {
      return false;

    } else if (value.length === 1) {
      return /\d/.test(value);
    }

    const delimiter = Array.from(new Set(['.', ...additionalDelimiters]))
      .map(d => `\\${d}`)
      .join('|');

    return new RegExp(`^[+-]?(((${delimiter})?\\d+((${delimiter})\\d+)?(e[+-]?\\d+)?)|(0x[a-f\\d]+))$`, 'i')
      .test(value.trim());

  } else if (type === 'object') {
    return !!value && typeof value.valueOf() === 'number' && !(value instanceof Date);
  }

  return false;
}
/* eslint-enable jsdoc/require-description-complete-sentence */

/**
 * Checks if the passed value is numeric-like value. The helper returns `true` for the same
 * values as for the `isNumeric` function plus `true` for numbers delimited by comma.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
export function isNumericLike(value) {
  return isNumeric(value, [',']);
}

/**
 * A specialized version of `.forEach` defined by ranges.
 *
 * @param {number} rangeFrom The number from start iterate.
 * @param {number|Function} rangeTo The number where finish iterate or function as a iteratee.
 * @param {Function} [iteratee] The function invoked per iteration.
 */
export function rangeEach(rangeFrom, rangeTo, iteratee) {
  let index = -1;

  if (typeof rangeTo === 'function') {
    iteratee = rangeTo;
    rangeTo = rangeFrom;
  } else {
    index = rangeFrom - 1;
  }

  /* eslint-disable-next-line no-plusplus */
  while (++index <= rangeTo) {
    if (iteratee(index) === false) {
      break;
    }
  }
}

/**
 * A specialized version of `.forEach` defined by ranges iterable in reverse order.
 *
 * @param {number} rangeFrom The number from start iterate.
 * @param {number|Function} rangeTo The number where finish iterate or function as a iteratee.
 * @param {Function} [iteratee] The function invoked per iteration.
 */
export function rangeEachReverse(rangeFrom, rangeTo, iteratee) {
  let index = rangeFrom + 1;

  if (typeof rangeTo === 'function') {
    iteratee = rangeTo;
    rangeTo = 0;
  }
  /* eslint-disable-next-line no-plusplus */
  while (--index >= rangeTo) {
    if (iteratee(index) === false) {
      break;
    }
  }
}

/**
 * Calculate value from percent.
 *
 * @param {number} value Base value from percent will be calculated.
 * @param {string|number} percent Can be number or string (eq. `'33%'`).
 * @returns {number}
 */
export function valueAccordingPercent(value, percent) {
  percent = parseInt(percent.toString().replace('%', ''), 10);
  percent = isNaN(percent) ? 0 : percent;

  return parseInt(value * percent / 100, 10);
}

/**
 * Clamps the value between min and max.
 *
 * @param {number} value The base number value.
 * @param {number} minValue The max number value.
 * @param {number} maxValue The min number value.
 * @returns {number}
 */
export function clamp(value, minValue, maxValue) {
  if (Math.min(value, minValue) === value) {
    return minValue;

  } else if (Math.max(value, maxValue) === value) {
    return maxValue;
  }

  return value;
}
