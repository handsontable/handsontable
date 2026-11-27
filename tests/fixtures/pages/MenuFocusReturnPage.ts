import { type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { MenuSeparatorRolePage, CONTEXT_MENU, DROPDOWN_MENU } from './MenuSeparatorRolePage';

export { CONTEXT_MENU, DROPDOWN_MENU };

/**
 * Every armed Tab entry of a focus scope: a catcher or the grid root, both of which name their focus source.
 */
export const ARMED_TAB_ENTRIES = '[data-ht-focus-source][tabindex="0"]';

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
   * The Tab entries a Tab can land on: the hidden catchers around a focus scope that are armed
   * (`tabindex="0"`), and the grid's root element while it is armed as the entry from above (it then
   * carries `tabindex="0"` and `data-ht-focus-source`). A disarmed catcher carries `tabindex="-1"`, and a
   * disarmed root carries neither attribute.
   */
  get armedFocusCatchers(): Locator {
    return this.page.locator(ARMED_TAB_ENTRIES);
  }

  /**
   * Builds a second root grid on the page, with its own menus and focus scopes, and returns its container.
   *
   * @returns {Locator} The second grid's container.
   */
  async buildSecondGrid(): Promise<Locator> {
    await this.page.evaluate(() => {
      const host = document.createElement('div');

      host.setAttribute('data-testid', 'second-grid');
      document.body.appendChild(host);
      const win = window as any;

      win.secondHot = new win.Handsontable(host, {
        data: [['x', 'y'], ['z', 'w']],
        width: 300,
        height: 120,
        contextMenu: true,
        licenseKey: win.htTestLicenseKey,
      });
    });

    return this.page.getByTestId('second-grid');
  }

  /**
   * Opens the context menu through the API at a point and, once it shows, closes it through the API,
   * with no cell selected: the close sends the page neither a focus event nor a click.
   */
  async openAndCloseContextMenuThroughApi(): Promise<void> {
    await this.page.evaluate(() => {
      const { hot } = window as any;

      hot.deselectCell();
      hot.getPlugin('contextMenu').open({ top: 60, left: 60 });
    });
    await expect(this.menu(CONTEXT_MENU)).toBeVisible();
    await this.page.evaluate(() => {
      (window as any).hot.getPlugin('contextMenu').close();
    });
    await expect(this.menu(CONTEXT_MENU)).toBeHidden();
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
   * Open the context menu with a right click on a cell. The menu container takes the focus, not a menu
   * cell, until a key moves the menu selection.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  async openContextMenuByMouse(row: number, col: number): Promise<void> {
    await this.cell(row, col).click({ button: 'right' });
    await expect(this.menu(CONTEXT_MENU)).toBeVisible();
  }

  /**
   * Open the column menu with a click on the dropdown button of a column header.
   *
   * @param {number} col The visual column index.
   */
  async openDropdownMenuByMouse(col: number): Promise<void> {
    await this.grid.locator('.ht_clone_top .changeType').nth(col).click();
    await expect(this.menu(DROPDOWN_MENU)).toBeVisible();
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
   * Record, inside the `afterContextMenuHide` hook, the test id of the element that holds the focus.
   */
  async recordFocusAtContextMenuHide(): Promise<void> {
    await this.page.evaluate(() => {
      const win = window as unknown as {
        hot: { addHook: (name: string, callback: () => void) => void };
        focusAtHide?: string | null;
      };

      win.hot.addHook('afterContextMenuHide', () => {
        win.focusAtHide = document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName;
      });
    });
  }

  /**
   * What `recordFocusAtContextMenuHide()` recorded: the test id (or tag) of the focused element.
   */
  async focusAtContextMenuHide(): Promise<string | undefined> {
    return this.page.evaluate(() => (window as unknown as { focusAtHide?: string }).focusAtHide);
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
