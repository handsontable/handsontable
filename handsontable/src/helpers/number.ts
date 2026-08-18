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
 * Converts a decimal or scientific-notation numeric string to its plain decimal form
 * (`1e2` → `100`, `1e-7` → `0.0000001`). Leading zeros and a leading `+` are dropped, and the
 * `.5`/`5.` shorthands gain the missing digit. Trailing fractional zeros are kept — they carry
 * the information [[isLossyNumericConversion]] detects. A string that does not match the plain
 * number grammar is returned trimmed but otherwise unchanged.
 *
 * @param {string} numericText The numeric string to normalize.
 * @returns {string}
 */
function toPlainDecimalString(numericText: string): string {
  const match = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(numericText.trim());

  if (match === null || (match[2] === '' && (match[3] ?? '') === '')) {
    return numericText.trim();
  }

  const sign = match[1] === '-' ? '-' : '';
  const integerDigits = match[2];
  const fractionDigits = match[3] ?? '';
  const exponent = Number.parseInt(match[4] ?? '0', 10);
  let digits = `${integerDigits}${fractionDigits}`;
  let pointIndex = integerDigits.length + exponent;

  if (pointIndex > digits.length) {
    digits = digits.padEnd(pointIndex, '0');
  }

  if (pointIndex < 1) {
    digits = `${'0'.repeat(1 - pointIndex)}${digits}`;
    pointIndex = 1;
  }

  const integerPart = digits.slice(0, pointIndex).replace(/^0+(?=\d)/, '');
  const fractionPart = digits.slice(pointIndex);

  return `${sign}${integerPart}${fractionPart.length > 0 ? `.${fractionPart}` : ''}`;
}

/**
 * Whether converting a plain numeric string to its parsed JS number loses information.
 * Two situations count as lossy: trailing fractional zeros (e.g. `9.0` → `9`) and precision
 * beyond `Number.MAX_SAFE_INTEGER` (e.g. `12345678901234567.8` → `12345678901234568`).
 *
 * Both the input and `String(parsedNumber)` are normalized to plain decimal notation before
 * comparing, so purely cosmetic differences (leading zeros, a leading `+`, `.5`/`5.`, and
 * scientific notation on either side — `1e2` vs `100`, `0.0000001` vs `1e-7`) are not treated
 * as loss. A mantissa trailing zero that a positive exponent shifts onto or left of the
 * decimal point (`1.0e2` → `100`, `1.10e2` → `110`) survives as an integer digit of the exact
 * value, so it is not loss either; only zeros that stay fractional after the shift
 * (`1.10e1` → `11.0`) are dropped by parsing and count as lossy.
 *
 * Intended only for the plain float path. Thousands-grouped inputs (e.g. `7.000`) are resolved
 * by the caller before this runs and must not be passed here.
 *
 * @param {string} rawInput The raw user input string.
 * @param {number} parsedNumber The number produced from `rawInput` by `getParsedNumber`.
 * @returns {boolean}
 */
export function isLossyNumericConversion(rawInput: string, parsedNumber: number): boolean {
  return toPlainDecimalString(rawInput.replace(',', '.')) !== toPlainDecimalString(String(parsedNumber));
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
