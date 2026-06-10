import { isEmpty } from './mixed';

/**
 * ISO 8601 date pattern.
 */
export const ISO_DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/**
 * Get normalized Date object for the ISO formatted date strings.
 */
export function getNormalizedDate(dateString: string): Date {
  const nativeDate = new Date(dateString);

  if (!Number.isNaN(new Date(`${dateString}T00:00`).getDate())) {
    return new Date(nativeDate.getTime() + (nativeDate.getTimezoneOffset() * 60000));
  }

  return nativeDate;
}

/**
 * Converts a date string to a Date object.
 */
export function parseToLocalDate(value: unknown): Date | null {
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
 */
export function isValidISODate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE_REGEX.test(value)) {
    return false;
  }
  const date = new Date(value);

  return !Number.isNaN(date.getTime()) && value === date.toISOString().slice(0, 10);
}

/**
 * Time pattern: HH:mm, HH:mm:ss, or HH:mm:ss.SSS (24-hour).
 */
export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.(\d{1,3}))?)?$/;

/**
 * Parses a time string to a Date with that time on the Unix epoch.
 */
export function parseToLocalTime(value: unknown): Date | null {
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
 * Checks if a string is a valid time in HH:mm, HH:mm:ss, or HH:mm:ss.SSS format.
 */
export function isValidTime(value: unknown): value is string {
  return typeof value === 'string' && TIME_REGEX.test(value);
}

/**
 * Returns a Date at local midnight for today.
 *
 * @returns {Date} A Date object representing today at local midnight.
 */
export function getTodayLocalDate(): Date {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Returns a Date at local midnight offset by the given number of days from today.
 *
 * @param {number} days Number of days to offset from today. Positive values are in the future, negative in the past.
 * @returns {Date} A Date object at local midnight offset by the given days.
 */
export function getRelativeLocalDate(days: number): Date {
  const result = getTodayLocalDate();

  result.setDate(result.getDate() + days);

  return result;
}

/**
 * Returns true if both Date objects fall on the same local calendar day.
 *
 * @param {Date} a The first date to compare.
 * @param {Date} b The second date to compare.
 * @returns {boolean} `true` if both dates are on the same local calendar day.
 */
export function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}
