import { isValidISODate } from '../../helpers/dateTime';
import { CURRENCY_SYMBOL_TO_CODE, CURRENCY_SYMBOLS } from '../currencySymbols';
import type { DateOrder } from './locale';

/**
 * A number body with a dot decimal and optional comma grouping (`1,234.56`, `0.5`, `.5`, `1234`).
 */
const DOT_DECIMAL_REGEX = /^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?$|^\.\d+$/;

/**
 * A number body with a comma decimal and optional dot grouping (`1.234,56`, `0,5`, `,5`, `1234`).
 */
const COMMA_DECIMAL_REGEX = /^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?$|^,\d+$/;

/**
 * A zero followed by another digit: a ZIP code or an ID such as `00123`, whose zeros a number
 * would drop.
 */
const LEADING_ZERO_REGEX = /^0\d/;

/**
 * A date with a four-digit year first (`2026-03-12`, `2026/3/12`, `2026.03.12`).
 */
const YEAR_FIRST_DATE_REGEX = /^(\d{4})([-/.])(\d{1,2})\2(\d{1,2})$/;

/**
 * A date with a four-digit year last (`12/03/2026`, `1.4.2026`), whose day and month order is
 * resolved per column.
 */
const YEAR_LAST_DATE_REGEX = /^(\d{1,2})([-/.])(\d{1,2})\2(\d{4})$/;

/**
 * A time with an optional seconds part and an optional `AM`/`PM` marker (`9:05`, `14:30:00`,
 * `9:05 PM`, `12:00am`).
 */
const TIME_VALUE_REGEX = /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([ap])m)?$/i;

/**
 * A number value split into the parts the column-level reading needs.
 */
export interface NumberParts {
  /**
   * The digits and separators, with the sign, currency, and percent sign removed.
   */
  body: string;
  /**
   * Whether the value carried a minus sign.
   */
  negative: boolean;
  /**
   * The ISO 4217 code of the currency symbol the value carried, or `null`.
   */
  currency: string | null;
  /**
   * Whether the value ended with a percent sign.
   */
  percent: boolean;
}

/**
 * How a numeric column reads its values: the decimal separator, the currency, and whether the
 * values are percentages.
 */
export interface NumberMode {
  /**
   * The decimal separator. The other of `.` and `,` is the grouping separator.
   */
  decimalSeparator: '.' | ',';
  /**
   * The column's currency. A value with another currency does not belong to the column.
   */
  currency: string | null;
  /**
   * Whether the column holds percentages. A value without a percent sign does not belong to it.
   */
  percent: boolean;
}

/**
 * A date value read into its ISO form, plus whether it was written zero-padded.
 */
export interface DateReading {
  /**
   * The date as `YYYY-MM-DD`.
   */
  iso: string;
  /**
   * Whether the month was written with two digits.
   */
  paddedMonth: boolean;
  /**
   * Whether the day was written with two digits.
   */
  paddedDay: boolean;
}

/**
 * A time value read into the `HH:mm:ss` form, plus the parts the column's format follows.
 */
export interface TimeReading {
  /**
   * The time as `HH:mm:ss`.
   */
  value: string;
  /**
   * Whether the value carried seconds.
   */
  hasSeconds: boolean;
  /**
   * Whether the value carried an `AM`/`PM` marker.
   */
  hour12: boolean;
}

/**
 * Whether a value is blank: `null`, `undefined`, or a string of whitespace only.
 */
