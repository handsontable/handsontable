const DEFAULT_INTL_FORMAT = {
  useGrouping: false,
  maximumFractionDigits: 20,
};

const formatterCache = new Map<string, Intl.NumberFormat>();

/**
 * Formats the value using the intl format.
 *
 * @param {*} value Value to be formatted.
 * @param {CellMeta} cellProperties Cell meta object.
 * @returns {*} Returns the formatted value.
 */
export function intlFormatter(value: unknown, cellProperties: Record<string, unknown>) {
  const { numericFormat, locale } = cellProperties;
  const options = (numericFormat ?? DEFAULT_INTL_FORMAT) as Intl.NumberFormatOptions;
  const cacheKey = `${(locale as string) ?? ''}:${JSON.stringify(options)}`;

  let formatter = formatterCache.get(cacheKey);

  if (formatter === undefined) {
    formatter = new Intl.NumberFormat(locale as string, options);
    formatterCache.set(cacheKey, formatter);
  }

  return formatter.format(value as number);
}
