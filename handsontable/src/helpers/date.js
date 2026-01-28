import { isEmpty } from './mixed';

/**
 * ISO 8601 date pattern.
 *
 * @type {RegExp}
 */
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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

  return !Number.isNaN(date.getTime());
}
