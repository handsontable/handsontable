import { captureCurrency, sharedSymbolLcid, showsAsWholeNumber } from '../../../../utils/xlsxEngine/numFmtCode';

/**
 * The most integer digits `Intl.NumberFormat` accepts in `minimumIntegerDigits`.
 */
const MAX_INTL_INTEGER_DIGITS = 21;

/**
 * Builds the integer part of a number format: `minimumIntegerDigits` zeros (at least one), with the
 * grouping comma every three digits when grouping is on, padded with `#` to one full group
 * (`#,##0`, `#,#00`, `00,000`).
 *
 * @param {number} minimumIntegerDigits How many integer digits the format pins.
 * @param {boolean} useGrouping Whether the format groups thousands.
 * @returns {string}
 */
function integerPart(minimumIntegerDigits: number, useGrouping: boolean): string {
  if (!useGrouping) {
    return '0'.repeat(minimumIntegerDigits);
  }

  const placeholders = '#'.repeat(Math.max(0, 4 - minimumIntegerDigits)) + '0'.repeat(minimumIntegerDigits);
  let grouped = '';

  for (let i = placeholders.length; i > 0; i -= 3) {
    grouped = placeholders.slice(Math.max(0, i - 3), i) + (grouped === '' ? '' : `,${grouped}`);
  }

  return grouped;
}

/**
 * The `numericFormat` options the export reads.
 */
type NumericFormatOptions = {
  style?: string; currency?: string; minimumIntegerDigits?: number;
  minimumFractionDigits?: number; maximumFractionDigits?: number; useGrouping?: boolean;
};

/**
 * Resolves how many fraction digits the grid shows for a `numericFormat`: the minimum it always
 * shows and the maximum it rounds to. The numeric renderer formats with
 * `new Intl.NumberFormat(locale, numericFormat)`, so the counts come from that formatter's resolved
 * options and follow the `Intl` defaults for the style and the currency (0 to 3 for a plain number,
 * 2 for the US dollar, 0 for the yen and for a percent). Reading the raw options wrote `#,##0` for a
 * format that names no digits, and Excel rounded 1234.567 to 1,235 (GitHub issue #14372).
 *
 * Falls back to the digits the options name when `Intl` rejects the options or the locale, or
 * resolves no fraction digits (rounding to significant digits).
 *
 * @param {object} numericFormat The `numericFormat` cell meta value.
 * @param {string|undefined} locale BCP 47 locale tag from the `locale` cell property.
 * @returns {{ minimum: number, maximum: number }}
 */
function resolveFractionDigits(
  numericFormat: NumericFormatOptions, locale: string | undefined
): { minimum: number; maximum: number } {
  try {
    const { minimumFractionDigits, maximumFractionDigits } = new Intl.NumberFormat(
      locale, numericFormat as Intl.NumberFormatOptions
    ).resolvedOptions();

    if (Number.isInteger(minimumFractionDigits) && Number.isInteger(maximumFractionDigits)) {
      return { minimum: minimumFractionDigits as number, maximum: maximumFractionDigits as number };
    }
  } catch {
    // The named digits below are the best reading left.
  }

  const { minimumFractionDigits = 0, maximumFractionDigits } = numericFormat;
  const digits = maximumFractionDigits ?? minimumFractionDigits;

  return { minimum: digits, maximum: digits };
}

/**
 * Builds the decimal part of a number format: a `0` for every digit the grid always shows and a `#`
 * for every digit it shows only when the value has it (`.00`, `.0##`, `.###`), or an empty string
 * for a format with no fraction digits.
 *
 * @param {number} minimum The fraction digits the format always shows.
 * @param {number} maximum The fraction digits the format rounds to.
 * @returns {string}
 */
function decimalPartOf(minimum: number, maximum: number): string {
  return maximum > 0 ? `.${'0'.repeat(minimum)}${'#'.repeat(Math.max(0, maximum - minimum))}` : '';
}

/**
 * Resolves the currency symbol and its position (prefix or suffix) for a given
 * ISO 4217 currency code and locale using the `Intl.NumberFormat` API.
 *
 * @private
 * @param {string} currency ISO 4217 currency code (e.g. `'USD'`, `'EUR'`).
 * @param {string|undefined} locale BCP 47 locale tag (e.g. `'en-US'`).
 * @returns {{ symbol: string, isPrefix: boolean }}
 */
