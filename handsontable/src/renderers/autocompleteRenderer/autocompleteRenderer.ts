import type { HotInstance } from '../../core/types';
import type { CellProperties } from '../../settings';
import { htmlRenderer } from '../htmlRenderer';
import { textRenderer } from '../textRenderer';
import EventManager from '../../eventManager';
import { addClass, eventTargetEl, hasClass } from '../../helpers/dom/element';
import { isLeftClick } from '../../helpers/dom/event';
import { A11Y_HIDDEN } from '../../helpers/a11y';

export const RENDERER_TYPE: 'autocomplete' = 'autocomplete';

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
export function autocompleteRenderer(
  this: unknown,
  hotInstance: HotInstance, TD: HTMLTableCellElement, row: number, col: number,
  prop: string | number, value: unknown, cellProperties: CellProperties): void {
  const { rootDocument } = hotInstance;
  const rendererFunc = cellProperties.allowHtml ? htmlRenderer : textRenderer;
  const ARROW = rootDocument.createElement('DIV');
  const isAriaEnabled = hotInstance.getSettings().ariaTags;

  ARROW.className = 'htAutocompleteArrow';

  if (isAriaEnabled) {
    ARROW.setAttribute(...A11Y_HIDDEN());
  }

  ARROW.appendChild(rootDocument.createTextNode(String.fromCharCode(9660)));

  (rendererFunc as (this: unknown, ...args: unknown[]) => void)
    .apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);

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
    hotInstance.acArrowListener = function(event: Event) {
      // Only the left button opens the list. Walkontable applies the same button check to its own
      // double-click-to-open path, and without it a right-click on the arrow opens the editor
      // alongside the context menu. Walkontable pairs that check with a `touchApplied` escape
      // hatch; this path needs none, because a tap reaches it only as a compatibility `mousedown`,
      // which carries `button === 0` like any other left press.
      if (isLeftClick(event) && hasClass(eventTargetEl(event)!, 'htAutocompleteArrow')) {
        // The `null` event is load-bearing, not laziness: `EditorManager#openEditor` only applies
        // its "no editor for a multi-cell selection" default when the event is a `MouseEvent`, so
        // forwarding the real one here would stop the arrow from opening the list after a
        // shift-drag range. Changing that is a behavior change, not a cleanup.
        hotInstance.view._wt.getSetting('onCellDblClick', null, hotInstance._createCellCoords(row, col), TD);
      }
    };

    eventManager.addEventListener(hotInstance.rootElement, 'mousedown', hotInstance.acArrowListener as EventListener);

    // We need to unbind the listener after the table has been destroyed
    hotInstance.addHookOnce('afterDestroy', () => {
      eventManager.destroy();
    });
  }
}

autocompleteRenderer.RENDERER_TYPE = RENDERER_TYPE;
