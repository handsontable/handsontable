import { fastInnerHTML } from '../../helpers/dom/element';
import { stringify } from '../../helpers/mixed';

export const RENDERER_TYPE = 'password';

/**
 * Formats the value using the password format.
 *
 * @param {*} value Value to be formatted.
 * @param {CellMeta} cellProperties Cell meta object.
 * @returns {*} Returns the formatted value.
 */
export function valueFormatter(value, cellProperties) {
  const hashLength = cellProperties.hashLength || stringify(value).length;
  const hashSymbol = cellProperties.hashSymbol || '*';

  let hash = '';

  for (let i = 0; i < hashLength; i++) {
    hash += hashSymbol;
  }

  return hash;
}

/**
 * @private
 * @param {Core} hotInstance The Handsontable instance.
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {number|string} prop The column property (passed when datasource is an array of objects).
 * @param {*} value The rendered value.
 */
export function passwordRenderer(hotInstance, TD, row, col, prop, value) {
  fastInnerHTML(TD, value, hotInstance.getSettings().sanitizer);
}

passwordRenderer.valueFormatter = valueFormatter;
passwordRenderer.RENDERER_TYPE = RENDERER_TYPE;
