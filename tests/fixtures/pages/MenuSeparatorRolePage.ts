import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * The ARIA a menu row carries, read off its `<td>`.
 */
export interface MenuRowAria {
  separator: boolean;
  text: string;
  role: string | null;
  ariaLabel: string | null;
  tabindex: string | null;
  ariaDisabled: string | null;
  ariaExpanded: string | null;
  ariaChecked: string | null;
}

/**
 * The menus this fixture opens, by the class of the container each one renders into.
 */
export const CONTEXT_MENU = '.htContextMenu';
export const DROPDOWN_MENU = '.htDropdownMenu';
export const ALIGNMENT_SUBMENU = '.htContextMenuSub_Alignment';

/**
 * Page Object for the menu separator fixture.
 *
 * Every menu is opened and walked with the keyboard only. The rows are read from the menu's own
 * table: the menu is a Handsontable instance rendered into a body-level portal, outside the grid.
 */
export class MenuSeparatorRolePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;

  /**
   * The fixture file name in `tests/fixtures/demo/`, without the extension. Subclasses that need
   * another grid setup override it.
   */
  protected readonly fixture: string = 'menu-separator-role';

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Load the fixture and build the grid with the given `ariaTags` value.
   *
   * @param {boolean} [ariaTags] The `ariaTags` setting.
   */
  async goto(ariaTags = true): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/${this.fixture}.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await this.page.evaluate((value) => {
      (window as unknown as { buildGrid: (ariaTags: boolean) => void }).buildGrid(value);
    }, ariaTags);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.cell(1, 1)).toBeVisible();
  }

  /**
   * A data cell in the master overlay.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The open menu's own table, by the menu container's class.
   *
   * @param {string} menuSelector The menu container selector.
   */
  menu(menuSelector: string): Locator {
    return this.page.locator(`${menuSelector} > .ht_master:visible table.htCore`).first();
  }

  /**
   * Select cell (1, 1) by the API, which also makes the grid listen for keys, and wait for it.
   */
  async selectCell(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { hot: { selectCell: (row: number, col: number) => void } }).hot.selectCell(1, 1);
    });
    await expect(this.cell(1, 1)).toHaveClass(/\bcurrent\b/);
  }

  /**
   * Open the context menu with Shift+F10 on the selected cell.
   */
  async openContextMenuByKeyboard(): Promise<void> {
    await this.selectCell();
    await this.page.keyboard.press('Shift+F10');
    await expect(this.menu(CONTEXT_MENU)).toBeVisible();
  }

  /**
   * Open the column menu with Shift+Alt+ArrowDown on the selected cell.
   */
  async openDropdownMenuByKeyboard(): Promise<void> {
    await this.selectCell();
    await this.page.keyboard.press('Shift+Alt+ArrowDown');
    await expect(this.menu(DROPDOWN_MENU)).toBeVisible();
  }

  /**
   * From the open context menu, move to "Alignment" with the arrow keys and open its submenu with
   * ArrowRight.
   */
  async openAlignmentSubmenuByKeyboard(): Promise<void> {
    await this.moveTo(CONTEXT_MENU, 'Alignment');
    await this.page.keyboard.press('ArrowRight');
    await expect(this.menu(ALIGNMENT_SUBMENU)).toBeVisible();
  }

  /**
   * The row the menu's keyboard selection is on.
   *
   * @param {string} menuSelector The menu container selector.
   */
  highlightedItem(menuSelector: string): Locator {
    return this.menu(menuSelector).locator(':scope > tbody > tr > td.current');
  }

  /**
   * Press a key until the menu's keyboard selection sits on the item with the given visible text.
   * Bounded by the number of rows, so a selection that never gets there fails instead of looping.
   *
   * @param {string} menuSelector The menu container selector.
   * @param {string} label The item's visible text.
   * @param {string} key The key to press.
   */
  async moveTo(menuSelector: string, label: string, key = 'ArrowDown'): Promise<void> {
    const rows = await this.menu(menuSelector).locator(':scope > tbody > tr').count();

    for (let step = 0; step <= rows; step++) {
      if ((await this.highlightedItem(menuSelector).textContent())?.trim() === label) {
        return;
      }

      await this.page.keyboard.press(key);
    }

    await expect(this.highlightedItem(menuSelector)).toHaveText(label);
  }

  /**
   * Every row of the open menu with its ARIA, top to bottom.
   *
   * @param {string} menuSelector The menu container selector.
   */
  async rows(menuSelector: string): Promise<MenuRowAria[]> {
    return this.menu(menuSelector).evaluate(table => Array.from(
      table.querySelectorAll(':scope > tbody > tr > td'),
      cell => ({
        separator: cell.classList.contains('htSeparator'),
        text: (cell.textContent ?? '').trim(),
        role: cell.getAttribute('role'),
        ariaLabel: cell.getAttribute('aria-label'),
        tabindex: cell.getAttribute('tabindex'),
        ariaDisabled: cell.getAttribute('aria-disabled'),
        ariaExpanded: cell.getAttribute('aria-expanded'),
        ariaChecked: cell.getAttribute('aria-checked'),
      })));
  }

  /**
   * The visible text of the row directly below the first separator that follows the item with the
   * given text.
   *
   * @param {string} menuSelector The menu container selector.
   * @param {string} above The visible text of the item right above a separator.
   */
  async neighborBelowSeparator(menuSelector: string, above: string): Promise<string> {
    const rows = await this.rows(menuSelector);
    const index = rows.findIndex(row => row.text === above);

    expect(index).toBeGreaterThanOrEqual(0);
    expect(rows[index + 1]?.separator).toBe(true);

    return rows[index + 2].text;
  }
}
