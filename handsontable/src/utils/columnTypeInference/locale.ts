/**
 * The locale the inference falls back to. It is fixed rather than read from the host, so the same
 * data infers the same way in every browser.
 */
export const DEFAULT_LOCALE = 'en-US';

/**
 * The order a day-month-year date is written in. `YMD` covers the ISO form and its `/` and `.`
 * variants, which are never ambiguous.
 */
export type DateOrder = 'DMY' | 'MDY' | 'YMD';

/**
 * Returns `locale` when `Intl` accepts it, and `DEFAULT_LOCALE` otherwise. `Intl` throws a
 * `RangeError` on a malformed tag, and an unknown but well-formed tag resolves to a fallback
 * the engine picks, so only the malformed case is replaced here.
 */
export function resolveLocale(locale: unknown): string {
  if (typeof locale !== 'string' || locale === '') {
    return DEFAULT_LOCALE;
  }

  try {
    return Intl.getCanonicalLocales(locale)[0] ?? DEFAULT_LOCALE;

  } catch {
    return DEFAULT_LOCALE;
  }
}

/**
 * The decimal separator the locale writes, read from `Intl.NumberFormat`. Any separator other than a
 * comma is treated as a dot, since the value grammar knows those two only.
 */
export function getLocaleDecimalSeparator(locale: string): '.' | ',' {
  const decimal = new Intl.NumberFormat(locale).formatToParts(1.5).find(part => part.type === 'decimal');

  return decimal?.value === ',' ? ',' : '.';
}

/**
 * The order the locale writes a numeric day and month in, read from `Intl.DateTimeFormat`. A locale
 * that writes the year first (`ja-JP`) still has a month-before-day order, so it answers `MDY` for a
 * date whose year comes last.
 */
export function getLocaleDateOrder(locale: string): 'DMY' | 'MDY' {
  const parts = new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' })
    .formatToParts(Date.UTC(2026, 2, 12))
    .map(part => part.type);

  return parts.indexOf('day') < parts.indexOf('month') ? 'DMY' : 'MDY';
}
