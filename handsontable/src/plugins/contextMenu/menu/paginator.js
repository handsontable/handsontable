import { createPaginator } from '../../../utils/paginator';
import {
  isSeparator,
  isDisabled,
  isSelectionDisabled,
} from './utils';

/**
 * Creates paginator for menus and submenus.
 *
 * @param {Handsontable} hotMenu The Handsontable instance of the menu.
 * @returns {Paginator}
 */
export function createMenuPaginator(hotMenu) {
  return createPaginator({
    size: () => hotMenu.countRows(),
    onPageChange: (currentPage, directPageChange) => {
      const cell = hotMenu.getCell(currentPage, 0);

      if (!cell || isSeparator(cell) || isDisabled(cell) || isSelectionDisabled(cell)) {
        return false;
      }

      if (directPageChange) {
        hotMenu.selectCell(currentPage, 0, currentPage, 0, false, false);
      } else {
        hotMenu.selectCell(currentPage, 0);
      }
    }
  });
}
