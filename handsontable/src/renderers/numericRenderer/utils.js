import numbro from 'numbro';

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
export function numbroFormatter(value, cellProperties) {
  const { numericFormat } = cellProperties;
  const cellCulture = numericFormat && numericFormat.culture || '-';
  const cellFormatPattern = numericFormat && numericFormat.pattern;

  if (typeof cellCulture !== 'undefined' && !numbro.languages()[cellCulture]) {
    const shortTag = cellCulture.replace('-', '');
    const langData = numbro.allLanguages ? numbro.allLanguages[cellCulture] : numbro[shortTag];

    if (langData) {
      numbro.registerLanguage(langData);
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
export function intlFormatter(value, cellProperties) {
  const { numericFormat, locale } = cellProperties;

  return new Intl.NumberFormat(locale, numericFormat ?? DEFAULT_INTL_FORMAT).format(value);
}

/**
 * Checks if the numericFormat object contains any numbro-specific format keys.
 *
 * @param {CellMeta} cellProperties Cell meta object.
 * @returns {boolean} Returns true if the numericFormat object contains any numbro-specific format keys, false otherwise.
 */
export function isNumbroScheme(cellProperties) {
  const { numericFormat } = cellProperties;

  return numericFormat?.pattern !== undefined || numericFormat?.culture !== undefined;
}
