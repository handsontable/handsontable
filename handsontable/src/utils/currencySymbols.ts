/**
 * Currency symbols mapped to their ISO 4217 codes. The XLSX import reads them out of number formats
 * and the raw-value column type inference reads them off cell values, so both share this one table.
 * Longer symbols are matched first (see `CURRENCY_SYMBOLS`), so `R$` never reads as `$`.
 */
export const CURRENCY_SYMBOL_TO_CODE: Record<string, string> = {
  $: 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  // An escape, not a bare `z\u0142` key: a raw non-ASCII identifier stops the non-minified bundles from
  // parsing on a page that is not served as UTF-8 (see the Build section of AGENTS.md).
  // eslint-disable-next-line quote-props
  'z\u0142': 'PLN',
  '₹': 'INR',
  '₩': 'KRW',
  CHF: 'CHF',
  kr: 'SEK',
  R$: 'BRL',
};

/**
 * `CURRENCY_SYMBOL_TO_CODE`'s symbols, longest first, so a multi-character symbol wins over a
 * single-character one that is its suffix.
 */
export const CURRENCY_SYMBOLS = Object.keys(CURRENCY_SYMBOL_TO_CODE).sort((a, b) => b.length - a.length);
