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
  // eslint-disable-next-line quote-props
  'kr.': 'DKK',
  R$: 'BRL',
  // eslint-disable-next-line quote-props
  'K\u010D': 'CZK',
  Ft: 'HUF',
  '\u20BD': 'RUB',
  '\u20BA': 'TRY',
  '\uFFE5': 'JPY',
};

/**
 * Symbols several currencies share, mapped to the LCIDs (Windows locale IDs) that tell them apart in
 * Excel's locale token `[$<symbol>-<LCID>]`. `intlNumFormatToExcelNumFmt` writes the token with the
 * currency's home LCID for exactly these symbols, so `kr` comes back as the krone it was and not as
 * the first krone the symbol table names. Keyed by symbol so an LCID never reassigns another symbol
 * (`[$$-414]` stays the dollar). The writer reads the LCID back out with `currencyLcid`.
 */
const SHARED_SYMBOL_LCID_TO_CODE: Record<string, Record<number, string>> = {
  kr: { 0x414: 'NOK', 0x814: 'NOK', 0x41D: 'SEK', 0x81D: 'SEK', 0x406: 'DKK', 0x40F: 'ISK' },
  // eslint-disable-next-line quote-props
  'kr.': { 0x414: 'NOK', 0x814: 'NOK', 0x41D: 'SEK', 0x81D: 'SEK', 0x406: 'DKK', 0x40F: 'ISK' },
  '\u00A5': { 0x411: 'JPY', 0x804: 'CNY' },
};

/**
 * The home LCID of each currency whose symbol another currency shares, the inverse of
 * `SHARED_SYMBOL_LCID_TO_CODE`.
 */
const SHARED_SYMBOL_CURRENCY_LCID: Record<string, number> = {
  NOK: 0x414,
  SEK: 0x41D,
  DKK: 0x406,
  ISK: 0x40F,
  JPY: 0x411,
  CNY: 0x804,
};

/**
 * The LCID `intlNumFormatToExcelNumFmt` writes into a locale token for a symbol several currencies
 * share (`kr`, `kr.`, the yen sign), or `null` when the symbol belongs to one currency only and can
 * be written as it is. Both lookups are own-property checks: the currency code comes from the
 * column's settings.
 *
 * @param {string} symbol The symbol `Intl.NumberFormat` renders for the currency.
 * @param {string} currency The ISO 4217 code.
 * @returns {number|null}
 */
export function sharedSymbolLcid(symbol: string, currency: string): number | null {
  if (!Object.hasOwn(SHARED_SYMBOL_LCID_TO_CODE, symbol) || !Object.hasOwn(SHARED_SYMBOL_CURRENCY_LCID, currency)) {
    return null;
  }

  const lcid = SHARED_SYMBOL_CURRENCY_LCID[currency];

  return SHARED_SYMBOL_LCID_TO_CODE[symbol][lcid] === currency ? lcid : null;
}

/**
 * Maps the symbol and LCID of a locale token to an ISO 4217 code: by the LCID for a symbol several
 * currencies share, by the symbol table for every other symbol and for an LCID the table does not
 * hold.
 *
 * @param {string} symbol The token's symbol, trimmed.
 * @param {string|undefined} lcid The token's LCID as hex text (`414`, `0414`), if any.
 * @returns {string|null}
 */
function currencyForToken(symbol: string, lcid: string | undefined): string | null {
  if (lcid !== undefined && /^[0-9a-f]{1,8}$/i.test(lcid) && Object.hasOwn(SHARED_SYMBOL_LCID_TO_CODE, symbol)) {
    const byLcid = SHARED_SYMBOL_LCID_TO_CODE[symbol];
    const id = Number.parseInt(lcid, 16);

    if (Object.hasOwn(byLcid, id)) {
      return byLcid[id];
    }
  }

  return currencyForSymbol(symbol);
}

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
const CURRENCY_TOKEN_REGEX = /\[\$([^[\]-]*)(?:-([^[\]]*))?\]/;

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
 * A whole bare currency marker: a three-letter ISO code or a dollar composite, nothing else.
 */
