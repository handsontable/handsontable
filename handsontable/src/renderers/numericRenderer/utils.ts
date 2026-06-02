const DEFAULT_INTL_FORMAT = {
  useGrouping: false,
  maximumFractionDigits: 20,
};

/**
 * Formats the value using the intl format.
 *
 * @param {*} value Value to be formatted.
 * @param {CellMeta} cellProperties Cell meta object.
 * @returns {*} Returns the formatted value.
 */
export function intlFormatter(value: unknown, cellProperties: Record<string, unknown>) {
  const { numericFormat, locale } = cellProperties;

  return new Intl.NumberFormat(
    locale as string, (numericFormat ?? DEFAULT_INTL_FORMAT) as Intl.NumberFormatOptions).format(value as number);
}
