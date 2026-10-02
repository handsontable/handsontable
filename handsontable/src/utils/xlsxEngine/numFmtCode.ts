/**
 * Reading an Excel number-format code: what is decoration, what currency it carries, and whether it
 * formats a date or a time. Shared by the import's type inference (`plugins/importFile/inference.ts`)
 * and by the native reader's `date1904` shift, which must agree on which formats are temporal - a
 * serial the reader shifts by 1462 days and the import then types as a number shows the shift.
 *
 * This file must stay 7-bit ASCII (see `AGENTS.md`): every non-ASCII currency symbol is written as a
 * `\u` escape.
 */

/**
 * The longest number format code Excel accepts. Anything longer did not come from Excel, and is
 * neither parsed nor classified.
 */
export const MAX_NUMBER_FORMAT_LENGTH = 255;

/**
 * Currency symbols the export can write, mapped back to their ISO 4217 codes.
 */
const CURRENCY_SYMBOL_TO_CODE: Record<string, string> = {
  $: 'USD',
  '\u20AC': 'EUR',
  '\u00A3': 'GBP',
  '\u00A5': 'JPY',
  // eslint-disable-next-line quote-props
  'z\u0142': 'PLN',
  '\u20B9': 'INR',
  '\u20A9': 'KRW',
  CHF: 'CHF',
  kr: 'SEK',
  R$: 'BRL',
};

/**
 * `CURRENCY_SYMBOL_TO_CODE`'s symbols, longest first, so a multi-character symbol wins over a
 * single-character one that is its suffix (`R$` never reads as `$`).
 */
const CURRENCY_SYMBOLS = Object.keys(CURRENCY_SYMBOL_TO_CODE).sort((a, b) => b.length - a.length);

/**
 * Maps a currency symbol read from a number format to its ISO 4217 code, or `null` for a symbol the
 * table does not own. The symbol comes from the file, so the lookup is an own-property check: a
 * plain index resolved `[$constructor-409]` through `Object.prototype` to the `Object` function,
 * which reached `Intl.NumberFormat` as the currency and made every later render throw.
 *
 * @param {string} symbol The symbol as written in the format code.
 * @returns {string|null}
 */
function currencyForSymbol(symbol: string): string | null {
  return Object.hasOwn(CURRENCY_SYMBOL_TO_CODE, symbol) ? CURRENCY_SYMBOL_TO_CODE[symbol] : null;
}

/**
 * Matches Excel's locale-tagged currency token, `[$<symbol>-<LCID>]` or `[$<symbol>]`. Neither body
 * may contain a `[`: the format is file data, and a body that could run past the next `[` made every
 * `[$` in `[$[$[$...` rescan the rest of the string, which is quadratic (a 100 000-character format
 * hung the tab for seconds).
 */
const CURRENCY_TOKEN_REGEX = /\[\$([^[\]-]*)(?:-[^[\]]*)?\]/;

/**
 * The dollar-sign composites `Intl.NumberFormat` writes under `en-US` for currencies whose symbol
 * is a dollar but not THE dollar, mapped to their ISO 4217 codes. `intlNumFormatToExcelNumFmt`
 * emits them bare (`HK$#,##0`), the same way it emits a bare ISO code for a currency with no
 * symbol at all (`CHF#,##0`, `SEK#,##0`).
 */
const DOLLAR_COMPOSITE_TO_CODE: Record<string, string> = {
  A$: 'AUD',
  CA$: 'CAD',
  HK$: 'HKD',
  MX$: 'MXN',
  NT$: 'TWD',
  NZ$: 'NZD',
  US$: 'USD',
};

/**
 * A bare currency marker at either end of a number format: a three-letter ISO code (`CHF`, `SEK`)
 * or a dollar composite (`HK$`, `US$`), separated from the digits by an optional space. The
 * alternation is anchored to the pattern's number part (`#` or `0`) on the inner side so a format
 * code that happens to be uppercase, such as `YYYY-MM-DD`, is never read as a currency.
 */
