import { type Locator, expect } from '@playwright/test';
import { MenuSeparatorRolePage } from './MenuSeparatorRolePage';

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
    return this.menu(menuSelector).evaluate(table => Array.from(
      table.querySelectorAll(':scope > tbody > tr > td'),
      cell => ({
        separator: cell.classList.contains('htSeparator'),
        text: (cell.textContent ?? '').trim(),
        role: cell.getAttribute('role'),
        posinset: cell.getAttribute('aria-posinset'),
        setsize: cell.getAttribute('aria-setsize'),
      })));
  }

  /**
   * Set a "Begins with B" condition on column 1 through the API, so the column menu shows the second
   * condition and the operators, which Filters hides while the first condition is "None". Every value
   * of column 1 starts with "B", so no row is filtered out and the cell the menu opens on stays.
   */
  async addBeginsWithCondition(): Promise<void> {
    await this.page.evaluate(() => {
      const hot = (window as unknown as {
        hot: { getPlugin(name: string): { addCondition(col: number, name: string, args: unknown[]): void; filter(): void } };
      }).hot;
      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'begins_with', ['B']);
      filters.filter();
    });
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
