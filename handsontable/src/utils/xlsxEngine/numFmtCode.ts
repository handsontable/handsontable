/**
 * Reading an Excel number-format code: what is decoration, what currency it carries, and whether it
 * formats a date or a time. Shared by the import's type inference (`plugins/importFile/inference.ts`)
 * and by the native reader's `date1904` shift, which must agree on which formats are temporal - a
 * serial the reader shifts by 1462 days and the import then types as a number shows the shift.
 *
 * This file must stay 7-bit ASCII (see `AGENTS.md`): every non-ASCII currency symbol is written as a
 * `\u` escape.
 */

import { CURRENCY_SYMBOL_TO_CODE, CURRENCY_SYMBOLS } from '../currencySymbols';

/**
 * The longest number format code Excel accepts. Anything longer did not come from Excel, and is
 * neither parsed nor classified.
 */
export const MAX_NUMBER_FORMAT_LENGTH = 255;

/**
 * Symbols several currencies share, mapped to the LCIDs (Windows locale IDs) that tell them apart in
 * Excel's locale token `[$<symbol>-<LCID>]`. `intlNumFormatToExcelNumFmt` writes the token with the
 * currency's home LCID for exactly these symbols, so `kr` comes back as the krone it was and not as
 * the first krone the symbol table names. Keyed by symbol so an LCID never reassigns another symbol
 * (`[$kr-C09]` stays a krona). The writer reads the LCID back out with `sharedSymbolLcid`.
 *
 * DKK is written `[$kr.-406]`, with the period, because that is Excel's own spelling of the Danish
 * krone. macOS Quick Look misreads that token as `PLN` (it reads `[$kr-406]` correctly); Excel and
 * LibreOffice do not, and the previewer is the outlier, so the export keeps Excel's form. The reader
 * maps both spellings.
 *
 * The dollar sign is shared by the US dollar and every other dollar currency that `Intl` renders as
 * a bare `$` in its home locale (`en-AU` AUD, `en-CA` CAD, `es-MX` MXN). Those are written with their
 * home LCID (`[$$-C09]`), which is also Excel's own token for them; an LCID this table does not hold
 * (`[$$-409]`, `[$$-414]`) reads as the US dollar, and so does a bare `$`.
 */
const SHARED_SYMBOL_LCID_TO_CODE: Record<string, Record<number, string>> = {
  kr: { 0x414: 'NOK', 0x814: 'NOK', 0x41D: 'SEK', 0x81D: 'SEK', 0x406: 'DKK', 0x40F: 'ISK' },
  // eslint-disable-next-line quote-props
  'kr.': { 0x414: 'NOK', 0x814: 'NOK', 0x41D: 'SEK', 0x81D: 'SEK', 0x406: 'DKK', 0x40F: 'ISK' },
  '\u00A5': { 0x411: 'JPY', 0x804: 'CNY' },
  // The full-width yen sign, which `Intl` renders for the yen under `ja-JP`. Without its own row a
  // `[$\uFFE5-804]` token fell through to the symbol table, which reads it as JPY.
  '\uFFE5': { 0x411: 'JPY', 0x804: 'CNY' },
  $: {
    0xC09: 'AUD',
    0x1009: 'CAD',
    0xC0C: 'CAD',
    0x1409: 'NZD',
    0x80A: 'MXN',
    0x2C0A: 'ARS',
    0x340A: 'CLP',
    0x240A: 'COP',
    0x4809: 'SGD',
    0x404: 'TWD',
    0xC04: 'HKD',
    0x380A: 'UYU',
    0x2009: 'JMD',
    0x2C09: 'TTD',
    0x2809: 'BZD',
    0x83E: 'BND',
  },
};

/**
 * The home LCID of each currency whose symbol another currency shares, the inverse of
 * `SHARED_SYMBOL_LCID_TO_CODE` (CAD takes `en-CA`'s 0x1009, not `fr-CA`'s 0xC0C). The US dollar has
 * none: it is the one a bare `$` means.
 */
const SHARED_SYMBOL_CURRENCY_LCID: Record<string, number> = {
  NOK: 0x414,
  SEK: 0x41D,
  DKK: 0x406,
  ISK: 0x40F,
  JPY: 0x411,
  CNY: 0x804,
  AUD: 0xC09,
  CAD: 0x1009,
  NZD: 0x1409,
  MXN: 0x80A,
  ARS: 0x2C0A,
  CLP: 0x340A,
  COP: 0x240A,
  SGD: 0x4809,
  TWD: 0x404,
  HKD: 0xC04,
  UYU: 0x380A,
  JMD: 0x2009,
  TTD: 0x2C09,
  BZD: 0x2809,
  BND: 0x83E,
};