const BARE_CURRENCY_REGEX = /^([A-Z]{1,3}\$|[A-Z]{3}) ?(?=[#0])|(?<=[#0%]) ?([A-Z]{1,3}\$|[A-Z]{3})$/;

/**
 * Maps a bare currency marker to its ISO code: a three-letter code is its own code, a dollar
 * composite is looked up, anything else is unknown.
 *
 * @param {string} marker The marker as written in the format code.
 * @returns {string|null}
 */
function bareMarkerToCode(marker: string): string | null {
  if (marker.endsWith('$')) {
    return Object.hasOwn(DOLLAR_COMPOSITE_TO_CODE, marker) ? DOLLAR_COMPOSITE_TO_CODE[marker] : null;
  }

  return marker;
}

/**
 * What a number format's currency capture produced: the ISO 4217 code when a known symbol was
 * found, and the pattern with that symbol removed.
 */
export interface CurrencyCapture {
  /**
   * The ISO 4217 code the captured symbol maps to, or `null` when the pattern carries no currency.
   */
  currency: string | null;
  /**
   * The number format with the currency token removed.
   */
  rest: string;
}

/**
 * Captures a currency symbol written as a quoted literal at either end of a trimmed pattern
 * (`"$"#,##0.00`, which is what Excel's en-US Currency style writes, or `#,##0.00" kr"`). Only a
 * symbol the table owns counts: any other quoted text is a label, and stays in the pattern.
 * Located with `indexOf`/`lastIndexOf`, so no regex walks the file's text here.
 *
 * @param {string} trimmed The trimmed number format.
 * @returns {CurrencyCapture|null}
 */
function captureQuotedCurrency(trimmed: string): CurrencyCapture | null {
  if (trimmed.startsWith('"')) {
    const close = trimmed.indexOf('"', 1);
    const currency = close === -1 ? null : currencyForSymbol(trimmed.slice(1, close).trim());

    if (currency !== null) {
      return { currency, rest: trimmed.slice(close + 1) };
    }
  }

  if (trimmed.length > 1 && trimmed.endsWith('"')) {
    const open = trimmed.lastIndexOf('"', trimmed.length - 2);
    const currency = open === -1 ? null : currencyForSymbol(trimmed.slice(open + 1, -1).trim());

    if (currency !== null) {
      return { currency, rest: trimmed.slice(0, open) };
    }
  }

  return null;
}

/**
 * Captures the currency a number format carries: Excel's `[$<symbol>-<LCID>]` / `[$<symbol>]` token
 * first, then a quoted symbol at either end, then a leading or trailing symbol the way
 * `intlNumFormatToExcelNumFmt` writes it, then a bare ISO code or dollar composite (`CHF#,##0`,
 * `HK$#,##0`) the same function writes for a currency with no single-character symbol.
 *
 * The quoted form has to be read here, before `stripFormatDecorations` runs: that strip deletes
 * every quoted literal, so `"$"#,##0.00` used to lose its symbol and render as a plain number.
 *
 * @param {string} numFmt The number format code.
 * @returns {CurrencyCapture}
 */
export function captureCurrency(numFmt: string): CurrencyCapture {
  const token = numFmt.match(CURRENCY_TOKEN_REGEX);

  if (token) {
    return {
      currency: currencyForSymbol(token[1].trim()),
      rest: numFmt.replace(CURRENCY_TOKEN_REGEX, ''),
    };
  }

  const trimmed = numFmt.trim();
  const quoted = captureQuotedCurrency(trimmed);

  if (quoted) {
    return quoted;
  }

  for (const symbol of CURRENCY_SYMBOLS) {
    if (trimmed.startsWith(symbol)) {
      return { currency: currencyForSymbol(symbol), rest: trimmed.slice(symbol.length) };
    }

    if (trimmed.endsWith(symbol)) {
      return { currency: currencyForSymbol(symbol), rest: trimmed.slice(0, -symbol.length) };
    }
  }

  const bare = trimmed.match(BARE_CURRENCY_REGEX);

  if (bare) {
    return { currency: bareMarkerToCode(bare[1] ?? bare[2]), rest: trimmed.replace(BARE_CURRENCY_REGEX, '') };
  }

  return { currency: null, rest: numFmt };
}

/**
 * An elapsed-time section: `[h]`, `[hh]`, `[m]`, `[mm]`, `[s]`, `[ss]`. It formats a duration, so it
 * is a time code whatever the rest of the pattern reads like. Each attempt starts at a `[` and stops
 * at the end of one run of a single letter, so the match is linear in the format's length.
 */
const ELAPSED_SECTION_REGEX = /\[(?:h+|m+|s+)\]/i;

/**
 * Every bracket section (`[$-409]`, `[Red]`, `[h]`). The body excludes `[`, for the same reason
 * `CURRENCY_TOKEN_REGEX` does: `\[[^\]]*\]` is quadratic on a run of `[`.
 */
const BRACKET_SECTION_REGEX = /\[[^[\]]*\]/g;

/**
 * Every bracket section except an elapsed-time one. The lookahead reads one run of a single letter
 * from the `[` it starts at, so it adds no rescan: each attempt still stops at the next `[` or `]`.
 */
const NON_ELAPSED_BRACKET_SECTION_REGEX = /\[(?!(?:h+|m+|s+)\])[^[\]]*\]/gi;

/**
 * Options of `stripFormatDecorations`.
 */
export interface StripFormatDecorationsOptions {
  /**
   * Keep an elapsed-time section (`[h]`, `[mm]`, `[ss]`) in place, so a tokenizer can still see
   * which component it stands for. Every other bracket section is dropped either way.
   */
  keepElapsed?: boolean;
}

/**
 * Strips bracketed sections (`[$-409]`, `[Red]`, `[h]`), quoted literals (`"days"`) and
 * backslash-escaped characters (`\h`, `\%`) from a number format, so a classifier sees only format
 * codes. Run `captureCurrency` first when the currency matters: a quoted or bracketed symbol is
 * decoration here.
 *
 * @param {string} numFmt The number format code.
 * @param {StripFormatDecorationsOptions} [options] Whether to keep elapsed-time sections.
 * @returns {string}
 */
export function stripFormatDecorations(numFmt: string, options: StripFormatDecorationsOptions = {}): string {
  const brackets = options.keepElapsed === true ? NON_ELAPSED_BRACKET_SECTION_REGEX : BRACKET_SECTION_REGEX;

  return numFmt.replace(brackets, '').replace(/"[^"]*"/g, '').replace(/\\./g, '');
}

/**
 * Detects a date-shaped format code: `y`, `d` or a month name (`mmm`) anywhere, or a bare `m`
 * (ambiguous between "month" and "minute") when the format carries no `h` or `s` to disambiguate it
 * as a time - Excel's own rule for a lone `m`/`mm` token.
 *
 * @param {string} bare The decoration-stripped, lower-cased format.
 * @returns {boolean}
 */
function hasDateCode(bare: string): boolean {
  return /y|d|mmm/.test(bare) || (/m/.test(bare) && !/h|s/.test(bare));
}

/**
 * Detects a time-shaped format code: `h`, `s` or `AM/PM` anywhere, or a bare `m` read as "minute"
 * because the format also carries an `h` or `s`.
 *
 * @param {string} bare The decoration-stripped, lower-cased format.
 * @returns {boolean}
 */
function hasTimeCode(bare: string): boolean {
  return /h|s|am\/pm/.test(bare) || (/m/.test(bare) && /h|s/.test(bare));
}

/**
 * What a temporal number format formats.
 */
export type TemporalFormatKind = 'date' | 'time' | 'datetime';

/**
 * Detects a date-only, time-only or date-time number format, or answers `null` for any other.
 *
 * Three rules, in order. A format longer than `MAX_NUMBER_FORMAT_LENGTH` is not classified at all.
 * An elapsed-time section (`[h]:mm`, `[mm]:ss`, `[s]`) is a time: stripped first, `[h]:mm` left
 * `:mm`, a bare month, so Excel's standard duration format typed a timesheet column as 1899 dates.
 * And the currency comes off before the date and time codes are read: `CHF`, `SEK` and `HK$` carry
 * an `h` or an `s` that would otherwise turn a money column into `12:00:00`s.
 *
 * @param {string} numFmt The number format code.
 * @returns {TemporalFormatKind|null}
 */
export function classifyTemporalFormat(numFmt: string): TemporalFormatKind | null {
  if (numFmt.length > MAX_NUMBER_FORMAT_LENGTH) {
    return null;
  }

  if (ELAPSED_SECTION_REGEX.test(numFmt)) {
    return 'time';
  }

  const bare = stripFormatDecorations(captureCurrency(numFmt).rest).toLowerCase();
  const hasDate = hasDateCode(bare);
  const hasTime = hasTimeCode(bare);

  if (hasDate && hasTime) {
    return 'datetime';
  }

  if (hasDate) {
    return 'date';
  }

  return hasTime ? 'time' : null;
}

/**
 * Whether a cell's number format formats a date or a time - the test the native reader's
 * `date1904` shift asks, answered exactly as the import's type inference answers it, so a serial is
 * shifted only when the import will show it as a date or a time.
 *
 * @param {string|null} numFmt The number format code, or `null` for a cell without one.
 * @returns {boolean}
 */
export function isTemporalFormatCode(numFmt: string | null): boolean {
  return numFmt !== null && classifyTemporalFormat(numFmt) !== null;
}
