import { textRenderer } from '../textRenderer';
import { fastInnerHTML } from '../../helpers/dom/element';
import { rangeEach } from '../../helpers/number';

export const RENDERER_TYPE = 'password';

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
export function passwordRenderer(hotInstance, TD, row, col, prop, value, cellProperties) {
  textRenderer.apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);

  const hashLength = cellProperties.hashLength || TD.innerHTML.length;
  const hashSymbol = cellProperties.hashSymbol || '*';

  let hash = '';

  rangeEach(hashLength - 1, () => {
    hash += hashSymbol;
  });
  fastInnerHTML(TD, hash);
}

passwordRenderer.RENDERER_TYPE = RENDERER_TYPE;
