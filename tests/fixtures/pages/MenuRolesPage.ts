import { type Locator } from '@playwright/test';
import { MenuSeparatorRolePage } from './MenuSeparatorRolePage';

/**
 * The ARIA one overlay of a menu's own grid carries: the master table or one of its clones.
 */
export interface MenuOverlayAria {
  overlay: string;
  holderTabindex: string | null;
  table: string | null;
  thead: string | null;
  tbody: string | null;
  rows: Array<string | null>;
}

/**
 * Page Object for the menu roles spec, on the menu separator fixture: a grid with the context menu and
 * the column menu on their default items, built with either `ariaTags` value.
 *
 * A menu is a Handsontable instance rendered into a body-level portal. Its own table is read through
 * child combinators from the menu container, so a grid nested in a menu cell is never read as the
 * menu's own.
 */
export class MenuRolesPage extends MenuSeparatorRolePage {
  /**
   * An open menu, by its role and accessible name.
   *
   * @param {string} name The accessible name of the menu.
   * @returns {Locator} The menu.
   */
  menuNamed(name: string): Locator {
    return this.page.getByRole('menu', { name, exact: true });
  }

  /**
   * The container of an open menu, by its class, without the ghost table the grid measures it with.
   *
   * @param {string} menuSelector The menu container selector.
   * @returns {Locator} The menu container.
   */
  container(menuSelector: string): Locator {
    return this.page.locator(`${menuSelector}:not(.htGhostTable):visible`).first();
  }

  /**
   * The ARIA of the menu's own table markup, one entry per overlay (the master and each clone): the
   * holder's `tabindex`, and the roles of the table, its head, its body, and every row.
   *
   * @param {string} menuSelector The menu container selector.
   * @returns {Promise<MenuOverlayAria[]>} The overlays, in DOM order.
   */
  async ownTableAria(menuSelector: string): Promise<MenuOverlayAria[]> {
    return this.container(menuSelector).evaluate(container => Array.from(
      container.querySelectorAll(':scope > [class*="ht_master"], :scope > [class*="ht_clone"]'),
      (overlay) => {
        const table = overlay.querySelector(':scope > .wtHolder table.htCore');

        return {
          overlay: overlay.className.split(' ')[0],
          holderTabindex: overlay.querySelector(':scope > .wtHolder')?.getAttribute('tabindex') ?? null,
          table: table?.getAttribute('role') ?? null,
          thead: table?.querySelector(':scope > thead')?.getAttribute('role') ?? null,
          tbody: table?.querySelector(':scope > tbody')?.getAttribute('role') ?? null,
          rows: Array.from(table?.querySelectorAll(':scope > tbody > tr') ?? [], row => row.getAttribute('role')),
        };
      }));
  }

  /**
   * The element that holds the browser focus.
   *
   * @returns {Locator} The focused element.
   */
  focused(): Locator {
    return this.page.locator(':focus');
  }
}
