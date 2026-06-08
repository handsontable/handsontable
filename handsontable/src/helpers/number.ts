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
export function isNumeric(value: unknown, additionalDelimiters: string[] = []): boolean {
  if (typeof value === 'number') {
    return !isNaN(value) && isFinite(value);

  } else if (typeof value === 'string') {
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

  } else if (typeof value === 'object' && value !== null) {
    return typeof value.valueOf() === 'number' && !(value instanceof Date);
  }

  return false;
}

/**
 * Checks if the passed value is numeric-like value. The helper returns `true` for the same
 * values as for the `isNumeric` function plus `true` for numbers delimited by comma.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
export function isNumericLike(value: unknown): boolean {
  return isNumeric(value, [',']);
}

/**
 * Whether the string is an integer with comma-separated thousands groups only.
 * This matches the grouping rule used by [[getParsedNumber]] when the cell uses a dot as the
 * decimal separator. It is not implied by [[isNumericLike]] because `isNumeric` allows at most
 * one comma-delimited segment.
 *
 * @param {string} value The raw string value.
 * @param {'.'|','|undefined} decimalSeparator Preferred decimal separator from cell meta.
 * @returns {boolean}
 */
export function isCommaThousandsGroupedInteger(value: string, decimalSeparator: '.' | ',' | undefined) {
  if (decimalSeparator !== '.' || typeof value !== 'string') {
    return false;
  }

  return /^[+-]?[1-9]\d{0,2}(,\d{3})+$/.test(value.trim());
}

/**
 * Whether the string is an integer with dot-separated thousands groups only.
 * This matches the grouping rule used by European locales where the decimal separator
 * is a comma and the thousands separator is a dot (e.g. `7.000` → 7000).
 *
 * @param {string} value The raw string value.
 * @param {'.'|','|undefined} decimalSeparator Preferred decimal separator from cell meta.
 * @returns {boolean}
 */
export function isDotThousandsGroupedInteger(value: string, decimalSeparator: '.' | ',' | undefined) {
  if (decimalSeparator !== ',' || typeof value !== 'string') {
    return false;
  }

  return /^[+-]?[1-9]\d{0,2}(\.\d{3})+$/.test(value.trim());
}

/**
 * Whether the string is a float with dot-separated thousands groups and a comma decimal part.
 * This matches the grouping rule used by European locales where the decimal separator
 * is a comma and the thousands separator is a dot (e.g. `7.000,25` → 7000.25).
 *
 * @param {string} value The raw string value.
 * @param {'.'|','|undefined} decimalSeparator Preferred decimal separator from cell meta.
 * @returns {boolean}
 */
export function isDotThousandsGroupedFloat(value: string, decimalSeparator: '.' | ',' | undefined) {
  if (decimalSeparator !== ',' || typeof value !== 'string') {
    return false;
  }

  return /^[+-]?[1-9]\d{0,2}(\.\d{3})+,\d+$/.test(value.trim());
}

/**
 * A specialized version of `.forEach` defined by ranges.
 *
 * @param {number} rangeFrom The number from start iterate.
 * @param {number|Function} rangeTo The number where finish iterate or function as a iteratee.
 * @param {Function} [iteratee] The function invoked per iteration.
 */
export function rangeEach(
  rangeFrom: number,
  rangeTo: number | ((index: number) => unknown),
  iteratee?: (index: number) => unknown
): void {
  let index: number;
  let end: number;
  let fn: (index: number) => unknown;

  if (typeof rangeTo === 'function') {
    index = -1;
    end = rangeFrom;
    fn = rangeTo;
  } else {
    index = rangeFrom - 1;
    end = rangeTo;
    fn = iteratee!;
  }

  /* eslint-disable-next-line no-plusplus */
  while (++index <= end) {
    if (fn(index) === false) {
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
export function rangeEachReverse(
  rangeFrom: number,
  rangeTo: number | ((index: number) => unknown),
  iteratee?: (index: number) => unknown
): void {
  let index = rangeFrom + 1;
  let end: number;
  let fn: (index: number) => unknown;

  if (typeof rangeTo === 'function') {
    fn = rangeTo;
    end = 0;
  } else {
    fn = iteratee!;
    end = rangeTo;
  }

  /* eslint-disable-next-line no-plusplus */
  while (--index >= end) {
    if (fn(index) === false) {
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
export function valueAccordingPercent(value: number, percent: string | number): number {
  percent = Number.parseInt(percent.toString().replace('%', ''), 10);
  percent = isNaN(percent) ? 0 : percent;

  return Number.parseInt(String(value * percent / 100), 10);
}

/**
 * Clamps the value between min and max.
 *
 * @param {number} value The base number value.
 * @param {number} minValue The max number value.
 * @param {number} maxValue The min number value.
 * @returns {number}
 */
export function clamp(value: number, minValue: number, maxValue: number): number {
  if (Math.min(value, minValue) === value) {
    return minValue;

  } else if (Math.max(value, maxValue) === value) {
    return maxValue;
  }

  return value;
}

/**
 * Get parsed number from numeric string.
 *
 * @param {string} numericData Float (separated by a dot or a comma), integer, or a dot-thousands
 * grouped value used by European locales (e.g. `7.000` or `7.000,25` when `decimalSeparator` is `','`).
 * @param {object} [options={}] Parsing options.
 * @param {'.'|','} [options.decimalSeparator] Preferred decimal separator used by the cell.
 * @returns {number|null} Number if we get data in parsable format, not changed value otherwise.
 */
export function getParsedNumber(numericData: string, options: { decimalSeparator?: '.' | ',' } = {}) {
  const { decimalSeparator } = options;
  const normalizedNumericData = numericData.trim();

  if (isCommaThousandsGroupedInteger(numericData, decimalSeparator)) {
    return Number.parseFloat(normalizedNumericData.replaceAll(',', ''));
  }

  if (isDotThousandsGroupedInteger(numericData, decimalSeparator)) {
    return Number.parseFloat(normalizedNumericData.replaceAll('.', ''));
  }

  if (isDotThousandsGroupedFloat(numericData, decimalSeparator)) {
    return Number.parseFloat(normalizedNumericData.replaceAll('.', '').replace(',', '.'));
  }

  // Unifying "float like" string. Change from value with comma determiner to value with dot determiner,
  // for example from `450,65` to `450.65`.
  const unifiedNumericData = normalizedNumericData.replace(',', '.');

  if (isNaN(Number.parseFloat(unifiedNumericData)) === false) {
    return Number.parseFloat(unifiedNumericData);
  }

  return null;
}

/**
 * Check if the provided argument is an unsigned number.
 *
 * @param {*} value Value to check.
 * @returns {boolean}
 */
export function isUnsignedNumber(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === 'number' && value >= 0;
}
