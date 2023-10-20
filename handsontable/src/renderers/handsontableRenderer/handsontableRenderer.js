import { autocompleteRenderer } from '../autocompleteRenderer';
import { A11Y_EXPANDED, A11Y_HASPOPUP } from '../../helpers/a11y';
import { setAttribute } from '../../helpers/dom/element';

export const RENDERER_TYPE = 'handsontable';

/**
 * Handsontable renderer.
 *
 * @private
 * @param {Core} instance The Handsontable instance.
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {number|string} prop The column property (passed when datasource is an array of objects).
 * @param {*} value The rendered value.
 * @param {object} cellProperties The cell meta object ({@see Core#getCellMeta}).
 */
export function handsontableRenderer(instance, TD, row, col, prop, value, cellProperties) {
  autocompleteRenderer.apply(this, [instance, TD, row, col, prop, value, cellProperties]);

  if (instance.getSettings().ariaTags) {
    setAttribute(TD, [
      A11Y_HASPOPUP('true'),
      A11Y_EXPANDED('false'),
    ]);
  }
}

handsontableRenderer.RENDERER_TYPE = RENDERER_TYPE;
