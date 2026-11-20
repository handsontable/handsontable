import { type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { MenuSeparatorRolePage, CONTEXT_MENU, DROPDOWN_MENU } from './MenuSeparatorRolePage';

export { CONTEXT_MENU, DROPDOWN_MENU };

/**
 * Page Object for the menu focus return fixture.
 *
 * It reuses the menu helpers of the separator page object (opening a menu by keyboard, reading a
 * menu's rows, moving the menu selection) and adds what a focus check needs: the cell that holds the
 * grid's selection, a control outside the grid, and the selection and editor state that prove a key
 * did only what it should.
 */
export class MenuFocusReturnPage extends MenuSeparatorRolePage {
  /**
   * Load the fixture and build the grid.
   *
   * @param {boolean} [ariaTags] The `ariaTags` setting.
   */
  override async goto(ariaTags = true): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/menu-focus-return.html?theme=${this.theme}&bundle=${this.bundle}`);
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
   * A text field outside the grid, which a click or a hook listener can move the focus to.
   */
  get outside(): Locator {
    return this.page.getByTestId('outside');
  }

  /**
   * The cell that holds the grid's selection. The grid keeps the browser focus on it while it
   * listens for keys.
   */
  get highlightedCell(): Locator {
    return this.grid.locator('.ht_master td.current');
  }

  /**
   * Select a cell by the API, which also makes the grid listen for keys, and wait for it.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  async selectCellAt(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      (window as unknown as { hot: { selectCell: (row: number, col: number) => void } }).hot.selectCell(r, c);
    }, [row, col]);
    await expect(this.cell(row, col)).toHaveClass(/\bcurrent\b/);
    await expect(this.cell(row, col)).toBeFocused();
  }

  /**
   * Open the context menu with Shift+F10 on a cell.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  async openContextMenuAt(row: number, col: number): Promise<void> {
    await this.selectCellAt(row, col);
    await this.page.keyboard.press('Shift+F10');
    await expect(this.menu(CONTEXT_MENU)).toBeVisible();
    await expect(this.highlightedItem(CONTEXT_MENU)).toBeFocused();
  }

  /**
   * Open the column menu with Shift+Alt+ArrowDown on a cell.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  async openDropdownMenuAt(row: number, col: number): Promise<void> {
    await this.selectCellAt(row, col);
    await this.page.keyboard.press('Shift+Alt+ArrowDown');
    await expect(this.menu(DROPDOWN_MENU)).toBeVisible();
    await expect(this.highlightedItem(DROPDOWN_MENU)).toBeFocused();
  }

  /**
   * Run a listener after the context menu hides that moves the focus to the outside field, the way
   * an application would.
   */
  async focusOutsideAfterContextMenuHide(): Promise<void> {
    await this.page.evaluate(() => {
      const hot = (window as unknown as {
        hot: { addHook: (name: string, callback: () => void) => void };
      }).hot;

      hot.addHook('afterContextMenuHide', () => document.getElementById('outside')?.focus());
    });
  }

  /**
   * The grid's last selection range as `[row, col, row2, col2]`.
   */
  async selection(): Promise<number[] | undefined> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { getSelectedLast: () => number[] | undefined };
    }).hot.getSelectedLast());
  }

  /**
   * Whether a cell editor is open.
   */
  async editorOpened(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { getActiveEditor: () => { isOpened: () => boolean } | undefined };
    }).hot.getActiveEditor()?.isOpened() ?? false);
  }
}
