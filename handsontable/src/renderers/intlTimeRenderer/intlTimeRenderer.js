import { textRenderer } from '../textRenderer';
import { isEmpty } from '../../helpers/mixed';
import { isObject } from '../../helpers/object';
import { BAD_VALUE_TEXT } from '../../helpers/constants';
import { parseToLocalTime } from '../../helpers/dateTime';

export const RENDERER_TYPE = 'intl-time';

const DEFAULT_INTL_FORMAT = {
  hour: 'numeric',
  minute: '2-digit',
};

/**
 * Formats the value using the date format.
 *
 * @param {*} value Value to be formatted.
 * @param {CellMeta} cellProperties Cell meta object.
 * @returns {*} Returns the rendered value.
 */
export function valueFormatter(value, cellProperties) {
  const { timeFormat, locale, allowEmpty } = cellProperties;

  if (isEmpty(value)) {
    return allowEmpty ? value : BAD_VALUE_TEXT;
  }

  const time = parseToLocalTime(value);

  if (time === null) {
    return BAD_VALUE_TEXT;
  }

  const intlFormat = isObject(timeFormat) ? timeFormat : DEFAULT_INTL_FORMAT;

  return new Intl.DateTimeFormat(locale, intlFormat).format(time);
}

/**
 * Default intlTime renderer.
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
export function intlTimeRenderer(hotInstance, TD, row, col, prop, value, cellProperties) {
  textRenderer.apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);

  TD.dir = 'ltr';
}

intlTimeRenderer.RENDERER_TYPE = RENDERER_TYPE;
