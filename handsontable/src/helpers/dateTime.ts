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
 * Number of days in each month for a non-leap year, indexed by zero-based month.
 */
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Checks if a year is a leap year in the proleptic Gregorian calendar.
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Checks if a string is a valid ISO 8601 date.
 */
export function isValidISODate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE_REGEX.test(value)) {
    return false;
  }

  // The regex guarantees the YYYY-MM-DD shape with month 01-12 and day 01-31. The only remaining
  // check is the calendar bound: that the day fits the given month and year (e.g. rejecting 02-30,
  // 04-31, or 02-29 in a non-leap year). Doing this arithmetically avoids constructing a Date and
  // round-tripping through toISOString() for every cell, which dominated load time on large
  // date-typed grids.
  const year = +value.slice(0, 4);
  const month = +value.slice(5, 7);
  const day = +value.slice(8, 10);
  const maxDay = month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];

  return day <= maxDay;
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
 * ISO 8601 date-time pattern. The date part is required; the time part is optional and may use a
 * `T` or space separator, with optional seconds and fractional seconds (`YYYY-MM-DD`,
 * `YYYY-MM-DDTHH:mm`, `YYYY-MM-DDTHH:mm:ss`, `YYYY-MM-DD HH:mm:ss.SSS`).
 */
export const ISO_DATETIME_REGEX =
  /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(?:[T ]([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.(\d{1,3}))?)?)?$/;

/**
 * Parses an ISO 8601 date-time string to a local Date. Date-only values become local midnight.
 */
export function parseToLocalDateTime(value: unknown): Date | null {
  if (isEmpty(value)) {
    return null;
  }
  if (typeof value !== 'string') {
    return null;
  }

  const match = ISO_DATETIME_REGEX.exec(value);

  if (!match) {
    return null;
  }

  const [datePart] = value.split(/[T ]/);
  const [year, month, day] = datePart.split('-').map(Number);
  const hours = match[3] !== undefined ? Number(match[3]) : 0;
  const minutes = match[4] !== undefined ? Number(match[4]) : 0;
  const seconds = match[5] !== undefined ? Number(match[5]) : 0;
  const milliseconds = match[6] !== undefined
    ? Number(match[6].padEnd(3, '0').slice(0, 3))
    : 0;

  return new Date(year, month - 1, day, hours, minutes, seconds, milliseconds);
}

/**
 * Checks if a string is a valid ISO 8601 date-time, enforcing the day-of-month calendar bound.
 */
export function isValidISODateTime(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const match = ISO_DATETIME_REGEX.exec(value);

  if (!match) {
    return false;
  }

  const year = +value.slice(0, 4);
  const month = +match[1];
  const day = +match[2];
  const maxDay = month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];

  return day <= maxDay;
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

const dateTimeFormatCache = new Map<unknown, Map<string, Intl.DateTimeFormat>>();

/**
 * Two dates whose UTC offsets, read on every call, identify the local time zone well enough for
 * the cache: a single offset cannot tell Europe/London in summer from Africa/Lagos.
 */
const ZONE_PROBE_DATES = [new Date(2024, 0, 1), new Date(2024, 6, 1)];

/**
 * Returns an `Intl.DateTimeFormat` for the locale and options, built once and reused. Building one
 * is far slower than formatting with it, and a renderer's formatter runs for every cell value,
 * including every row AutoColumnSize samples.
 *
 * A string locale is a key of its own, so a value `Intl` rejects (`''`) keeps throwing whatever was
 * formatted before it. Any other locale (an array, an `Intl.Locale`) is keyed by its string form,
 * so a `cells` callback that returns a new array on every call reuses one formatter. The options
 * are keyed by value, so an options object changed in place gets a formatter of its own (only their
 * own enumerable properties are read, so pass a plain object).
 *
 * The local time zone is part of the key too, read as the UTC offsets of two dates: a formatter
 * without a `timeZone` option keeps the zone it was built in, while the renderers parse values to
 * the current local time, so after a time zone change made while the page is open it can render a
 * date one day off and a time some hours off. Two zones with the same offsets on both dates but
 * other daylight saving dates still share a formatter until the page reloads.
 *
 * @param {string|string[]|undefined} locale The locale or locales, `undefined` for the default locale.
 * @param {Intl.DateTimeFormatOptions} options The format options.
 * @returns {Intl.DateTimeFormat}
 */
export function getDateTimeFormat(
  locale: string | readonly string[] | undefined,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const localeKey = locale === undefined || typeof locale === 'string' ? locale : `\u0000${String(locale)}`;
  let localeFormatters = dateTimeFormatCache.get(localeKey);

  if (localeFormatters === undefined) {
    localeFormatters = new Map();
    dateTimeFormatCache.set(localeKey, localeFormatters);
  }

  const zoneKey = `${ZONE_PROBE_DATES[0].getTimezoneOffset()},${ZONE_PROBE_DATES[1].getTimezoneOffset()}`;
  const cacheKey = `${zoneKey}:${JSON.stringify(options)}`;
  let formatter = localeFormatters.get(cacheKey);

  if (formatter === undefined) {
    formatter = new Intl.DateTimeFormat(locale, options);
    localeFormatters.set(cacheKey, formatter);
  }

  return formatter;
}
