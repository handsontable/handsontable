import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

/**
 * What one menu item reports about its availability, read off the rendered DOM.
 */
export interface ItemAvailability {
  disabled: boolean;
  ariaDisabled: string | null;
}

type FixtureWindow = {
  selectRange: (row: number, col: number, row2: number, col2: number) => void;
  selectTwoLayers: () => void;
  mergeHiddenComment: () => void;
  commentOnMergeAnchor: () => void;
  commentAt: (row: number, col: number) => string | null;
  commentMetaWrites: unknown[];
};

/**
 * Page Object for the comment menu items fixture (DEV-263).
 *
 * "Delete comment" and "Read-only comment" act on every cell of the active selection range. These
 * queries read whether each is offered for a given selection, both as the `htDisabled` class the
 * menu skips on the keyboard and as the `aria-disabled` a screen reader announces.
 */
export class CommentsMenuItemsDisabledPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
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
      `/tests/fixtures/demo/comments-menu-items-disabled.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);

    // Rethrow a constructor failure as itself, rather than as a cell that never appeared.
    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the master overlay, scoped through the grid container.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The open context menu. Read as the last visible one, because the menu renders outside the grid.
   */
  menu(): Locator {
    return this.page.locator('.htContextMenu:visible').last();
  }

  /**
   * Right-click a data cell to open the context menu, and wait for it to be on screen.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  async openMenuOnCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).click({ button: 'right' });
    await expect(this.menu()).toBeVisible();
  }

  /**
   * Right-click a column header, which selects the whole column and opens the context menu on it.
   *
   * @param {number} col The visual column index.
   */
  async openMenuOnColumnHeader(col: number): Promise<void> {
    await this.grid.locator('.ht_clone_top thead th').nth(col + 1).click({ button: 'right' });
    await expect(this.menu()).toBeVisible();
  }

  /**
   * Open the context menu on the current selection with Shift+F10, the keyboard path, which keeps a
   * range selection that a right-click outside it would replace.
   */
  async openMenuWithKeyboard(): Promise<void> {
    await this.page.keyboard.press('Shift+F10');
    await expect(this.menu()).toBeVisible();
  }

  /**
   * Close the context menu with Escape and wait until it is gone.
   */
  async closeMenu(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.page.locator('.htContextMenu:visible')).toHaveCount(0);
  }

  /**
   * Read whether one item is offered.
   *
   * @param {string} label The item's visible text.
   */
  async itemState(label: string): Promise<ItemAvailability> {
    const item = this.#item(label);

    await expect(item).toBeVisible();

    return {
      disabled: await item.evaluate(element => element.classList.contains('htDisabled')),
      ariaDisabled: await item.getAttribute('aria-disabled'),
    };
  }

  /**
   * Walk the open menu with ArrowDown, once per row, and report whether the keyboard ever lands on
   * the item. The menu skips a disabled item, so a disabled one is never reached.
   *
   * @param {string} label The item's visible text.
   */
  async keyboardReaches(label: string): Promise<boolean> {
    const rows = await this.menu().locator('td').count();
    const current = this.menu().locator('td.current');

    for (let i = 0; i < rows; i += 1) {
      await this.page.keyboard.press('ArrowDown');
      await expect(current).toHaveCount(1);

      if ((await current.innerText()).trim() === label) {
        return true;
      }
    }

    return false;
  }

  /**
   * Click one item. A disabled item carries `aria-disabled`, which Playwright reads as a disabled
   * control and would wait on, so the click is forced: the menu itself must ignore it.
   *
   * @param {string} label The item's visible text.
   */
  async clickItem(label: string): Promise<void> {
    await this.#item(label).click({ force: true });
  }

  /**
   * The comment text on a cell, or `null` when it has none.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  async commentAt(row: number, col: number): Promise<string | null> {
    return this.page.evaluate(([r, c]) => (window as unknown as FixtureWindow).commentAt(r, c), [row, col]);
  }

  /**
   * Every `comment` meta write since the page loaded, as `[row, col, value]`.
   */
  async commentMetaWrites(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).commentMetaWrites.slice());
  }

  /**
   * Select a range through the API; the highlight is (`row`, `col`).
   *
   * @param {number} row The highlight's visual row index.
   * @param {number} col The highlight's visual column index.
   * @param {number} row2 The visual row index of the range's other corner.
   * @param {number} col2 The visual column index of the range's other corner.
   */
  async selectRange(row: number, col: number, row2: number, col2: number): Promise<void> {
    await this.page.evaluate(([r, c, r2, c2]) => (window as unknown as FixtureWindow).selectRange(r, c, r2, c2),
      [row, col, row2, col2]);
  }

  /**
   * Select (0, 0), which holds a comment, and then (4, 4), which does not, as two layers.
   */
  async selectTwoLayers(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).selectTwoLayers());
  }

  /**
   * Merge (3, 0) through (4, 1), with a comment on the hidden cell (4, 1).
   */
  async mergeHiddenComment(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).mergeHiddenComment());
  }

  /**
   * Put a comment on (3, 0), the anchor of the block `mergeHiddenComment()` merges.
   */
  async commentOnMergeAnchor(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).commentOnMergeAnchor());
  }

  /**
   * One main-menu item's `<td>`, found by its exact visible label.
   *
   * @param {string} label The item's visible text.
   */
  #item(label: string): Locator {
    return this.menu().locator('td').filter({ hasText: new RegExp(`^\\s*${label}\\s*$`) }).first();
  }
}
