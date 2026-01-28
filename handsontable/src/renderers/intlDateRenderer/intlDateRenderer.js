import { textRenderer } from '../textRenderer';
import { parseToLocalDate } from '../../helpers/date';
import { isEmpty } from '../../helpers/mixed';
import { BAD_VALUE_TEXT } from '../../helpers/constants';

export const RENDERER_TYPE = 'intlDate';

const DEFAULT_INTL_FORMAT = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
};

/**
 * Formats the value using the date format.
 *
 * @param {*} value Value to be formatted.
 * @param {CellMeta} cellProperties Cell meta object.
 * @returns {*} Returns the rendered value.
 */
export function valueFormatter(value, cellProperties) {
  if (isEmpty(value)) {
    return value;
  }

  const { dateFormat, locale } = cellProperties;
  const date = parseToLocalDate(value);

  if (date === null) {
    return BAD_VALUE_TEXT;
  }

  return new Intl.DateTimeFormat(locale, dateFormat ?? DEFAULT_INTL_FORMAT).format(date);
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
export function intlDateRenderer(hotInstance, TD, row, col, prop, value, cellProperties) {
  textRenderer.apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);
}

intlDateRenderer.valueFormatter = valueFormatter;
intlDateRenderer.RENDERER_TYPE = RENDERER_TYPE;
