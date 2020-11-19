import { fastInnerHTML } from '../../helpers/dom/element';
import { getRenderer } from '../index';
import { RENDERER_TYPE as BASE_RENDERER_TYPE } from '../baseRenderer';

/**
 * @private
 * @param {Core} instance The Handsontable instance.
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {number|string} prop The column property (passed when datasource is an array of objects).
 * @param {*} value The rendered value.
 * @param {object} cellProperties The cell meta object ({@see Core#getCellMeta}).
 */
export default function htmlRenderer(instance, TD, row, col, prop, value, cellProperties) {
  getRenderer(BASE_RENDERER_TYPE).apply(this, [instance, TD, row, col, prop, value, cellProperties]);

  fastInnerHTML(TD, value === null || value === void 0 ? '' : value, false);
}
