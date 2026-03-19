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
export function numbroPatternToExcelNumFmt(pattern) {
  if (!pattern || typeof pattern !== 'string') {
    return null;
  }

  return pattern.replace(/0,0/g, '#,##0');
}

/**
 * Returns the currency symbol for a given ISO 4217 currency code and locale
 * using the `Intl.NumberFormat` API.
 *
 * @private
 * @param {string} currency ISO 4217 currency code (e.g. `'USD'`, `'EUR'`).
 * @param {string|undefined} locale BCP 47 locale tag (e.g. `'en-US'`).
 * @returns {string}
 */
function getCurrencySymbol(currency, locale) {
  try {
    const parts = new Intl.NumberFormat(locale || 'en', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);

    return parts.find(p => p.type === 'currency')?.value ?? currency;
  } catch {
    // Intl.NumberFormat throws for unrecognised currency codes. Fall back to
    // the raw currency string so the export still produces a usable result.
    return currency;
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
export function intlNumFormatToExcelNumFmt(numericFormat, locale) {
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
    const symbol = getCurrencySymbol(currency, locale);

    return `${symbol}${intPart}${decimalPart}`;
  }

  return `${intPart}${decimalPart}`;
}
