import { textRenderer } from '../textRenderer';
import { toDateObject } from '../../helpers/date';

export const RENDERER_TYPE = 'date';

const DEFAULT_FORMAT = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
};

/**
 * Formats the value using the date format.
 *
 * @param {*} value
 * @param {CellMeta} cellProperties Cell meta object.
 * @returns {*} Returns the rendered value.
 */
export function valueFormatter(value, cellProperties) {
  const { dateFormat, locale } = cellProperties;
  const date = toDateObject(value);

  return new Intl.DateTimeFormat(locale, dateFormat ?? DEFAULT_FORMAT).format(date);
}

/**
 * Handsontable renderer.
 *
 * @private
 * @param {Core} hotInstance The Handsontable instance.
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {number|string} prop The column property (passed when datasource is an array of objects).
 * @param {*} value The rendered value.
 * @param {object} cellProperties The cell meta object (see {@link Core#getCellMeta}).
 */
export function dateRenderer(hotInstance, TD, row, col, prop, value, cellProperties) {
  value = cellProperties.valueFormatter(value, cellProperties);
  textRenderer.apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);
}

dateRenderer.RENDERER_TYPE = RENDERER_TYPE;