function getCurrencyInfo(currency: string, locale: string | undefined): { symbol: string; isPrefix: boolean } {
  try {
    const parts = new Intl.NumberFormat(locale || 'en', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);

    const symbol = parts.find(p => p.type === 'currency')?.value ?? currency;
    const currencyIndex = parts.findIndex(p => p.type === 'currency');
    const integerIndex = parts.findIndex(p => p.type === 'integer');
    const isPrefix = currencyIndex < integerIndex;

    return { symbol, isPrefix };
  } catch {
    // Intl.NumberFormat throws for unrecognised currency codes. Fall back to
    // the raw currency string placed as a prefix so the export still produces
    // a usable result.
    return { symbol: currency, isPrefix: true };
  }
}

/**
 * The Excel formats one `numericFormat` and locale resolve to.
 */
interface ResolvedNumFmt {
  /**
   * The format with the decimal part the grid shows.
   */
  numFmt: string;
  /**
   * The same format with no decimal part, for a value that shows no fraction digit. `null` when the
   * format always shows a fraction digit or never shows one.
   */
  wholeNumFmt: string | null;
  /**
   * The fraction digits the format rounds to.
   */
  maximum: number;
  /**
   * Whether the format is a percent.
   */
  isPercent: boolean;
}

/**
 * The formats resolved so far, keyed by locale and serialized `numericFormat`, the key the numeric
 * renderer caches its formatters under (`formatterCache` in `renderers/numericRenderer/utils.ts`).
 * The export resolves a format per numeric cell, and building an `Intl.NumberFormat` to read its
 * resolved options cost about 40 microseconds a cell: 4 seconds per 100,000 cells.
 */
const resolvedNumFmtCache = new Map<string, ResolvedNumFmt>();

/**
 * Resolves the Excel formats of a `numericFormat`: the one with the decimal part the grid shows,
 * and the one with no decimal part when every fraction digit is optional.
 *
 * @param {object} numericFormat The `numericFormat` cell meta value.
 * @param {string|undefined} locale BCP 47 locale tag from the `locale` cell property.
 * @returns {{ numFmt: string, wholeNumFmt: string|null, maximum: number, isPercent: boolean }}
 */
function resolveNumFmt(numericFormat: NumericFormatOptions, locale: string | undefined): ResolvedNumFmt {
  const { minimum, maximum } = resolveFractionDigits(numericFormat, locale);

  return {
    numFmt: buildNumFmt(numericFormat, locale, decimalPartOf(minimum, maximum)),
    wholeNumFmt: minimum === 0 && maximum > 0 ? buildNumFmt(numericFormat, locale, '') : null,
    maximum,
    isPercent: numericFormat.style === 'percent',
  };
}

/**
 * Builds the Excel format of a `numericFormat` around a given decimal part.
 *
 * @param {object} numericFormat The `numericFormat` cell meta value.
 * @param {string|undefined} locale BCP 47 locale tag from the `locale` cell property.
 * @param {string} decimalPart The decimal part of the format, such as `.00`, or an empty string.
 * @returns {string}
 */