export function isBlank(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

/**
 * Removes a currency symbol from either end of a value. Returns the ISO code it maps to, or `null`.
 */
function takeCurrency(text: string): { currency: string | null; rest: string } {
  for (const symbol of CURRENCY_SYMBOLS) {
    if (text.startsWith(symbol)) {
      return { currency: CURRENCY_SYMBOL_TO_CODE[symbol], rest: text.slice(symbol.length).trim() };
    }

    if (text.endsWith(symbol)) {
      return { currency: CURRENCY_SYMBOL_TO_CODE[symbol], rest: text.slice(0, -symbol.length).trim() };
    }
  }

  return { currency: null, rest: text };
}

/**
 * Splits a number-shaped string into its sign, currency, percent sign, and body. Returns `null` for
 * anything that is not one. The body is checked against a separator grammar later, per column.
 */
export function splitNumberParts(text: string): NumberParts | null {
  let rest = text.trim();
  let negative = false;
  const percent = rest.endsWith('%');

  if (percent) {
    rest = rest.slice(0, -1).trim();
  }

  if (/^[+-]/.test(rest)) {
    negative = rest[0] === '-';
    rest = rest.slice(1).trim();
  }

  const { currency, rest: body } = takeCurrency(rest);

  // `$-3.25` carries its sign after the symbol.
  if (!negative && body.startsWith('-')) {
    return /^[\d.,]+$/.test(body.slice(1)) ? { body: body.slice(1), negative: true, currency, percent } : null;
  }

  return /^[\d.,]+$/.test(body) ? { body, negative, currency, percent } : null;
}

/**
 * Whether a number body is valid under the given decimal separator. A leading zero followed by a
 * digit is rejected under both, since it marks a code rather than a quantity.
 */
export function isNumberBody(body: string, decimalSeparator: '.' | ','): boolean {
  if (LEADING_ZERO_REGEX.test(body)) {
    return false;
  }

  return decimalSeparator === '.' ? DOT_DECIMAL_REGEX.test(body) : COMMA_DECIMAL_REGEX.test(body);
}

/**
 * Counts the digits after the decimal separator.
 */
export function countFractionDigits(body: string, decimalSeparator: '.' | ','): number {
  const index = body.indexOf(decimalSeparator);

  return index === -1 ? 0 : body.length - index - 1;
}

/**
 * Counts the fraction digits of a number as it prints, or `0` for one printed in exponent form.
 */
export function countNumberFractionDigits(value: number): number {
  const [, fraction = ''] = String(value).split('.');

  return /e/i.test(fraction) ? 0 : fraction.length;
}

/**
 * Reads a value as a number under the column's mode, or returns `null` when it does not belong to
 * the column. A percentage is divided by 100 by moving the exponent, which keeps `7.25%` exactly
 * `0.0725` instead of the nearest result of a floating-point division.
 */
export function readNumber(value: unknown, mode: NumberMode): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && !mode.percent ? value : null;
  }

  const parts = typeof value === 'string' ? splitNumberParts(value) : null;

  if (
    parts === null ||
    parts.percent !== mode.percent ||
    (parts.currency !== null && parts.currency !== mode.currency) ||
    !isNumberBody(parts.body, mode.decimalSeparator)
  ) {
    return null;
  }

  const groupSeparator = mode.decimalSeparator === '.' ? ',' : '.';
  const plain = parts.body.replaceAll(groupSeparator, '').replace(mode.decimalSeparator, '.');
  const number = Number(`${parts.negative ? '-' : ''}${plain}${mode.percent ? 'e-2' : ''}`);

  return Number.isFinite(number) ? number : null;
}

/**
 * Reads a value as a boolean: a boolean, or `true`/`false` in any case.
 */
export function readBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const text = value.trim().toLowerCase();

    if (text === 'true' || text === 'false') {
      return text === 'true';
    }
  }

  return null;
}

/**
 * Builds an ISO date from its parts, or returns `null` for a date the calendar does not have.
 */
function toIsoDate(year: string, month: string, day: string): string | null {
  const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

  return isValidISODate(iso) ? iso : null;
}

/**
 * Splits a year-last date into its first and second parts, or returns `null` for another shape.
 */
export function splitYearLastDate(value: unknown): [number, number] | null {
  const match = typeof value === 'string' ? YEAR_LAST_DATE_REGEX.exec(value.trim()) : null;

  return match ? [Number(match[1]), Number(match[3])] : null;
}

/**
 * Reads a value as a date. A year-first date is read as year, month, day; a year-last one follows
 * `order`. Returns `null` for anything else, including a day the month does not have.
 */
export function readDate(value: unknown, order: DateOrder): DateReading | null {
  if (typeof value !== 'string') {
    return null;
  }

  const text = value.trim();
  const yearFirst = YEAR_FIRST_DATE_REGEX.exec(text);
  const yearLast = yearFirst ? null : YEAR_LAST_DATE_REGEX.exec(text);
  let parts: { year: string; month: string; day: string } | null = null;

  if (yearFirst) {
    parts = { year: yearFirst[1], month: yearFirst[3], day: yearFirst[4] };

  } else if (yearLast) {
    const [first, second] = [yearLast[1], yearLast[3]];

    parts = order === 'MDY'
      ? { year: yearLast[4], month: first, day: second }
      : { year: yearLast[4], month: second, day: first };
  }

  const iso = parts ? toIsoDate(parts.year, parts.month, parts.day) : null;

  return parts && iso
    ? { iso, paddedMonth: parts.month.length === 2, paddedDay: parts.day.length === 2 }
    : null;
}

/**
 * Converts a 12-hour clock hour to a 24-hour one, or returns `null` when it is out of range.
 */
function toTwentyFourHour(hour: number, meridiem: string | undefined): number | null {
  if (meridiem === undefined) {
    return hour <= 23 ? hour : null;
  }

  if (hour < 1 || hour > 12) {
    return null;
  }

  return (hour % 12) + (meridiem.toLowerCase() === 'p' ? 12 : 0);
}

/**
 * Reads a value as a time in the `HH:mm:ss` form. Returns `null` for anything else, including an
 * hour, minute, or second out of range.
 */
export function readTime(value: unknown): TimeReading | null {
  const match = typeof value === 'string' ? TIME_VALUE_REGEX.exec(value.trim()) : null;

  if (!match) {
    return null;
  }

  const hour = toTwentyFourHour(Number(match[1]), match[4]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? 0);

  if (hour === null || minute > 59 || second > 59) {
    return null;
  }

  const pad = (part: number) => String(part).padStart(2, '0');

  return {
    value: `${pad(hour)}:${pad(minute)}:${pad(second)}`,
    hasSeconds: match[3] !== undefined,
    hour12: match[4] !== undefined,
  };
}