/**
 * The LCID `intlNumFormatToExcelNumFmt` writes into a locale token for a symbol several currencies
 * share (`kr`, `kr.`, the yen sign, and the dollar sign of a currency other than the US dollar), or
 * `null` when the symbol belongs to one currency only (or is the US dollar's `$`) and can be written
 * as it is. Both lookups are own-property checks: the currency code comes from the
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
 * The ISO 4217 codes a bare three-letter marker may be, used where `Intl.supportedValuesOf` is
 * missing: the active codes as of 2024.
 */
const FALLBACK_CURRENCY_CODES = 'AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BRL '
  + 'BSD BTN BWP BYN BZD CAD CDF CHF CLP CNY COP CRC CUC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP '
  + 'GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HRK HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF '
  + 'KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MYR MZN NAD '
  + 'NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE '
  + 'SLL SOS SRD SSP STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD UYU UZS VES VND VUV WST '
  + 'XAF XCD XOF XPF YER ZAR ZMW ZWL';

/**
 * The ISO 4217 codes `Intl` knows (or `FALLBACK_CURRENCY_CODES`), built on first use. A bare
 * three-letter marker - quoted, escaped or unquoted, padded or not - is a currency only when it is
 * one of them: `0.00"MPH"`, `0" DAY"` or `#,##0" PCS"` is a unit label, and reading every three
 * capital letters as a code imported such columns as made-up currencies. A unit label that is also a
 * real code stays ambiguous and reads as the currency: `0.0" KGS"` is the Kyrgyz som. Padding is no
 * signal, because Excel re-saves `#,##0.00 USD` as `#,##0.00\ \U\S\D` and LibreOffice writes
 * `#,##0.00" RON"`. The `Intl` list differs a little by browser (historic codes such as `ATS`),
 * which is accepted.
 */
let knownCurrencyCodes: Set<string> | null = null;

/**
 * Whether `code` is an ISO 4217 code `Intl` knows.
 *
 * @param {string} code Three capital letters.
 * @returns {boolean}
 */
function isKnownCurrencyCode(code: string): boolean {
  if (knownCurrencyCodes === null) {
    const supported = typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('currency')
      : FALLBACK_CURRENCY_CODES.split(' ');

    knownCurrencyCodes = new Set(supported);
  }

  return knownCurrencyCodes.has(code);
}

/**
 * Maps a bare currency marker to its ISO code: a three-letter code `Intl` knows is its own code, a
 * dollar composite is looked up, anything else is unknown.
 *
 * @param {string} marker The marker as written in the format code.
 * @returns {string|null}
 */
