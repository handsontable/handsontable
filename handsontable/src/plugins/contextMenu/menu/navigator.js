import {
  isSeparator,
  isDisabled,
  isSelectionDisabled,
} from './utils';

/**
 * Helper class that supports navigating throughout the menu and submenus.
 *
 * @private
 * @class Navigator
 */
export class Navigator {
  /**
   * The instance of the Handsontable as menu.
   *
   * @type {Handsontable}
   */
  #hotMenu;
  /**
   * The index of the current selected menu item.
   *
   * @type {number}
   */
  #current = -1;
  /**
   * The index of the previously selected menu item.
   *
   * @type {number}
   */
  #prev = -1;
  /**
   * The collection of the already visited menu item indexes. The collection allows for preventing
   * infinite loops in cases when all menu items are disabled, or there is only one item available
   * and the navigation is triggered.
   *
   * @type {Set<number>}
   */
  #visited = new Set();

  /**
   * Sets the menu Handsontable instance.
   *
   * @param {Handsontable} hotMenu The menu Handsontable instance.
   */
  setMenu(hotMenu) {
    this.#hotMenu = hotMenu;
  }

  /**
   * Selects the first menu item in the menu.
   */
  selectFirst() {
    this.#visited.clear();
    this.#current = 0;
    this.#updateMenuSelection();
  }

  /**
   * Selects the last menu item in the menu.
   */
  selectLast() {
    this.#visited.clear();
    this.#current = this.#hotMenu.countRows() - 1;
    this.#updateMenuSelection();
  }

  /**
   * Selects the next menu item in the menu. The navigator tries to select the closes non-disabled menu
   * item. When all next items are disabled the first (or next non-disabled) menu item is selected.
   */
  selectNext() {
    this.#visited.clear();
    this.#current += 1;
    this.#updateMenuSelection();
  }

  /**
   * Selects the previous menu item in the menu. The navigator tries to select the closes non-disabled menu
   * item. When all previous items are disabled the last (or previous non-disabled) menu item is selected.
   */
  selectPrev() {
    this.#visited.clear();
    this.#current -= 1;
    this.#updateMenuSelection();
  }

  /**
   * Clears the internal state to the initial values.
   */
  clear() {
    this.#visited.clear();
    this.#prev = -1;
    this.#current = -1;
  }

  /**
   * Selects the menu based on the internal state of the class.
   */
  #updateMenuSelection() {
    const maxItems = this.#hotMenu.countRows() - 1;

    if (this.#current < 0) {
      this.#current = maxItems;
      this.#prev = maxItems;
    }
    if (this.#current > maxItems) {
      this.#current = 0;
      this.#prev = -1;
    }

    if (this.#visited.has(this.#current)) {
      return;
    }

    const cell = this.#hotMenu.getCell(this.#current, 0);

    this.#visited.add(this.#current);

    if (isSeparator(cell) || isDisabled(cell) || isSelectionDisabled(cell)) {
      this.#current += this.#current > this.#prev ? 1 : -1;
      this.#updateMenuSelection();

    } else {
      this.#hotMenu.selectCell(this.#current, 0);
    }

    this.#prev = this.#current;
  }
}
