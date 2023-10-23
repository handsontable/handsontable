import { createPaginator } from '../../../utils/paginator';
import {
  isSeparator,
  isDisabled,
  isSelectionDisabled,
} from './utils';

/**
 * Creates navigator for menus and submenus.
 *
 * @param {Handsontable} hotMenu The Handsontable instance of the menu.
 * @returns {Paginator}
 */
export function createMenuNavigator(hotMenu) {
  return createPaginator({
    size: () => hotMenu.countRows(),
    onItemSelect(currentItem, directItemChange) {
      const cell = hotMenu.getCell(currentItem, 0);

      if (!cell || isSeparator(cell) || isDisabled(cell) || isSelectionDisabled(cell)) {
        return false;
      }

      hotMenu.selectCell(currentItem, 0, ...(directItemChange ? [currentItem, 0, false, false] : []));
    },
    onClear() {
      hotMenu.deselectCell();
    }
  });
}
