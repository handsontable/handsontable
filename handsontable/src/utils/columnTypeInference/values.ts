import { isValidISODate } from '../../helpers/dateTime';
import { CURRENCY_SYMBOLS, isCurrencyCode } from '../currencySymbols';

/**
 * An ungrouped number body with a dot decimal (`1234`, `0.5`, `.5`).
 */
const DOT_PLAIN_REGEX = /^(?:\d+(?:\.\d+)?|\.\d+)$/;

/**
 * A grouped number body with a dot decimal (`1,234.56`, `1 234.56`, `1'234.56`). One grouping
 * character is used throughout a value (the backreference), and a grouped value never starts with
 * `0`, so `0.123` reads as a dot decimal only.
 */
const DOT_GROUPED_REGEX = /^[1-9]\d{0,2}([,\u0020\u00a0\u202f'\u2019])\d{3}(?:\1\d{3})*(?:\.\d+)?$/;

/**
 * An ungrouped number body with a comma decimal (`1234`, `0,5`, `,5`).
 */
const COMMA_PLAIN_REGEX = /^(?:\d+(?:,\d+)?|,\d+)$/;

/**
 * A grouped number body with a comma decimal (`1.234,56`, `1 234,56`), under the same rules as
 * `DOT_GROUPED_REGEX`.
 */
const COMMA_GROUPED_REGEX = /^[1-9]\d{0,2}([.\u0020\u00a0\u202f])\d{3}(?:\1\d{3})*(?:,\d+)?$/;

/**
 * An integer grouped by plain spaces (`601 234 567`). The spaces locales write in a number are
 * U+00A0 and U+202F, so plain ones are how a phone number is typed.
 */
const PLAIN_SPACE_GROUPED_REGEX = /^\d{1,3}(?: \d{3}){2,}$/;

/**
 * The characters a number body may hold: digits, the two decimal separators, and the grouping
 * characters locales write (a space, a no-break space, a narrow no-break space, and an apostrophe).
 */
const NUMBER_BODY_CHARS_REGEX = /^[\d.,\u0020\u00a0\u202f'\u2019]+$/;

/**
 * The most significant digits a value may carry and still be stored as a number without change.
 * A double holds 15 of them exactly, which is also the limit Excel applies; a longer value (a card
 * number, a long order ID) stays text instead of being rounded.
 */
const MAX_SIGNIFICANT_DIGITS = 15;

/**
 * The most fraction digits a numeric format asks for. `Intl.NumberFormat` throws above 100, and a
 * column of measured values never needs more than this.
 */
export const MAX_FRACTION_DIGITS = 20;

/**
 * A zero followed by another digit: a ZIP code or an ID such as `00123`, whose zeros a number
 * would drop.
 */
const LEADING_ZERO_REGEX = /^0\d/;

/**
 * A date in the ISO form: `2026-03-12`. It is what a value is read as when no listed format matches.
 * The groups follow `YEAR_FIRST_DATE_REGEX` (year, separator, month, day), so one reader takes both.
 */
const ISO_DATE_REGEX = /^(\d{4})(-)(\d{2})\2(\d{2})$/;

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
   * Whether the value was negative: a minus sign, or accounting parentheses.
   */
  negative: boolean;
  /**
   * The power of ten the value carried in exponent notation (`1.23E+15` is `15`), or `0`.
   */
  exponent: number;
  /**
   * The currency symbol the value carried, or `null`.
   */
  currencySymbol: string | null;
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
   * The column's currency symbol. A value with another symbol does not belong to the column.
   */
  currencySymbol: string | null;
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
 * A date format from the `dateFormats` option, compiled once into the regular expression that reads
 * it.
 */
export interface CompiledDateFormat {
  /**
   * The format as it was given (`DD/MM/YYYY`).
   */
  pattern: string;
  /**
   * Matches a whole trimmed value written in the format.
   */
  regex: RegExp;
  /**
   * The capture group of the year, the month, and the day.
   */
  groups: { year: number; month: number; day: number };
  /**
   * The digits a value has when the format is only fixed-width tokens (`DDMMYYYY` is `8`), or `null`
   * when it has a literal or a one-or-two-digit token. A whole number lost its leading zeros, so it
   * is padded back to this width before it is read.
   */
  width: number | null;
  /**
   * Whether a value in this format can also be read as a number: no literal, or a single `.` or `,`.
   * Only then does a column of such values tie with `numeric`.
   */
  numberLike: boolean;
}

/**
 * The words a checkbox column reads as `true` and as `false`, besides `true` and `false` themselves.
 */
export interface BooleanValues {
  /**
   * The words read as `true`.
   */
  true: string[];
  /**
   * The words read as `false`.
   */
  false: string[];
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
 * Removes an ISO 4217 code (`USD 12`, `12.00 USD`) from either end of a value. The code is its own
 * symbol, so `$` and `USD` are different symbols to the column even though they are one currency.
 */
function takeCurrencyCode(text: string): { currencySymbol: string; rest: string } | null {
  const head = text.slice(0, 3);
  const tail = text.slice(-3);

  // A space between the code and the digits: `PLN1` and `TOP10` are not amounts.
  if (text.length > 4 && /\s/.test(text[3]) && isCurrencyCode(head)) {
    return { currencySymbol: head, rest: text.slice(3).trim() };
  }

  if (text.length > 4 && /\s/.test(text[text.length - 4]) && isCurrencyCode(tail)) {
    return { currencySymbol: tail, rest: text.slice(0, -3).trim() };
  }

  return null;
}

/**
 * Splits an exponent off a number body (`1.23E+15` gives `1.23` and `15`). A body without a
 * well-formed exponent comes back whole, with `0`.
 */
function takeExponent(body: string): { body: string; exponent: number } {
  const index = body.search(/e/i);
  const tail = index > 0 ? body.slice(index + 1) : '';

  return /^[+-]?\d{1,3}$/.test(tail) ? { body: body.slice(0, index), exponent: Number(tail) } : { body, exponent: 0 };
}

/**
 * Removes a currency symbol from either end of a value and returns it, or `null` when there is none.
 */
function takeCurrency(text: string): { currencySymbol: string | null; rest: string } {
  const code = takeCurrencyCode(text);

  if (code) {
    return code;
  }

  for (const symbol of CURRENCY_SYMBOLS) {
    if (text.startsWith(symbol)) {
      return { currencySymbol: symbol, rest: text.slice(symbol.length).trim() };
    }

    if (text.endsWith(symbol)) {
      return { currencySymbol: symbol, rest: text.slice(0, -symbol.length).trim() };
    }
  }

  return { currencySymbol: null, rest: text };
}

/**
 * Splits a number-shaped string into its sign, currency symbol, percent sign, and body. Returns
 * `null` for anything that is not one. The body is checked against a separator grammar later, per
 * column.
 */
export function splitNumberParts(text: string): NumberParts | null {
  // `Intl` writes U+2212 MINUS SIGN for negative numbers under some locales (`sv-SE`, `fi-FI`).
  let rest = text.trim().replaceAll('\u2212', '-');
  const percent = rest.endsWith('%');

  if (percent) {
    rest = rest.slice(0, -1).trim();
  }

  // Accounting writes a negative amount in parentheses: `(1,234.00)`.
  const accounting = rest.startsWith('(') && rest.endsWith(')');

  if (accounting) {
    rest = rest.slice(1, -1).trim();
  }

  const signed = rest.startsWith('+') || rest.startsWith('-');
  let negative = accounting || (signed && rest[0] === '-');

  if (signed) {
    rest = rest.slice(1).trim();
  }

  const { currencySymbol, rest: afterCurrency } = takeCurrency(rest);
  let body = afterCurrency;
  let exponent = 0;

  // `$-3.25` carries its sign after the symbol; a value that already had a sign cannot have two.
  if (!signed && currencySymbol !== null && body.startsWith('-')) {
    negative = true;
    body = body.slice(1).trim();
  }

  ({ body, exponent } = takeExponent(body));

  // A `+` in front of digits grouped by spaces is a phone number (`+48 601 234 567`), not a quantity.
  // A decimal part (`+1 234,5`) says it is a quantity.
  if (signed && !negative && /\s/.test(body) && !/[.,]/.test(body)) {
    return null;
  }

  // Nine digits or more grouped by plain spaces, with no currency and no percent sign, read as a phone
  // number (`601 234 567`). A currency (`1 234 567 890 \u20ac`) or a no-break space (what `Intl` writes
  // for fr-FR and pl-PL) says it is a quantity.
  const phoneLike = PLAIN_SPACE_GROUPED_REGEX.test(body) && body.replaceAll(' ', '').length >= 9;

  if (currencySymbol === null && !percent && phoneLike) {
    return null;
  }

  return NUMBER_BODY_CHARS_REGEX.test(body) ? { body, negative, exponent, currencySymbol, percent } : null;
}

/**
 * Counts the significant digits of a number body: every digit after the leading zeros, without the
 * trailing zeros of the fraction, which change nothing in the stored number.
 */
function countSignificantDigits(body: string, decimalSeparator: '.' | ','): number {
  const separator = body.indexOf(decimalSeparator);
  const integerPart = separator === -1 ? body : body.slice(0, separator);
  let fraction = separator === -1 ? '' : body.slice(separator + 1);

  // A loop, not `replace(/0+$/, '')`: that pattern backtracks quadratically on a long run of zeros.
  let end = fraction.length;

  while (end > 0 && fraction[end - 1] === '0') {
    end -= 1;
  }

  fraction = fraction.slice(0, end);

  return `${integerPart.replace(/\D/g, '')}${fraction}`.replace(/^0+/, '').length;
}

/**
 * Whether a number body is an integer part that starts with a zero followed by another digit
 * (`00123`, `02134`), which marks a code such as a ZIP or an ID rather than a quantity.
 */
export function hasLeadingZero(body: string): boolean {
  return LEADING_ZERO_REGEX.test(body);
}

/**
 * Whether a number body is valid under the given decimal separator. A leading zero followed by a
 * digit is rejected under both, since it marks a code rather than a quantity, and so is a value
 * with more significant digits than a number holds.
 */
export function isNumberBody(body: string, decimalSeparator: '.' | ','): boolean {
  if (hasLeadingZero(body) || countSignificantDigits(body, decimalSeparator) > MAX_SIGNIFICANT_DIGITS) {
    return false;
  }

  return decimalSeparator === '.'
    ? DOT_PLAIN_REGEX.test(body) || DOT_GROUPED_REGEX.test(body)
    : COMMA_PLAIN_REGEX.test(body) || COMMA_GROUPED_REGEX.test(body);
}

/**
 * Whether a number body is grouped: it holds a character other than a digit and the decimal
 * separator.
 */
export function isGroupedBody(body: string, decimalSeparator: '.' | ','): boolean {
  for (let index = 0; index < body.length; index++) {
    const code = body.charCodeAt(index);

    if ((code < 48 || code > 57) && body[index] !== decimalSeparator) {
      return true;
    }
  }

  return false;
}

/**
 * Counts the digits after the decimal separator.
 */
export function countFractionDigits(body: string, decimalSeparator: '.' | ','): number {
  const index = body.indexOf(decimalSeparator);

  return index === -1 ? 0 : body.length - index - 1;
}

/**
 * Counts the fraction digits of a number as it prints at 15 significant digits, which drops the
 * noise of binary arithmetic (`0.30000000000000004` counts 1). A number printed in exponent form
 * counts the digits it has after the decimal point once written out (`1.5e-7` counts 8).
 */
export function countNumberFractionDigits(value: number): number {
  const printed = String(Number(value.toPrecision(MAX_SIGNIFICANT_DIGITS)));
  const match = /^-?\d+(?:\.(\d+))?(?:e([+-]\d+))?$/i.exec(printed);

  return match ? Math.max(0, (match[1]?.length ?? 0) - Number(match[2] ?? 0)) : 0;
}

/**
 * Reads a value as a number under the column's mode, or returns `null` when it does not belong to
 * the column. A percentage is divided by 100 by moving the exponent, which keeps `7.25%` exactly
 * `0.0725` instead of the nearest result of a floating-point division.
 */
export function readNumber(value: unknown, mode: NumberMode): number | null {
  return readSplitNumber(value, typeof value === 'string' ? splitNumberParts(value) : null, mode);
}

/**
 * `readNumber()` for a value whose string form was already split, so a detector that reads every
 * value several ways splits each one once.
 */
export function readSplitNumber(value: unknown, parts: NumberParts | null, mode: NumberMode): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && !mode.percent ? value : null;
  }

  if (parts === null) {
    return null;
  }

  const otherCurrency = parts.currencySymbol !== null && parts.currencySymbol !== mode.currencySymbol;

  if (parts.percent !== mode.percent || otherCurrency || !isNumberBody(parts.body, mode.decimalSeparator)) {
    return null;
  }

  // A loop and not a spread: this runs per cell, and an array per cell shows in a profile.
  let plain = '';

  for (let index = 0; index < parts.body.length; index++) {
    const char = parts.body[index];
    const code = parts.body.charCodeAt(index);

    if (code >= 48 && code <= 57) {
      plain += char;

    } else if (char === mode.decimalSeparator) {
      plain += '.';
    }
  }

  const exponent = parts.exponent - (mode.percent ? 2 : 0);
  const number = Number(`${parts.negative ? '-' : ''}${plain}${exponent === 0 ? '' : `e${exponent}`}`);

  // `1.5E-400` underflows to zero. A nonzero value that reads as zero is data loss, so it is unread.
  const underflowed = number === 0 && /[1-9]/.test(plain);

  return Number.isFinite(number) && !underflowed ? number : null;
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
 * Builds a boolean reader that also reads the given words, compared trimmed and in any case. A word
 * listed on both sides, `true` and `false` included, reads as neither.
 */
export function createBooleanReader(words: BooleanValues): (value: unknown) => boolean | null {
  const lookup = new Map<string, boolean>([['true', true], ['false', false]]);
  const conflicts = new Set<string>();
  const add = (word: string, meaning: boolean) => {
    const key = word.trim().toLowerCase();

    if (lookup.has(key) && lookup.get(key) !== meaning) {
      conflicts.add(key);
    }

    lookup.set(key, meaning);
  };

  words.true.forEach(word => add(word, true));
  words.false.forEach(word => add(word, false));
  conflicts.forEach(key => lookup.delete(key));

  return (value) => {
    if (typeof value === 'boolean') {
      return value;
    }

    // A listed `1` or `0` reads a number cell too: API data often carries them as numbers.
    const text = typeof value === 'number' && Number.isFinite(value) ? String(value) : value;

    return typeof text === 'string' ? lookup.get(text.trim().toLowerCase()) ?? null : null;
  };
}

/**
 * Builds an ISO date from its parts, or returns `null` for a date the calendar does not have.
 */
function toIsoDate(year: string, month: string, day: string): string | null {
  const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

  return isValidISODate(iso) ? iso : null;
}

/**
 * Splits a year-last date into its first part, its second part, and its separator, or returns `null`
 * for another shape.
 */
export function splitYearLastDate(value: unknown): [number, number, string] | null {
  const match = typeof value === 'string' ? YEAR_LAST_DATE_REGEX.exec(value.trim()) : null;

  return match ? [Number(match[1]), Number(match[3]), match[2]] : null;
}

/**
 * The tokens a date format may hold, the part of the date each one names, and what it matches.
 */
const DATE_FORMAT_TOKENS: Record<string, { field: 'year' | 'month' | 'day'; source: string }> = {
  YYYY: { field: 'year', source: '(\\d{4})' },
  MM: { field: 'month', source: '(\\d{2})' },
  M: { field: 'month', source: '(\\d{1,2})' },
  DD: { field: 'day', source: '(\\d{2})' },
  D: { field: 'day', source: '(\\d{1,2})' },
};

/**
 * Splits a date format into runs of one repeated letter (`YYYY`, `MM`) and runs of anything else.
 */
const DATE_FORMAT_PART_REGEX = /([A-Za-z])\1*|[^A-Za-z]+/g;

/**
 * Compiles a date format such as `DD/MM/YYYY` or `YYYYMMDD`. The tokens are `YYYY`, `MM` and `DD`
 * (two digits), and `M` and `D` (one or two); every other character is matched as it is. Returns
 * `null` for a format that does not hold exactly one year, one month and one day token, or that
 * holds another letter.
 */
export function compileDateFormat(pattern: unknown): CompiledDateFormat | null {
  if (typeof pattern !== 'string') {
    return null;
  }

  const groups: Partial<CompiledDateFormat['groups']> = {};
  let source = '';
  let group = 0;
  let previous = '';
  let literals = '';
  let width: number | null = 0;

  // Values are read trimmed, so a format is too: `'DD/MM/YYYY '` would otherwise never match.
  for (const [part] of pattern.trim().matchAll(DATE_FORMAT_PART_REGEX)) {
    const isLetters = /^[A-Za-z]/.test(part);
    const token = isLetters ? DATE_FORMAT_TOKENS[part] : undefined;
    // `YYYYMD` cannot tell `2026111` as 1 November from 11 January, so a one-or-two-digit token
    // needs a literal on the side where it meets another token.
    const ambiguous = token !== undefined && previous in DATE_FORMAT_TOKENS
      && (part.length === 1 || previous.length === 1);

    if (isLetters && (token === undefined || groups[token.field] !== undefined || ambiguous)) {
      return null;
    }

    previous = part;

    if (token) {
      group += 1;
      groups[token.field] = group;
      source += token.source;
      width = width !== null && part.length > 1 ? width + part.length : null;

    } else {
      literals += part;
      source += part.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
    }
  }

  const { year, month, day } = groups;

  if (year === undefined || month === undefined || day === undefined) {
    return null;
  }

  return {
    pattern,
    regex: new RegExp(`^${source}$`),
    groups: { year, month, day },
    width: literals === '' ? width : null,
    numberLike: literals === '' || literals === '.' || literals === ',',
  };
}

/**
 * Splits a trimmed value into its date parts. With a listed format, the value is read with it, and
 * otherwise only as an ISO date (`2026-03-12`): the looser year-first form takes `/` and `.` too, and
 * would read `2026/12/3` as December in a column of `YYYY/DD/MM`. Without a format, a year-first date
 * is read as year, month, day, and a year-last one in `order`.
 */
function splitDate(
  text: string,
  order: 'DMY' | 'MDY',
  format: CompiledDateFormat | null
): { year: string; month: string; day: string } | null {
  const match = format ? format.regex.exec(text) : null;

  if (format && match) {
    return { year: match[format.groups.year], month: match[format.groups.month], day: match[format.groups.day] };
  }

  const yearFirst = (format ? ISO_DATE_REGEX : YEAR_FIRST_DATE_REGEX).exec(text);

  if (yearFirst) {
    return { year: yearFirst[1], month: yearFirst[3], day: yearFirst[4] };
  }

  const yearLast = format ? null : YEAR_LAST_DATE_REGEX.exec(text);

  if (!yearLast) {
    return null;
  }

  const [first, second] = [yearLast[1], yearLast[3]];

  return order === 'MDY'
    ? { year: yearLast[4], month: first, day: second }
    : { year: yearLast[4], month: second, day: first };
}

/**
 * Writes a whole number as the digits a format reads. The leading zeros a number lost come back for a
 * fixed-width format, so `1032026` is `01032026` for `DDMMYYYY`.
 */
function toDigits(value: number, format: CompiledDateFormat): string {
  return value < 0 ? String(value) : String(value).padStart(format.width ?? 0, '0');
}

/**
 * Reads a value as a date. With `format`, a value the format matches is read with it, and any other
 * value only as a year-first date. Without one, a year-first date is read as year, month, day, and a
 * year-last one follows `order`. A whole number is read only with a format (`20260312` with
 * `YYYYMMDD`). Returns `null` for anything else, including a day the month does not have.
 */
export function readDate(
  value: unknown,
  order: 'DMY' | 'MDY',
  format: CompiledDateFormat | null = null
): DateReading | null {
  const text = format && Number.isInteger(value) ? toDigits(value as number, format) : value;

  if (typeof text !== 'string') {
    return null;
  }

  const parts = splitDate(text.trim(), order, format);
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
