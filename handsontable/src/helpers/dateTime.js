import { isEmpty } from './mixed';

/**
 * ISO 8601 date pattern.
 *
 * @type {RegExp}
 */
export const ISO_DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/**
 * Get normalized Date object for the ISO formatted date strings.
 * Natively, the date object parsed from a ISO 8601 string will be offsetted by the timezone difference, which may result in returning a wrong date.
 * See: Github issue #3338.
 *
 * @param {string} dateString String representing the date.
 * @returns {Date} The proper Date object.
 */
export function getNormalizedDate(dateString) {
  const nativeDate = new Date(dateString);

  // NaN if dateString is not in ISO format
  if (!isNaN(new Date(`${dateString}T00:00`).getDate())) {

    // Compensate timezone offset
    return new Date(nativeDate.getTime() + (nativeDate.getTimezoneOffset() * 60000));
  }

  return nativeDate;
}

/**
 * Converts a date string to a Date object.
 *
 * @param {*} value The value to parse.
 * @returns {Date | null} The Date object or null if the value is invalid.
 */
export function parseToLocalDate(value) {
  if (isEmpty(value)) {
    return null;
  }

  if (typeof value === 'string' && ISO_DATE_REGEX.test(value)) {
    const [y, m, d] = value.split('-').map(Number);

    return new Date(y, m - 1, d);
  }

  return null;
}

/**
 * Checks if a string is a valid ISO 8601 date.
 *
 * @param {string} value The value to check.
 * @returns {boolean} True if valid ISO date string.
 */
export function isValidISODate(value) {
  if (typeof value !== 'string' || !ISO_DATE_REGEX.test(value)) {
    return false;
  }

  const date = new Date(value);

  return !Number.isNaN(date.getTime()) && value === date.toISOString().slice(0, 10);
}

/**
 * Time pattern: HH:mm, HH:mm:ss, or HH:mm:ss.SSS (24-hour).
 * Same format as HTML input type="time" value; seconds and milliseconds optional.
 *
 * @type {RegExp}
 */
export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.(\d{1,3}))?)?$/;

/**
 * Parses a time string in HH:mm, HH:mm:ss, or HH:mm:ss.SSS format to a Date with that time on the Unix epoch (1970-01-01).
 * Useful for comparison and sorting. Same format as HTML input type="time" value.
 *
 * @param {*} value The value to parse.
 * @returns {Date | null} The Date object or null if the value is invalid.
 */
export function parseToLocalTime(value) {
  if (isEmpty(value)) {
    return null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const match = TIME_REGEX.exec(value);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] !== undefined ? Number(match[3]) : 0;
  const msString = match[4];
  const milliseconds = msString !== undefined
    ? Number(msString.padEnd(3, '0').slice(0, 3))
    : 0;

  return new Date(1970, 0, 1, hours, minutes, seconds, milliseconds);
}

/**
 * Checks if a string is a valid time in HH:mm, HH:mm:ss, or HH:mm:ss.SSS format (00:00–23:59).
 * Same format as HTML input type="time" value.
 *
 * @param {string} value The value to check.
 * @returns {boolean} True if valid time string.
 */
export function isValidTime(value) {
  return typeof value === 'string' && TIME_REGEX.test(value);
}
