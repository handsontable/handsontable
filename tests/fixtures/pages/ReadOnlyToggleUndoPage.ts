import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import './windowTypes';

/**
 * Page Object for the read-only-toggle undo/redo fixture (DEV-136).
 *
 * Toggling "Read only" through the context menu / column menu calls `setCellMeta` directly, which
 * never reached the undo/redo stack. The fix records one undo entry per click, restoring each
 * affected cell to its OWN prior state rather than to one uniform value - the case these tests are
 * built to prove.
 */
export class ReadOnlyToggleUndoPage {
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
      `/tests/fixtures/demo/read-only-toggle-undo.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);

    // Rethrow a constructor failure as itself, rather than as a cell that never appeared.
    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A data cell in the master overlay. */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /** Select a single cell or a range through the API - a click can open an editor or a menu button. */
  async selectRange(fromRow: number, fromCol: number, toRow = fromRow, toCol = fromCol): Promise<void> {
    await this.page.evaluate(
      ([r1, c1, r2, c2]) => window.hot.selectCells([[r1, c1, r2, c2]]),
      [fromRow, fromCol, toRow, toCol],
    );
  }

  /** Write a cell's `readOnly` meta directly, to seed a selection with a mixed starting state. */
  async setReadOnly(row: number, col: number, value: boolean): Promise<void> {
    await this.page.evaluate(
      ({ row: r, col: c, value: v }) => window.hot.setCellMeta(r, c, 'readOnly', v),
      { row, col, value },
    );
  }

  /** A cell's resolved `readOnly` meta, coerced to a plain boolean (unset reads as `false`). */
  async readOnly(row: number, col: number): Promise<boolean> {
    return this.page.evaluate(
      ([r, c]) => Boolean(window.hot.getCellMeta(r, c).readOnly),
      [row, col],
    );
  }

  /** Right-click a data cell to open the context menu, and wait for it to be on screen. */
  async openContextMenu(row: number, col: number): Promise<void> {
    await this.cell(row, col).click({ button: 'right' });
    await expect(this.page.locator('.htContextMenu:visible').last()).toBeVisible();
  }

  /**
   * Open the column header's dropdown (column) menu, and wait for it to be on screen.
   *
   * Column headers are drawn in more than one overlay clone (`.ht_clone_top` plus the hidden
   * master row), so a header test id resolves to more than one element - scope to the visible
   * top-overlay clone rather than matching structural DOM position.
   */
  async openColumnMenu(col: number): Promise<void> {
    await this.grid.locator('.ht_clone_top').getByTestId(`header-${col}`).locator('.changeType').click();
    await expect(this.page.locator('.htDropdownMenu:visible').last()).toBeVisible();
  }

  /** Click the "Read only" item in whichever menu is currently open, and wait for it to close. */
  async clickReadOnlyItem(): Promise<void> {
    const menu = this.page.locator('.htContextMenu:visible, .htDropdownMenu:visible').last();
    const item = menu.locator('td').filter({ hasText: /Read only/ }).first();

    await expect(item).toBeVisible();
    await item.click();
    await expect(this.page.locator('.htContextMenu:visible, .htDropdownMenu:visible')).toHaveCount(0);
  }

  /** Undo with the keyboard shortcut - the real user path, not the plugin API. */
  async undoWithKeyboard(): Promise<void> {
    await this.cell(0, 0).click();
    await this.page.keyboard.press('ControlOrMeta+z');
  }

  /** Redo through the plugin API - there is no dedicated redo test id to click, unlike undo's shortcut. */
  async redo(): Promise<void> {
    await this.page.evaluate(() => window.hot.getPlugin('undoRedo').redo());
  }
}
