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
 * ISO 8601 date/datetime patterns.
 *
 * @type {RegExp}
 */
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Checks if a value is a valid Date object.
 *
 * @param {*} value The value to check.
 * @returns {boolean} True if valid Date object.
 */
export function isValidDateObject(value) {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Checks if a value is a valid timestamp (number that creates a valid Date).
 *
 * @param {*} value The value to check.
 * @returns {boolean} True if valid timestamp.
 */
export function isValidTimestamp(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return false;
  }

  const date = new Date(value);

  return !isNaN(date.getTime());
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

  return !isNaN(date.getTime());
}

/**
 * Converts a Date, timestamp, or ISO string to YYYY-MM-DD string format.
 *
 * @param {Date | number | string} value The value to convert.
 * @returns {string} Date string in YYYY-MM-DD format, or empty string if invalid.
 */
export function toISO8601Format(value) {
  let date;

  if (value instanceof Date) {
    date = value;

  } else if (typeof value === 'number' && Number.isFinite(value)) {
    date = new Date(value);

  } else if (typeof value === 'string' && ISO_DATE_REGEX.test(value)) {
    date = new Date(value);

  } else {
    return '';
  }

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Converts a Date, timestamp, or ISO string to a Date object.
 *
 * @param {Date | number | string} value The value to convert.
 * @returns {Date | null} Date object, or null if invalid.
 */
export function toDateObject(value) {
  if (value instanceof Date) {
    return value;
  }

  if (
    typeof value === 'number' && Number.isFinite(value) ||
    typeof value === 'string' && ISO_DATE_REGEX.test(value)
  ) {
    return new Date(value);
  }

  return null;
}
