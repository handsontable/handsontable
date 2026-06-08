import numbro from 'numbro';
import type { CellProperties } from '../../settings';

const DEFAULT_INTL_FORMAT = {
  useGrouping: false,
  maximumFractionDigits: 20,
};

/**
 * Formats the value using the numbro format.
 *
 * @param {*} value Value to be formatted.
 * @param {CellMeta} cellProperties Cell meta object.
 * @returns {*} Returns the formatted value.
 */
export function numbroFormatter(value: unknown, cellProperties: CellProperties) {
  const numericFormat = cellProperties.numericFormat as Record<string, unknown> | undefined;
  const cellCulture = numericFormat && numericFormat.culture as string || '-';
  const cellFormatPattern = numericFormat && numericFormat.pattern as string;

  if (typeof cellCulture !== 'undefined' && !numbro.languages()[cellCulture]) {
    const shortTag = cellCulture.replace('-', '');
    const numbroWithLangs = numbro as unknown as { allLanguages?: Record<string, unknown> } & Record<string, unknown>;
    const langData = numbroWithLangs.allLanguages
      ? numbroWithLangs.allLanguages[cellCulture] : numbroWithLangs[shortTag];

    if (langData) {
      numbro.registerLanguage(langData as numbro.NumbroLanguage);
    }
  }

  numbro.setLanguage(cellCulture);

  return numbro(value).format(cellFormatPattern || '0');
}

/**
 * Formats the value using the intl format.
 *
 * @param {*} value Value to be formatted.
 * @param {CellMeta} cellProperties Cell meta object.
 * @returns {*} Returns the formatted value.
 */
export function intlFormatter(value: unknown, cellProperties: CellProperties) {
  const { numericFormat, locale } = cellProperties;

  return new Intl.NumberFormat(
    locale as string, (numericFormat ?? DEFAULT_INTL_FORMAT) as Intl.NumberFormatOptions).format(value as number);
}

/**
 * Checks if the numericFormat object contains any numbro-specific format keys.
 *
 * @param {CellMeta} cellProperties Cell meta object.
 * @returns {boolean} Returns true if the numericFormat object contains any numbro-specific format keys, false otherwise.
 */
export function isNumbroScheme(cellProperties: CellProperties) {
  const numericFormat = cellProperties.numericFormat as Record<string, unknown> | undefined;

  return numericFormat?.pattern !== undefined || numericFormat?.culture !== undefined;
}
