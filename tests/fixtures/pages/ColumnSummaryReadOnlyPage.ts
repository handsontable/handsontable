import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import './windowTypes';

/**
 * Page Object for the column summary read-only lock fixture (DEV-148).
 *
 * The ColumnSummary plugin makes a summary cell read-only, and the "Read only" menu item - one
 * item, shared by the context menu and the column (dropdown) menu - used to be able to unlock it.
 * The fixture holds a locked summary in column 0 (row 4), a `readOnly: false` summary in column 1
 * (row 4) as the control, and a column with no summary at all.
 */
export class ColumnSummaryReadOnlyPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture. The theme and bundle travel as query params so the fixture loads the
   * matching stylesheet and Handsontable build.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/column-summary-read-only.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);

    // Rethrow a constructor failure as itself, rather than as a cell that never appeared.
    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the master overlay.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * A column header in the top overlay clone. Headers render in more than one overlay, so the
   * test id is scoped to the clone the user actually sees.
   */
  header(col: number): Locator {
    return this.grid.locator('.ht_clone_top').getByTestId(`header-${col}`);
  }

  /**
   * A cell's resolved `readOnly` meta, coerced to a plain boolean (unset reads as `false`).
   */
  async readOnly(row: number, col: number): Promise<boolean> {
    return this.page.evaluate(
      ([r, c]) => Boolean(window.hot.getCellMeta(r, c).readOnly),
      [row, col],
    );
  }

  /**
   * The `readOnly` state of every cell in a column, top to bottom.
   */
  async columnReadOnly(col: number): Promise<boolean[]> {
    return this.page.evaluate(
      (c) => Array.from({ length: window.hot.countRows() }, (_, r) => Boolean(window.hot.getCellMeta(r, c).readOnly)),
      col,
    );
  }

  /**
   * Write a cell's `readOnly` meta through the public API.
   */
  async setReadOnly(row: number, col: number, value: boolean): Promise<void> {
    await this.page.evaluate(
      ({ row: r, col: c, value: v }) => window.hot.setCellMeta(r, c, 'readOnly', v),
      { row, col, value },
    );
  }

  /**
   * Insert rows above a visual row through the public API.
   */
  async insertRowAbove(row: number): Promise<void> {
    await this.page.evaluate(r => window.hot.alter('insert_row_above', r, 1), row);
  }

  /**
   * Right-click a data cell to open the context menu, and wait for it to be on screen.
   */
  async openContextMenuOnCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).click({ button: 'right' });
    await expect(this.openMenu()).toBeVisible();
  }

  /**
   * Right-click a column header to open the context menu over the whole column.
   */
  async openContextMenuOnHeader(col: number): Promise<void> {
    await this.header(col).click({ button: 'right' });
    await expect(this.openMenu()).toBeVisible();
  }

  /**
   * Open the column header's dropdown (column) menu, and wait for it to be on screen. Clicking the
   * button selects the whole column, the same selection a header right-click makes.
   */
  async openColumnMenu(col: number): Promise<void> {
    // The button is shown only while its header is hovered or selected, as it is for a user.
    await this.header(col).hover();
    await this.header(col).locator('.changeType').click();
    await expect(this.openMenu()).toBeVisible();
  }

  /**
   * Close whichever menu is open with Escape, and wait until it is gone.
   */
  async closeMenu(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.openMenus()).toHaveCount(0);
  }

  /**
   * The labels of the open menu's own visible rows.
   *
   * Read from the menu's own table only: a descendant `td` selector would also match a nested
   * Handsontable (the Filters value list) living inside one of the menu's cells.
   */
  async visibleItems(): Promise<string[]> {
    await expect(this.openMenu()).toBeVisible();

    return this.page.evaluate(() => {
      const menus = Array.from(document.querySelectorAll('.htContextMenu, .htDropdownMenu'))
        .filter(menu => (menu as HTMLElement).offsetParent !== null);
      const ownTable = menus[menus.length - 1]?.querySelector(':scope > .ht_master table.htCore');

      if (!ownTable) {
        return [];
      }

      return Array.from(ownTable.querySelectorAll(':scope > tbody > tr > td'))
        .filter(cell => cell.getBoundingClientRect().height > 0)
        // The check mark is a span inside the item, so strip a leading check or mixed glyph.
        .map(cell => (cell.textContent ?? '').replace(/^[✓–]/, '').trim())
        .filter(label => label.length > 0);
    });
  }

  /**
   * The "Read only" item's announced checked state (`aria-checked`) in the open menu.
   */
  async readOnlyItemChecked(): Promise<string | null> {
    return (await this.readOnlyItem()).getAttribute('aria-checked');
  }

  /**
   * Click the "Read only" item in whichever menu is open, and wait for the menu to close.
   */
  async clickReadOnlyItem(): Promise<void> {
    await (await this.readOnlyItem()).click();
    await expect(this.openMenus()).toHaveCount(0);
  }

  /**
   * Undo with the keyboard shortcut - the real user path, not the plugin API.
   */
  async undoWithKeyboard(): Promise<void> {
    await this.cell(0, 2).click();
    await this.page.keyboard.press('ControlOrMeta+z');
  }

  /**
   * Redo through the plugin API.
   */
  async redo(): Promise<void> {
    await this.page.evaluate(() => window.hot.getPlugin('undoRedo').redo());
  }

  /**
   * The "Read only" item's `<td>` in the open menu.
   */
  private async readOnlyItem(): Promise<Locator> {
    const item = this.openMenu().locator('td').filter({ hasText: /^\s*[✓–]?\s*Read only\s*$/ }).first();

    await expect(item).toBeVisible();

    return item;
  }

  /**
   * Every open menu, context or column.
   */
  private openMenus(): Locator {
    return this.page.locator('.htContextMenu:visible, .htDropdownMenu:visible');
  }

  /**
   * The most recently opened menu.
   */
  private openMenu(): Locator {
    return this.openMenus().last();
  }
}
