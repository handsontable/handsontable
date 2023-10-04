import { textRenderer } from '../textRenderer';
import { A11Y_HASPOPUP } from '../../helpers/a11y';

export const RENDERER_TYPE = 'select';

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
export function selectRenderer(instance, TD, row, col, prop, value, cellProperties) {
  textRenderer.apply(this, [instance, TD, row, col, prop, value, cellProperties]);

  if (instance.getSettings().ariaTags) {
    TD.setAttribute(...A11Y_HASPOPUP());
  }
}

selectRenderer.RENDERER_TYPE = RENDERER_TYPE;
