/**
 * Checks if value of n is a numeric one
 * http://jsperf.com/isnan-vs-isnumeric/4
 * @param n
 * @returns {boolean}
 */
export function isNumeric(n) {
  /* eslint-disable */
  var t = typeof n;

  return t == 'number' ? !isNaN(n) && isFinite(n) :
    t == 'string' ? !n.length ? false :
      n.length == 1 ? /\d/.test(n) :
        /^\s*[+-]?\s*(?:(?:\d+(?:\.\d+)?(?:e[+-]?\d+)?)|(?:0x[a-f\d]+))\s*$/i.test(n) :
      t == 'object' ? !!n && typeof n.valueOf() == 'number' && !(n instanceof Date) : false;
}

/**
 * A specialized version of `.forEach` defined by ranges.
 *
 * @param {Number} rangeFrom The number from start iterate.
 * @param {Number|Function} rangeTo The number where finish iterate or function as a iteratee.
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
  while (++index <= rangeTo) {
    if (iteratee(index) === false) {
      break;
    }
  }
}

/**
 * A specialized version of `.forEach` defined by ranges iterable in reverse order.
 *
 * @param {Number} rangeFrom The number from start iterate.
 * @param {Number|Function} rangeTo The number where finish iterate or function as a iteratee.
 * @param {Function} [iteratee] The function invoked per iteration.
 */
export function rangeEachReverse(rangeFrom, rangeTo, iteratee) {
  let index = rangeFrom + 1;

  if (typeof rangeTo === 'function') {
    iteratee = rangeTo;
    rangeTo = 0;
  }
  while (--index >= rangeTo) {
    if (iteratee(index) === false) {
      break;
    }
  }
}

/**
 * Calculate value from percent.
 *
 * @param {Number} value Base value from percent will be calculated.
 * @param {String|Number} percent Can be Number or String (eq. `'33%'`).
 * @returns {Number}
 */
export function valueAccordingPercent(value, percent) {
  percent = parseInt(percent.toString().replace('%', ''), 10);
  percent = parseInt(value * percent / 100, 10);

  return percent;
}
