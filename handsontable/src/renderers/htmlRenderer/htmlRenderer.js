import { baseRenderer } from '../baseRenderer';
import { fastInnerHTML } from '../../helpers/dom/element';

export const RENDERER_TYPE = 'html';

/**
 * @private
 * @param {Core} hotInstance The Handsontable instance.
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {number|string} prop The column property (passed when datasource is an array of objects).
 * @param {*} value The rendered value.
 * @param {object} cellProperties The cell meta object (see {@link Core#getCellMeta}).
 */
export function htmlRenderer(hotInstance, TD, row, col, prop, value, cellProperties) {
  baseRenderer.apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);

  fastInnerHTML(TD, value === null || value === undefined ? '' : value, false);
}

htmlRenderer.RENDERER_TYPE = RENDERER_TYPE;
