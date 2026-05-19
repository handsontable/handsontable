/**
 * Converts a Numbro.js format pattern to an Excel `numFmt` string.
 *
 * Applies the minimum transformation needed for common patterns.
 * Numbro uses `0,0` to mean "thousands-grouped, at least one digit";
 * Excel uses `#,##0` for the same. All other pattern characters are
 * compatible between the two systems.
 *
 * Examples:
 * - `'$0,0.00'` → `'$#,##0.00'`
 * - `'0,0.00'`  → `'#,##0.00'`
 * - `'0,0'`     → `'#,##0'`
 * - `'0.00'`    → `'0.00'` (unchanged)
 * - `'0%'`      → `'0%'` (unchanged)
 *
 * @private
 * @param {*} pattern Numbro format pattern string (e.g. `'$0,0.00'`).
 * @returns {string|null}
 */
export function numbroPatternToExcelNumFmt(pattern: unknown): string | null {
  if (!pattern || typeof pattern !== 'string') {
    return null;
  }

  return pattern.replaceAll('0,0', '#,##0');
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
 * Handles both the legacy numbro.js `pattern` form and the current
 * `Intl.NumberFormat` options form introduced in Handsontable 17.
 *
 * @private
 * @param {object|null|undefined} numericFormat The `numericFormat` cell meta value.
 * @param {string|undefined} locale BCP 47 locale tag from the `locale` cell property.
 * @returns {string|null}
 */
export function intlNumFormatToExcelNumFmt(
  numericFormat: {
    pattern?: string; style?: string; currency?: string;
    minimumFractionDigits?: number; maximumFractionDigits?: number; useGrouping?: boolean;
  } | null | undefined,
  locale: string | undefined
): string | null {
  if (!numericFormat) {
    return null;
  }

  // Legacy: numbro.js pattern (deprecated since Handsontable 17).
  if (numericFormat.pattern) {
    return numbroPatternToExcelNumFmt(numericFormat.pattern);
  }

  // Current: Intl.NumberFormat options.
  const {
    style,
    currency,
    minimumFractionDigits = 0,
    maximumFractionDigits,
    useGrouping = true,
  } = numericFormat;

  const fractionDigits = maximumFractionDigits ?? minimumFractionDigits;
  const decimalPart = fractionDigits > 0 ? `.${('0').repeat(fractionDigits)}` : '';
  const intPart = useGrouping !== false ? '#,##0' : '0';

  if (style === 'percent') {
    return `${intPart}${decimalPart}%`;
  }

  if (style === 'currency' && currency) {
    const { symbol, isPrefix } = getCurrencyInfo(currency, locale);

    // @TODO: handle locale-specific spacing between symbol and number
    // (e.g. non-breaking space in fr-FR). Excel numFmt requires "\ " for a
    // literal space, which varies per locale and is left for a follow-up.
    return isPrefix ? `${symbol}${intPart}${decimalPart}` : `${intPart}${decimalPart}${symbol}`;
  }

  return `${intPart}${decimalPart}`;
}
