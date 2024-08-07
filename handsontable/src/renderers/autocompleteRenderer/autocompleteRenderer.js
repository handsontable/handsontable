import { htmlRenderer } from '../htmlRenderer';
import { textRenderer } from '../textRenderer';
import EventManager from '../../eventManager';
import { addClass, hasClass } from '../../helpers/dom/element';

import { A11Y_HIDDEN } from '../../helpers/a11y';

export const RENDERER_TYPE = 'autocomplete';

/**
 * Autocomplete renderer.
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
export function autocompleteRenderer(hotInstance, TD, row, col, prop, value, cellProperties) {
  const { rootDocument } = hotInstance;
  const rendererFunc = cellProperties.allowHtml ? htmlRenderer : textRenderer;
  const ARROW = rootDocument.createElement('DIV');
  const isAriaEnabled = hotInstance.getSettings().ariaTags;

  ARROW.className = 'htAutocompleteArrow';

  if (isAriaEnabled) {
    ARROW.setAttribute(...A11Y_HIDDEN());
  }

  ARROW.appendChild(rootDocument.createTextNode(String.fromCharCode(9660)));

  rendererFunc.apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);

  if (!TD.firstChild) { // http://jsperf.com/empty-node-if-needed
    // otherwise empty fields appear borderless in demo/renderers.html (IE)
    TD.appendChild(rootDocument.createTextNode(String.fromCharCode(160))); // workaround for https://github.com/handsontable/handsontable/issues/1946
    // this is faster than innerHTML. See: https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
  }

  TD.insertBefore(ARROW, TD.firstChild);

  addClass(TD, 'htAutocomplete');

  if (!hotInstance.acArrowListener) {
    const eventManager = new EventManager(hotInstance);

    // not very elegant but easy and fast
    hotInstance.acArrowListener = function(event) {
      if (hasClass(event.target, 'htAutocompleteArrow')) {
        hotInstance.view._wt.getSetting('onCellDblClick', null, hotInstance._createCellCoords(row, col), TD);
      }
    };

    eventManager.addEventListener(hotInstance.rootElement, 'mousedown', hotInstance.acArrowListener);

    // We need to unbind the listener after the table has been destroyed
    hotInstance.addHookOnce('afterDestroy', () => {
      eventManager.destroy();
    });
  }
}

autocompleteRenderer.RENDERER_TYPE = RENDERER_TYPE;