function bareMarkerToCode(marker: string): string | null {
  if (marker.endsWith('$')) {
    return Object.hasOwn(DOLLAR_COMPOSITE_TO_CODE, marker) ? DOLLAR_COMPOSITE_TO_CODE[marker] : null;
  }

  return isKnownCurrencyCode(marker) ? marker : null;
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
 * A section as the grid compares it: without its colors and conditions, with an escaped space read
 * as the space it stands for (Excel pads a negative section with `\ ` where the positive one has
 * `_ `), trimmed.
 *
 * @param {string} section One section of a number format, layout codes removed.
 * @returns {string}
 */
function comparableSection(section: string): string {
  return section.replace(NON_CURRENCY_BRACKET_SECTION_REGEX, '').replaceAll('\\ ', ' ').trim();
}

/**
 * Whether the grid shows a code's negative values the way its second section asks. `Intl` writes a
 * negative number as its positive form behind a minus sign, so only a second section that is the
 * first one with a leading `-` (or LibreOffice's `\-`), give or take a color and padding, reads the
 * same. A parenthesized `(#,##0)`, or a section without the minus, shows differently, and the caller
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

  const [positive, negative] = sections.map(comparableSection);

  return negative === `-${positive}` || negative === `\\-${positive}`;
}

/**
 * Whether the grid shows a code's zero the way its third section asks. The grid formats zero with the
 * first section, so a zero section that shows digits is close enough, and one that shows text or
 * nothing (`;;`, `"-"`, `"zero"`, finance sheets' hide-zero codes) is not: the caller reports the
 * code. A code with fewer than three sections has no zero section.
 *
 * @param {string} numFmt The number format code.
 * @returns {boolean}
 */
export function isZeroSectionShowable(numFmt: string): boolean {
  const sections = splitFormatSections(numFmt, 3);

  return sections.length < 3 || /[#0]/.test(stripFormatDecorations(sections[2]));
}

/**
 * Whether a number format is `General`, which Excel reads in any case: LibreOffice 3.3 to 5.1 and
 * Apache POI write `GENERAL`, and a case-sensitive test typed such a text column from its format.
 *
 * @param {string|null} numFmt The number format code, or `null` for a cell without one.
 * @returns {boolean}
 */
export function isGeneralFormatCode(numFmt: string | null): boolean {
  return numFmt !== null && /^general$/i.test(numFmt);
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
  const prefixEnd = leadingDecorationsEnd(numFmt);

  if (prefixEnd === 0) {
    return captureCurrencyIn(numFmt);
  }

  const prefix = numFmt.slice(0, prefixEnd);
  const { currency, rest } = captureCurrencyIn(numFmt.slice(prefixEnd));

  return { currency, rest: `${prefix}${rest}` };
}

/**
 * Returns the index just past the bracket sections a number format opens with that carry no currency
 * symbol: a color (`[Red]`, `[Color10]`) or a locale token without a symbol (`[$-409]`). They hid the
 * symbol behind them, so `[Red]"$"#,##0.00` read as a plain number. A section with a symbol
 * (`[$USD]`) ends the run, and so does an unterminated one. Walked by index, so the scan is linear.
 *
 * @param {string} numFmt The number format code.
 * @returns {number}
 */
function leadingDecorationsEnd(numFmt: string): number {
  let end = 0;

  while (numFmt[end] === '[') {
    const close = numFmt.indexOf(']', end);

    if (close === -1) {
      return end;
    }

    const inner = numFmt.slice(end + 1, close);

    if (inner.startsWith('$') && inner.slice(1).split('-')[0].trim() !== '') {
      return end;
    }

    end = close + 1;
  }

  return end;
}

/**
 * Captures the currency of a number format whose leading color and locale sections are already set
 * aside. See {@link captureCurrency}.
 *
 * @param {string} numFmt The number format code.
 * @returns {CurrencyCapture}
 */
function captureCurrencyIn(numFmt: string): CurrencyCapture {
  const token = numFmt.match(CURRENCY_TOKEN_REGEX);

  if (token) {
    const symbol = token[1].trim();
    const rest = numFmt.replace(CURRENCY_TOKEN_REGEX, '');

    // A token with no symbol (`[$-409]`) only names a locale, so the currency, if any, is elsewhere.
    if (symbol === '') {
      return captureCurrencyIn(rest);
    }

    // A token may carry an ISO code as its symbol (`[$USD]`), which the symbol table does not own.
    return {
      currency: currencyForToken(symbol, token[2])
        ?? (BARE_MARKER_REGEX.test(symbol) ? bareMarkerToCode(symbol) : null),
      rest,
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

  // A marker that is no currency is read like a quoted label: dropped from the pattern, which is
  // what the built-in engine does with the same code's escaped form (ExcelJS unescapes it).
  if (bare) {
    return {
      currency: bareMarkerToCode(bare[1] ?? bare[2]),
      rest: trimmed.replace(BARE_CURRENCY_REGEX, ''),
    };
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
  /**
   * Leave a space where each bracket section, quoted literal and escaped character was, instead of
   * nothing, so the codes on either side stay apart for a tokenizer: deleted, the escapes of
   * `dddd\,\ d` fused the weekday and the day into one `ddddd` run.
   */
  separateLiterals?: boolean;
}

/**
 * Strips bracketed sections (`[$-409]`, `[Red]`, `[h]`), quoted literals (`"days"`) and
 * backslash-escaped characters (`\h`, `\%`) from a number format, so a classifier sees only format
 * codes. Run `captureCurrency` first when the currency matters: a quoted or bracketed symbol is
 * decoration here.
 *
 * @param {string} numFmt The number format code.
 * @param {StripFormatDecorationsOptions} [options] Whether to keep elapsed-time sections, and whether
 * to leave a space in place of each literal.
 * @returns {string}
 */
export function stripFormatDecorations(numFmt: string, options: StripFormatDecorationsOptions = {}): string {
  const brackets = options.keepElapsed === true ? NON_ELAPSED_BRACKET_SECTION_REGEX : BRACKET_SECTION_REGEX;
  const separator = options.separateLiterals === true ? ' ' : '';

  return numFmt.replace(brackets, separator).replace(/"[^"]*"/g, separator).replace(/\\./g, separator);
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
