import type { HotInstance } from '../../../core/types';
import type { MenuItemLike } from './utils';
import {
  isItemSubMenu,
  isItemDisabled,
  isItemSelectionDisabled,
  isItemSeparator,
  isItemCheckable,
  getItemCheckedState,
  MENU_ITEM_MIXED,
} from './utils';
import {
  addClass,
  empty,
  fastInnerHTML,
  setAttribute,
} from '../../../helpers/dom/element';
import {
  A11Y_MENU_ITEM_CHECKBOX,
  A11Y_DISABLED,
  A11Y_EXPANDED,
  A11Y_LABEL,
  A11Y_MENU_ITEM,
  A11Y_TABINDEX,
  A11Y_CHECKED,
} from '../../../helpers/a11y';
import { getSanitizer } from '../../../utils/sanitizer';

/**
 * The mark a checked menu item is prefixed with. Kept as a character code, as the label string it
 * replaced was - see https://github.com/handsontable/handsontable/issues/1946.
 */
const CHECK_MARK = String.fromCharCode(10003);

/**
 * The mark a partly-checked menu item is prefixed with – an en dash, the conventional glyph for a
 * checkbox that is neither on nor off. Both marks are hidden by `font-size: 0` wherever the themes
 * paint the real one from an icon mask, so this is the text a bare, unthemed menu falls back to.
 */
const MIXED_MARK = String.fromCharCode(8211);

/**
 * Creates the menu renderer function.
 *
 * @private
 * @param {Core} mainTableHot The main table Handsontable instance.
 * @returns {Function}
 */
export function createMenuItemRenderer(mainTableHot: HotInstance) {
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
   * @param {object} cellProperties The cell meta object (see {@link Core#getCellMeta}).
   */
  return (
    menuHot: HotInstance, TD: HTMLTableCellElement, row: number, col: number,
    prop: string, value: unknown, cellProperties: Record<string, unknown>
  ) => {
    const item = menuHot.getSourceDataAtRow(row) as MenuItemLike;
    const wrapper = mainTableHot.rootDocument.createElement('div');
    const itemValue: string = (typeof value === 'function' ? value.call(mainTableHot) : value) as string;
    const ariaLabel: string = (typeof (item as Record<string, unknown>).ariaLabel === 'function'
      ? ((item as Record<string, unknown>).ariaLabel as (...args: unknown[]) => unknown).call(mainTableHot)
      : (item as Record<string, unknown>).ariaLabel) as string;
    const ariaChecked = (typeof (item as Record<string, unknown>).ariaChecked === 'function'
      ? ((item as Record<string, unknown>).ariaChecked as (...args: unknown[]) => unknown).call(mainTableHot)
      : (item as Record<string, unknown>).ariaChecked) as boolean | string | undefined;
    const checkedState = getItemCheckedState(item, mainTableHot);

    cellProperties.readOnlyCellClassName = '';

    empty(TD);
    addClass(wrapper, 'htItemWrapper');

    if (mainTableHot.getSettings().ariaTags) {
      const isFocusable = !isItemDisabled(item, mainTableHot) &&
        !isItemSelectionDisabled(item) &&
        !isItemSeparator(item);

      setAttribute(TD, [
        ...(isItemCheckable(item) ? [
          A11Y_MENU_ITEM_CHECKBOX(),
          A11Y_LABEL(ariaLabel ?? itemValue),
          A11Y_CHECKED(ariaChecked ?? checkedState)
        ] : [
          A11Y_MENU_ITEM(),
          A11Y_LABEL(itemValue)
        ]),
        ...(isFocusable ? [A11Y_TABINDEX(-1)] : []),
        ...(isItemDisabled(item, mainTableHot) ? [A11Y_DISABLED()] : []),
        ...(isItemSubMenu(item) ? [A11Y_EXPANDED(false)] : []),
      ]);
    }

    TD.className = '';
    TD.appendChild(wrapper);

    if (isItemSeparator(item)) {
      addClass(TD, 'htSeparator');

    } else if (typeof (item as Record<string, unknown>).renderer === 'function') {
      addClass(TD, 'htCustomMenuRenderer');
      TD.appendChild(
        ((item as { renderer: (...args: unknown[]) => HTMLElement }).renderer)(
          menuHot, wrapper, row, col, prop, itemValue
        )
      );

    } else {
      const itemStr = String(itemValue);

      fastInnerHTML(wrapper, itemStr, getSanitizer(mainTableHot), 'contextMenu', mainTableHot.rootElement);

      if (checkedState) {
        // Built here as a DOM node rather than baked into the label string by the item itself.
        // `fastInnerHTML` is a Trusted Types sink, so a label carrying the grid's own markup made
        // every checked item throw under `require-trusted-types-for 'script'` (DEV-2650).
        //
        // Added after the `fastInnerHTML` call, which replaces everything the wrapper holds - but
        // it goes FIRST in the DOM, so the rendered shape stays `[span, label]`.
        //
        // The mixed mark takes its own class rather than `selected` plus a modifier: `selected`
        // carries the check glyph's mask from the icons stylesheet, and is what the active-row
        // background matches on. A partly-on item is neither, so it opts out of both.
        const isMixed = checkedState === MENU_ITEM_MIXED;
        const checkMark = mainTableHot.rootDocument.createElement('span');

        checkMark.className = isMixed ? 'htMixed' : 'selected';
        checkMark.textContent = isMixed ? MIXED_MARK : CHECK_MARK;

        wrapper.insertBefore(checkMark, wrapper.firstChild);
      }
    }

    if (isItemDisabled(item, mainTableHot)) {
      addClass(TD, 'htDisabled');

    } else if (isItemSelectionDisabled(item)) {
      addClass(TD, 'htSelectionDisabled');

    } else if (isItemSubMenu(item)) {
      addClass(TD, 'htSubmenu');
    }
  };
}