function buildNumFmt(numericFormat: NumericFormatOptions, locale: string | undefined, decimalPart: string): string {
  const {
    style,
    currency,
    minimumIntegerDigits,
    useGrouping = true,
  } = numericFormat;

  // `Intl` throws for a `minimumIntegerDigits` outside 1-21 or not a whole number, so such a value
  // never reached the grid and is not written either.
  const integerDigits = Number.isInteger(minimumIntegerDigits)
    && (minimumIntegerDigits as number) >= 1 && (minimumIntegerDigits as number) <= MAX_INTL_INTEGER_DIGITS
    ? minimumIntegerDigits as number : 1;
  const intPart = integerPart(integerDigits, useGrouping !== false);

  if (style === 'percent') {
    return `${intPart}${decimalPart}%`;
  }

  if (style === 'currency' && currency) {
    const { symbol: rawSymbol, isPrefix } = getCurrencyInfo(currency, locale);
    // A lone dollar sign is written bare, Excel's own form. Every other symbol is quoted: Excel for
    // the web repairs a workbook holding an unquoted letter code (`#,##0.00USD`, `CHF#,##0.00`) and
    // drops the format, Numbers and LibreOffice misread unquoted multi-letter symbols such as the
    // zloty's or `kr`, and Numbers and Quick Look misread even a lone euro or pound sign
    // (`#,##0.00\u20AC` showed 1235 in Numbers for 1234.5).
    // The import reads the quoted form back (`captureCurrency` in `utils/xlsxEngine/numFmtCode.ts`).
    // A symbol several currencies share (`kr` for four kronor, the yen sign for the yen and the
    // yuan, and a bare `$` for a dollar currency other than the US dollar) is written as Excel's
    // locale token with the currency's home LCID (`[$kr-414]`, `[$$-C09]` for AUD): Excel shows the
    // symbol, and the import reads the LCID back to the right currency (`captureCurrency`). A bare
    // `$` reads back as the US dollar, so writing it for AUD changed the column's currency. Any symbol
    // that still reads back as another currency, or as none, is replaced by the quoted ISO code below.
    // `Intl` accepts the code in any case (`'usd'`), while the LCID table and the import's reading of
    // it are upper-case ISO codes, so the code is normalized before both (review round 12).
    const code = currency.toUpperCase();
    const lcid = sharedSymbolLcid(rawSymbol, code);
    let symbol = rawSymbol === '$' ? rawSymbol : `"${rawSymbol.replaceAll('"', '')}"`;

    if (lcid !== null) {
      symbol = `[$${rawSymbol}-${lcid.toString(16).toUpperCase()}]`;
    }

    // @TODO: handle locale-specific spacing between symbol and number
    // (e.g. non-breaking space in fr-FR). Excel numFmt requires "\ " for a
    // literal space, which varies per locale and is left for a follow-up.
    const withSymbol = (text: string) => (
      isPrefix ? `${text}${intPart}${decimalPart}` : `${intPart}${decimalPart}${text}`
    );
    const numFmt = withSymbol(symbol);

    // A symbol the import cannot map back (`\u20AA` for ILS, `R` for ZAR, `AU$` outside `en-AU`, a bare
    // `$` for a dollar currency with no LCID) re-imported as a plain number or as the US dollar. The
    // quoted ISO code reads back as the currency itself; Excel then shows the code, not the symbol.
    return captureCurrency(numFmt).currency === code ? numFmt : withSymbol(`"${code}"`);
  }

  return `${intPart}${decimalPart}`;
}

/**
 * Converts a `numericFormat` cell meta option to an Excel `numFmt` string.
 *
 * Handles the `Intl.NumberFormat` options form introduced in Handsontable 17.
 *
 * A format whose fraction digits are all optional (`#,##0.###`) is written with no decimal part for
 * a `value` that shows no fraction digit: Excel keeps the decimal point of such a format, so 1234
 * showed as `1,234.` where the grid shows `1,234`. Pass no `value` for a cell whose number can
 * change in the file, such as a formula cell, to get the format with the decimal part.
 *
 * @private
 * @param {object|null|undefined} numericFormat The `numericFormat` cell meta value.
 * @param {string|undefined} locale BCP 47 locale tag from the `locale` cell property.
 * @param {*} [value] The number the cell holds.
 * @returns {string|null}
 */
export function intlNumFormatToExcelNumFmt(
  numericFormat: NumericFormatOptions | null | undefined,
  locale?: string | undefined,
  value?: unknown
): string | null {
  if (!numericFormat) {
    return null;
  }

  const cacheKey = `${locale ?? ''}:${JSON.stringify(numericFormat)}`;
  let resolved = resolvedNumFmtCache.get(cacheKey);

  if (resolved === undefined) {
    resolved = resolveNumFmt(numericFormat, locale);
    resolvedNumFmtCache.set(cacheKey, resolved);
  }

  const { numFmt, wholeNumFmt, maximum, isPercent } = resolved;

  return wholeNumFmt !== null && typeof value === 'number' && showsAsWholeNumber(value, maximum, isPercent)
    ? wholeNumFmt : numFmt;
}
