import { htmlRenderer } from '../htmlRenderer';
import { textRenderer } from '../textRenderer';
import { CellCoords } from '../../3rdparty/walkontable/src';
import EventManager from '../../eventManager';
import { addClass, hasClass } from '../../helpers/dom/element';

import './autocompleteRenderer.css';

export const RENDERER_TYPE = 'autocomplete';

/**
 * Autocomplete renderer.
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
export function autocompleteRenderer(instance, TD, row, col, prop, value, cellProperties) {
  const { rootDocument } = instance;
  const rendererFunc = cellProperties.allowHtml ? htmlRenderer : textRenderer;
  const ARROW = rootDocument.createElement('DIV');

  ARROW.className = 'htAutocompleteArrow';
  ARROW.appendChild(rootDocument.createTextNode(String.fromCharCode(9660)));

  rendererFunc.apply(this, [instance, TD, row, col, prop, value, cellProperties]);

  if (!TD.firstChild) { // http://jsperf.com/empty-node-if-needed
    // otherwise empty fields appear borderless in demo/renderers.html (IE)
    TD.appendChild(rootDocument.createTextNode(String.fromCharCode(160))); // workaround for https://github.com/handsontable/handsontable/issues/1946
    // this is faster than innerHTML. See: https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
  }

  TD.insertBefore(ARROW, TD.firstChild);
  addClass(TD, 'htAutocomplete');

  if (!instance.acArrowListener) {
    const eventManager = new EventManager(instance);

    // not very elegant but easy and fast
    instance.acArrowListener = function(event) {
      if (hasClass(event.target, 'htAutocompleteArrow')) {
        instance.view.wt.getSetting('onCellDblClick', null, new CellCoords(row, col), TD);
      }
    };

    eventManager.addEventListener(instance.rootElement, 'mousedown', instance.acArrowListener);

    // We need to unbind the listener after the table has been destroyed
    instance.addHookOnce('afterDestroy', () => {
      eventManager.destroy();
    });
  }
}

autocompleteRenderer.RENDERER_TYPE = RENDERER_TYPE;
