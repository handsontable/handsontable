import { autocompleteRenderer } from '../autocompleteRenderer';

export const RENDERER_TYPE = 'date';

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
  autocompleteRenderer.apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);
}

dateRenderer.RENDERER_TYPE = RENDERER_TYPE;
