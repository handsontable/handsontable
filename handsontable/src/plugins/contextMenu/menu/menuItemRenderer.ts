import {
  isItemSubMenu,
  isItemDisabled,
  isItemSelectionDisabled,
  isItemSeparator,
  isItemCheckable,
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

/**
 * Creates the menu renderer function.
 *
 * @private
 * @param {Core} mainTableHot The main table Handsontable instance.
 * @returns {Function}
 */
export function createMenuItemRenderer(mainTableHot: Record<string, unknown>) {
  const hot = mainTableHot as Record<string, Function>;

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
    menuHot: Record<string, Function>, TD: HTMLTableCellElement, row: number, col: number,
    prop: string, value: unknown, cellProperties: Record<string, unknown>
  ) => {
    const item = menuHot.getSourceDataAtRow(row);
    const wrapper = (hot.rootDocument as unknown as Document).createElement('div');
    const itemValue = typeof value === 'function' ? value.call(mainTableHot) : value;
    const ariaLabel = typeof item.ariaLabel === 'function' ? item.ariaLabel.call(mainTableHot) : item.ariaLabel;
    const ariaChecked = typeof item.ariaChecked === 'function' ? item.ariaChecked.call(mainTableHot) : item.ariaChecked;

    cellProperties.readOnlyCellClassName = '';

    empty(TD);
    addClass(wrapper, 'htItemWrapper');

    if (hot.getSettings().ariaTags) {
      const isFocusable = !isItemDisabled(item, mainTableHot) &&
        !isItemSelectionDisabled(item) &&
        !isItemSeparator(item);

      setAttribute(TD, [
        ...(isItemCheckable(item) ? [
          A11Y_MENU_ITEM_CHECKBOX(),
          A11Y_LABEL(ariaLabel),
          A11Y_CHECKED(ariaChecked)
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

    } else if (typeof item.renderer === 'function') {
      addClass(TD, 'htCustomMenuRenderer');
      TD.appendChild(
        ((item as { renderer: (...args: unknown[]) => HTMLElement }).renderer)(
          menuHot, wrapper, row, col, prop, itemValue
        )
      );

    } else {
      fastInnerHTML(
        wrapper, String(itemValue), (hot.getSettings() as { sanitizer?: (html: string) => string }).sanitizer
      );
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