const BARE_MARKER_REGEX = /^(?:[A-Z]{1,3}\$|[A-Z]{3})$/;

/**
 * Maps a currency symbol that sits next to the number part (quoted, or escaped one character at a
 * time) to its ISO code: a symbol the table owns, or a bare ISO code or dollar composite - the form
 * `intlNumFormatToExcelNumFmt` quotes for a currency with no single-character symbol.
 *
 * @param {string} symbol The symbol, unquoted or unescaped and trimmed.
 * @returns {string|null}
 */
function adjacentSymbolToCode(symbol: string): string | null {
  return currencyForSymbol(symbol) ?? (BARE_MARKER_REGEX.test(symbol) ? bareMarkerToCode(symbol) : null);
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
 * Reads the text of a quoted literal or an escaped run as a currency. A symbol the table owns
 * counts wherever it sits; a bare ISO code or dollar composite counts only next to the number part
 * (`next` is the first character on the number's side, past one optional space), so a quoted
 * label such as `"USD" @` stays a label.
 *
 * @param {string} text The unquoted or unescaped text.
 * @param {string} next The pattern on the number's side of the text.
 * @param {boolean} leading Whether the text opens the pattern.
 * @returns {string|null}
 */
function symbolTextToCode(text: string, next: string, leading: boolean): string | null {
  const symbol = text.trim();
  const owned = currencyForSymbol(symbol);

  if (owned !== null) {
    return owned;
  }

  const neighbor = leading ? next.trimStart().charAt(0) : next.trimEnd().slice(-1);
  const isNextToNumber = leading ? /[#0?]/.test(neighbor) : /[#0?%]/.test(neighbor);

  return isNextToNumber && neighbor !== '' ? adjacentSymbolToCode(symbol) : null;
}

/**
 * Captures a currency symbol written as a quoted literal at either end of a trimmed pattern
 * (`"$"#,##0.00`, which is what Excel's en-US Currency style writes, `#,##0.00" kr"`, or the
 * export's own `#,##0.00"USD"` and `"HK$"#,##0`). A symbol the table owns counts, and so does a
 * three-letter ISO code or a dollar composite next to the number part: any other quoted text is a
 * label, and stays in the pattern. Located with `indexOf`/`lastIndexOf`, so no regex walks the
 * file's text here.
 *
 * @param {string} trimmed The trimmed number format.
 * @returns {CurrencyCapture|null}
 */
function captureQuotedCurrency(trimmed: string): CurrencyCapture | null {
  if (trimmed.startsWith('"')) {
    const close = trimmed.indexOf('"', 1);
    const rest = close === -1 ? '' : trimmed.slice(close + 1);
    const currency = close === -1 ? null : symbolTextToCode(trimmed.slice(1, close), rest, true);

    if (currency !== null) {
      return { currency, rest };
    }
  }

  if (trimmed.length > 1 && trimmed.endsWith('"')) {
    const open = trimmed.lastIndexOf('"', trimmed.length - 2);
    const rest = open === -1 ? '' : trimmed.slice(0, open);
    const currency = open === -1 ? null : symbolTextToCode(trimmed.slice(open + 1, -1), rest, false);

    if (currency !== null) {
      return { currency, rest };
    }
  }

  return null;
}

/**
 * Captures a currency symbol escaped one character at a time at either end of a trimmed pattern.
 * Excel saves an unquoted multi-letter symbol that way (`#,##0.00zl` with a stroked l comes back as
 * `#,##0.00\z\l`, `CHF#,##0.00` as `\C\H\F#,##0.00`), and only a whole-symbol escape (`\$`) was
 * read. The run is unescaped and read like a quoted symbol; a run that is not a currency stays in
 * the pattern, so `0.0\%` keeps its literal percent sign. Walked by index, two characters at a
 * time, so the scan is linear.
 *
 * @param {string} trimmed The trimmed number format.
 * @returns {CurrencyCapture|null}
 */
function captureEscapedCurrency(trimmed: string): CurrencyCapture | null {
  let end = 0;

  while (trimmed[end] === '\\' && end + 1 < trimmed.length) {
    end += 2;
  }

  if (end > 0) {
    const currency = symbolTextToCode(trimmed.slice(0, end).replace(/\\(.)/gs, '$1'), trimmed.slice(end), true);

    if (currency !== null) {
      return { currency, rest: trimmed.slice(end) };
    }
  }

  let start = trimmed.length;

  while (start >= 2 && trimmed[start - 2] === '\\') {
    start -= 2;
  }

  if (start < trimmed.length) {
    const currency = symbolTextToCode(trimmed.slice(start).replace(/\\(.)/gs, '$1'), trimmed.slice(0, start), false);

    if (currency !== null) {
      return { currency, rest: trimmed.slice(0, start) };
    }
  }

  return null;
}

/**
 * Splits a number format into its `;`-separated sections, at most `limit` of them, with the
 * layout-only codes removed: the `_x` padding (a space the width of `x`) and the `*x` fill (`x`
 * repeated to the cell's width) are not format codes, and `Intl.NumberFormat` has no equivalent of
 * either. Quoted literals and backslash escapes are kept as they are - a `;` or a `_` inside one is
 * text.
 *
 * Linear in the length of the code: one pass, no backtracking.
 *
 * @param {string} numFmt The number format code.
 * @param {number} limit The most sections to read.
 * @returns {string[]}
 */
function splitFormatSections(numFmt: string, limit: number): string[] {
  const sections: string[] = [];
  let section = '';

  for (let i = 0; i < numFmt.length; i++) {
    const char = numFmt[i];

    if (char === ';') {
      sections.push(section);
      section = '';

      if (sections.length === limit) {
        return sections;
      }
    } else if (char === '"') {
      const close = numFmt.indexOf('"', i + 1);
      const end = close === -1 ? numFmt.length : close + 1;

      section += numFmt.slice(i, end);
      i = end - 1;
    } else if (char === '\\') {
      section += numFmt.slice(i, i + 2);
      i += 1;
    } else if (char === '_' || char === '*') {
      i += 1;
    } else {
      section += char;
    }
  }

  sections.push(section);

  return sections;
}

/**
 * The first (positive) section of a number format, with its layout-only codes removed (see
 * `splitFormatSections`). A multi-section code (`#,##0;[Red]-#,##0`, Excel's built-in currency and
 * accounting formats) used to reach the plain-number check whole, so every such column imported
 * unformatted. The result still goes through `captureCurrency` and `stripFormatDecorations` like
 * any other code. A section's own color (`[Red]`) is a bracket section those already remove; a
 * code whose sections carry a condition is answered by `hasConditionalSection` first.
 *
 * @param {string} numFmt The number format code.
 * @returns {string}
 */
export function positiveFormatSection(numFmt: string): string {
  return splitFormatSections(numFmt, 1)[0];
}

/**
 * A section that opens with a condition (`[>=100]`, `[<1]`, `[=0]`), possibly after a color.
 * The color body excludes `<`, `>` and `=` as well as the brackets, so each attempt reads one way
 * and stops: no rescan.
 */
const CONDITIONAL_SECTION_REGEX = /^\s*(?:\[[^[\]<>=]*\])*\[[<>=]/;

/**
 * Whether a multi-section number format splits its values by a condition
 * (`[>=1000000]0.0,,"M";[>=1000]0.0,"K";0`). Its first section then applies only to the values its
 * condition holds for, so it cannot stand for the whole code. A single-section code with a
 * condition (`[Red][<100]0.0`) applies to every value either way and does not count.
 *
 * @param {string} numFmt The number format code.
 * @returns {boolean}
 */
export function hasConditionalSection(numFmt: string): boolean {
  const sections = splitFormatSections(numFmt, 4);

  return sections.length > 1 && sections.some(section => CONDITIONAL_SECTION_REGEX.test(section));
}

/**
 * Every bracket section except a currency token (`[Red]`, `[>=100]`, but not `[$\u20AC-407]`).
 */
const NON_CURRENCY_BRACKET_SECTION_REGEX = /\[(?!\$)[^[\]]*\]/g;

/**
 * Whether the grid shows a code's negative values the way its second section asks. `Intl` writes a
 * negative number as its positive form behind a minus sign, so only a second section that is the
 * first one with a leading `-` (or LibreOffice's `\-`), give or take a color, reads the same. A
 * parenthesized `(#,##0)`, or a section without the minus, shows differently, and the caller
 * reports the code. A code with one section has nothing to differ.
 *
 * @param {string} numFmt The number format code.
 * @returns {boolean}
 */
export function isNegativeSectionShowable(numFmt: string): boolean {
  const sections = splitFormatSections(numFmt, 2);

  if (sections.length < 2) {
    return true;
  }

  const [positive, negative] = sections.map(section => section.replace(NON_CURRENCY_BRACKET_SECTION_REGEX, '').trim());

  return negative === `-${positive}` || negative === `\\-${positive}`;
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
      currency: currencyForToken(token[1].trim(), token[2]),
      rest: numFmt.replace(CURRENCY_TOKEN_REGEX, ''),
    };
  }

  const trimmed = numFmt.trim();
  const quoted = captureQuotedCurrency(trimmed) ?? captureEscapedCurrency(trimmed);

  if (quoted) {
    return quoted;
  }

  for (const symbol of CURRENCY_SYMBOLS) {
    // `\$#,##0.00` is LibreOffice's spelling of `"$"#,##0.00`: the escape makes the symbol a
    // literal, which it already is, so it means the same as the bare or quoted symbol. Only the
    // currency symbol is unescaped here - `0.0\%` stays escaped, because there the escape does
    // change the meaning (a literal percent sign, not a percentage).
    const escaped = `\\${symbol}`;

    if (trimmed.startsWith(escaped)) {
      return { currency: currencyForSymbol(symbol), rest: trimmed.slice(escaped.length) };
    }

    if (trimmed.endsWith(escaped)) {
      return { currency: currencyForSymbol(symbol), rest: trimmed.slice(0, -escaped.length) };
    }

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
 * Three rules, in order. A format longer than `MAX_NUMBER_FORMAT_LENGTH`, or one whose sections
 * are split by a condition (`hasConditionalSection`), is not classified at all.
 * An elapsed-time section (`[h]:mm`, `[mm]:ss`, `[s]`) is a time: stripped first, `[h]:mm` left
 * `:mm`, a bare month, so Excel's standard duration format typed a timesheet column as 1899 dates.
 * And the currency comes off before the date and time codes are read: `CHF`, `SEK` and `HK$` carry
 * an `h` or an `s` that would otherwise turn a money column into `12:00:00`s.
 *
 * @param {string} numFmt The number format code.
 * @returns {TemporalFormatKind|null}
 */
export function classifyTemporalFormat(numFmt: string): TemporalFormatKind | null {
  // A code split by a condition (`[>=1000000]0.0,,\M;[>=1000]0.0,\K;0`) formats numbers in ranges;
  // no such code is a date. Read on its letters it can look like one: ExcelJS strips the escapes,
  // so LibreOffice's `\M` (millions) arrived as a month and 1234567 imported as `5280-02-15`.
  if (numFmt.length > MAX_NUMBER_FORMAT_LENGTH || hasConditionalSection(numFmt)) {
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
 * Whether a cell's number format formats a date or a time, answered exactly as the import's type
 * inference answers it. The readers' `date1904` shift asks `classifyTemporalFormat` directly,
 * because it shifts a date or a date-time but never a time.
 *
 * @param {string|null} numFmt The number format code, or `null` for a cell without one.
 * @returns {boolean}
 */
export function isTemporalFormatCode(numFmt: string | null): boolean {
  return numFmt !== null && classifyTemporalFormat(numFmt) !== null;
}
