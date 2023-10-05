import {
  isItemSubMenu,
  isItemDisabled,
  isItemSelectionDisabled,
  isItemSeparator,
} from './utils';
import {
  addClass,
  empty,
  fastInnerHTML,
  setAttribute,
} from '../../../helpers/dom/element';
import {
  A11Y_DISABLED,
  A11Y_EXPANDED,
  A11Y_LABEL,
  A11Y_MENU_ITEM
} from '../../../helpers/a11y';

/**
   * Menu item renderer.
   *
   * @private
   * @param {Core} menuHot The Handsontable instance.
   * @param {HTMLCellElement} TD The rendered cell element.
   * @param {number} row The visual index.
   * @param {number} col The visual index.
   * @param {string} prop The column property if used.
   * @param {string} value The cell value.
   */
export function createMenuItemRenderer(mainTableHot) {
  return (menuHot, TD, row, col, prop, value, cellMeta) => {
    if (TD.hasAttribute('ghost-table')) {
      return;
    }

    const item = menuHot.getSourceDataAtRow(row);
    const wrapper = mainTableHot.rootDocument.createElement('div');
    const itemValue = typeof value === 'function' ? value.call(mainTableHot) : value;

    empty(TD);
    addClass(wrapper, 'htItemWrapper');

    if (mainTableHot.getSettings().ariaTags) {
      setAttribute(TD, [
        A11Y_MENU_ITEM(),
        A11Y_LABEL(itemValue),
        ...(isItemDisabled(item, mainTableHot) ? [A11Y_DISABLED()] : []),
        ...(isItemSubMenu(item) ? [A11Y_EXPANDED(false)] : []),
      ]);
    }

    TD.className = '';
    TD.appendChild(wrapper);

    if (isItemSeparator(item)) {
      addClass(TD, 'htSeparator');

    } else if (typeof item.renderer === 'function') {

      if (!cellMeta.__rendered) {
        // cellMeta.__rendered = true;
        addClass(TD, 'htCustomMenuRenderer');
        TD.appendChild(item.renderer(menuHot, wrapper, row, col, prop, itemValue));
      }

    } else {
      fastInnerHTML(wrapper, itemValue);
    }

    if (isItemDisabled(item, mainTableHot)) {
      addClass(TD, 'htDisabled');

    } else if (isItemSelectionDisabled(item)) {
      addClass(TD, 'htSelectionDisabled');

    } else if (isItemSubMenu(item)) {
      addClass(TD, 'htSubmenu');
    }

    addClass(TD, cellMeta.className);
  }
}
