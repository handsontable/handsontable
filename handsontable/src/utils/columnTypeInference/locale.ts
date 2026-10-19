import { CURRENCY_SYMBOL_TO_CODE } from '../currencySymbols';

/**
 * The locale the inference falls back to. It is fixed rather than read from the host, so the same
 * data infers the same way in every browser.
 */
export const DEFAULT_LOCALE = 'en-US';

/**
 * Currency symbols that several currencies share, mapped by region to the code the region uses.
 * A region missing here takes the symbol's entry in `CURRENCY_SYMBOL_TO_CODE`.
 */
const REGIONAL_CURRENCY_CODES: Record<string, Record<string, string>> = {
  $: { AU: 'AUD', CA: 'CAD', HK: 'HKD', MX: 'MXN', NZ: 'NZD', SG: 'SGD', TW: 'TWD' },
  kr: { DK: 'DKK', IS: 'ISK', NO: 'NOK' },
  '¥': { CN: 'CNY' },
};

/**
 * Returns `locale` when both `Intl.NumberFormat` and `Intl.DateTimeFormat` support it, and
 * `DEFAULT_LOCALE` otherwise. A malformed tag throws a `RangeError`, and an unknown but well-formed
 * one (`zz`) makes `Intl` fall back to the host's own locale, so both are replaced here.
 */
export function resolveLocale(locale: unknown): string {
  if (typeof locale !== 'string' || locale === '') {
    return DEFAULT_LOCALE;
  }

  try {
    const [supported] = Intl.NumberFormat.supportedLocalesOf(locale);

    return supported !== undefined && Intl.DateTimeFormat.supportedLocalesOf(supported).length > 0
      ? supported
      : DEFAULT_LOCALE;

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

/**
 * The region of the locale (`CA` for `en-CA`, `US` for a bare `en`), or an empty string when it has
 * none.
 */
export function getLocaleRegion(locale: string): string {
  return new Intl.Locale(locale).maximize().region ?? '';
}

/**
 * The ISO 4217 code a currency symbol stands for in a region: `$` is CAD in Canada and `kr` is NOK
 * in Norway, while a symbol only one currency uses maps to that currency anywhere.
 */
export function resolveCurrencyCode(symbol: string, region: string): string {
  return REGIONAL_CURRENCY_CODES[symbol]?.[region] ?? CURRENCY_SYMBOL_TO_CODE[symbol];
}
