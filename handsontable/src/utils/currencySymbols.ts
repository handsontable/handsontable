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
  R$: 'BRL',
};

/**
 * `CURRENCY_SYMBOL_TO_CODE`'s symbols, longest first, so a multi-character symbol wins over a
 * single-character one that is its suffix.
 */
export const CURRENCY_SYMBOLS = Object.keys(CURRENCY_SYMBOL_TO_CODE).sort((a, b) => b.length - a.length);
