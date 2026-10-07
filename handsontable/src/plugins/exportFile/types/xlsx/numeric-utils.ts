import { sharedSymbolLcid } from '../../../../utils/xlsxEngine/numFmtCode';

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
 * Converts a `numericFormat` cell meta option to an Excel `numFmt` string.
 *
 * Handles the `Intl.NumberFormat` options form introduced in Handsontable 17.
 *
 * @private
 * @param {object|null|undefined} numericFormat The `numericFormat` cell meta value.
 * @param {string|undefined} locale BCP 47 locale tag from the `locale` cell property.
 * @returns {string|null}
 */
export function intlNumFormatToExcelNumFmt(
  numericFormat: {
    style?: string; currency?: string; minimumIntegerDigits?: number;
    minimumFractionDigits?: number; maximumFractionDigits?: number; useGrouping?: boolean;
  } | null | undefined,
  locale?: string | undefined
): string | null {
  if (!numericFormat) {
    return null;
  }

  const {
    style,
    currency,
    minimumIntegerDigits,
    minimumFractionDigits = 0,
    maximumFractionDigits,
    useGrouping = true,
  } = numericFormat;

  const fractionDigits = maximumFractionDigits ?? minimumFractionDigits;
  const decimalPart = fractionDigits > 0 ? `.${('0').repeat(fractionDigits)}` : '';
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
    // A lone symbol (the dollar, euro, pound or yen sign) is written bare. Anything longer is
    // quoted: Excel for the web repairs a workbook holding an unquoted letter code (`#,##0.00USD`,
    // `CHF#,##0.00`) and drops the format, and Numbers and LibreOffice misread unquoted multi-letter
    // symbols such as the zloty's or `kr`.
    // The import reads the quoted form back (`captureCurrency` in `utils/xlsxEngine/numFmtCode.ts`).
    // A symbol several currencies share (`kr` for four kronor, the yen sign for the yen and the
    // yuan) is written as Excel's locale token with the currency's home LCID (`[$kr-414]`): Excel
    // shows the symbol, and the import reads the LCID back to the right currency
    // (`captureCurrency`).
    const lcid = sharedSymbolLcid(rawSymbol, currency);
    let symbol = rawSymbol.length > 1 ? `"${rawSymbol.replaceAll('"', '')}"` : rawSymbol;

    if (lcid !== null) {
      symbol = `[$${rawSymbol}-${lcid.toString(16).toUpperCase()}]`;
    }

    // @TODO: handle locale-specific spacing between symbol and number
    // (e.g. non-breaking space in fr-FR). Excel numFmt requires "\ " for a
    // literal space, which varies per locale and is left for a follow-up.
    return isPrefix ? `${symbol}${intPart}${decimalPart}` : `${intPart}${decimalPart}${symbol}`;
  }

  return `${intPart}${decimalPart}`;
}
