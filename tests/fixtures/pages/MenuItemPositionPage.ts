import { type Locator, expect } from '@playwright/test';
import { DROPDOWN_MENU, MenuSeparatorRolePage } from './MenuSeparatorRolePage';
import { chooseConditionWithKeyboard } from './filtersMenuKeyboard';

/**
 * The position ARIA a menu row carries, read off its `<td>`.
 */
export interface MenuRowPosition {
  separator: boolean;
  text: string;
  role: string | null;
  posinset: string | null;
  setsize: string | null;
}

/**
 * Every rendered row of a menu with its position ARIA, top to bottom, read in one evaluation of the
 * menu grid's own table, so a re-render between two reads cannot mix two draws.
 *
 * @param {Locator} table The menu grid's master `table.htCore`.
 * @returns {Promise<MenuRowPosition[]>} The rows.
 */
export async function menuRowPositions(table: Locator): Promise<MenuRowPosition[]> {
  return table.evaluate(element => Array.from(
    element.querySelectorAll(':scope > tbody > tr > td'),
    cell => ({
      separator: cell.classList.contains('htSeparator'),
      text: (cell.textContent ?? '').trim(),
      role: cell.getAttribute('role'),
      posinset: cell.getAttribute('aria-posinset'),
      setsize: cell.getAttribute('aria-setsize'),
    })));
}

/**
 * Page Object for the menu item position spec: a grid with the context menu, the column menu and
 * Filters on their default items, built with either `ariaTags` value.
 *
 * Every menu is opened and walked with the keyboard. The rows are read from the menu's own table,
 * which holds only the rows the menu grid renders: a row the Filters plugin hides is not drawn.
 */
export class MenuItemPositionPage extends MenuSeparatorRolePage {
  protected override readonly fixture = 'menu-item-position';

  /**
   * Every rendered row of the open menu with its position ARIA, top to bottom.
   *
   * @param {string} menuSelector The menu container selector.
   * @returns {Promise<MenuRowPosition[]>} The rows.
   */
  async positions(menuSelector: string): Promise<MenuRowPosition[]> {
    return menuRowPositions(this.menu(menuSelector));
  }

  /**
   * In the open column menu, choose a condition in the first "Filter by condition" select from the
   * keyboard: Tab moves the focus from the menu to the select, and the shared walk picks the condition.
   * The column menu stays open, so Filters shows or hides its second condition and the operators on
   * the menu as it is drawn, through `hiddenRows` and `hotMenu.render()`.
   *
   * @param {string} label The condition's visible label, e.g. `Begins with`.
   * @param {'Tab' | 'Shift+Tab'} focusKey The key that moves the focus to the select: Tab from the
   * menu's items, Shift+Tab from the value input a chosen condition hands the focus to.
   */
  async chooseFirstConditionWithKeyboard(label: string, focusKey: 'Tab' | 'Shift+Tab'): Promise<void> {
    const conditionSelect = this.menu(DROPDOWN_MENU).locator('.htFiltersMenuCondition .htUISelect').first();

    await this.page.keyboard.press(focusKey);
    await expect(conditionSelect).toBeFocused();
    await chooseConditionWithKeyboard(this.page, this.page.locator('.htFiltersConditionsMenu:visible'), label);
    await expect(this.menu(DROPDOWN_MENU)).toBeVisible();
  }

  /**
   * The number of items the open menu numbers, read from its first item's `aria-setsize`, or `null`
   * while no item carries one.
   *
   * @param {string} menuSelector The menu container selector.
   * @returns {Promise<number | null>} The set size.
   */
  async setSize(menuSelector: string): Promise<number | null> {
    const size = await this.menu(menuSelector).locator('td[aria-setsize]').first().getAttribute('aria-setsize');

    return size === null ? null : Number(size);
  }

  /**
   * The highlighted item of the open menu.
   *
   * @param {string} menuSelector The menu container selector.
   * @returns {Locator} The highlighted item.
   */
  current(menuSelector: string): Locator {
    return this.highlightedItem(menuSelector);
  }

  /**
   * Press ArrowDown in the open menu and wait for the highlight to leave the item it was on.
   *
   * @param {string} menuSelector The menu container selector.
   */
  async nextItem(menuSelector: string): Promise<void> {
    const before = await this.current(menuSelector).textContent();

    await this.page.keyboard.press('ArrowDown');
    await expect(this.current(menuSelector)).not.toHaveText(before ?? '');
  }
}
