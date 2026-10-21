/**
 * Currency symbols mapped to their ISO 4217 codes. The XLSX import reads them out of number formats
 * and the raw-value column type inference reads them off cell values, so both share this one table.
 * Longer symbols are matched first (see `CURRENCY_SYMBOLS`), so `R$` never reads as `$`.
 */
export const CURRENCY_SYMBOL_TO_CODE: Record<string, string> = {
  $: 'USD',
  '\u20ac': 'EUR',
  '\u00a3': 'GBP',
  '\u00a5': 'JPY',
  // Escapes, not raw characters: a raw non-ASCII identifier stops the non-minified bundles from
  // parsing on a page that is not served as UTF-8, and a raw character in a string decodes wrongly
  // there (see the Build section of `handsontable/AGENTS.md`).
  // eslint-disable-next-line quote-props
  'z\u0142': 'PLN',
  '\u20b9': 'INR',
  '\u20a9': 'KRW',
  CHF: 'CHF',
  kr: 'SEK',
  // eslint-disable-next-line quote-props
  'kr.': 'DKK',
  R$: 'BRL',
  // eslint-disable-next-line quote-props
  'K\u010d': 'CZK',
  Ft: 'HUF',
  '\u20bd': 'RUB',
  '\u20ba': 'TRY',
  '\uffe5': 'JPY',
};

/**
 * The ISO 4217 codes read from a value (`12.00 USD`). A fixed list of the widely traded currencies,
 * and not every code `Intl` knows: that includes English words (`ALL`, `TOP`, `MAD`, `TRY`, `PEN`),
 * so `TOP 10` would read as ten of a currency, and the list would change with the browser.
 */
const CURRENCY_CODES = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'PLN', 'SEK', 'NOK', 'DKK', 'CZK', 'HUF', 'RON',
  'BGN', 'CNY', 'HKD', 'SGD', 'KRW', 'INR', 'BRL', 'MXN', 'ZAR', 'ILS', 'AED', 'SAR', 'THB', 'IDR', 'MYR',
  'PHP', 'TWD', 'CLP', 'COP', 'ARS', 'UAH', 'ISK',
]);

/**
 * Whether the text is a currency code from `CURRENCY_CODES`, in upper case.
 */
export function isCurrencyCode(text: string): boolean {
  return CURRENCY_CODES.has(text);
}

/**
 * `CURRENCY_SYMBOL_TO_CODE`'s symbols, longest first, so a multi-character symbol wins over a
 * single-character one that is its suffix.
 */
export const CURRENCY_SYMBOLS = Object.keys(CURRENCY_SYMBOL_TO_CODE).sort((a, b) => b.length - a.length);
