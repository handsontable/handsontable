import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the context menu item override fixture (DEV-3140).
 *
 * The fixture overrides `disabled()` and `hidden()` on `commentsAddEdit`, the item the Comments
 * plugin adds to the menu, and counts how often each callback runs.
 */
export class ContextMenuItemOverridePage {
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
      `/tests/fixtures/demo/context-menu-item-override.html?theme=${this.theme}&bundle=${this.bundle}`);
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
   * Right-click a data cell to open the context menu, and wait for it to be on screen.
   */
  async openContextMenuOnCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).click({ button: 'right' });
    await expect(this.menu()).toBeVisible();
  }

  /**
   * Close the menu with Escape, and wait until it is gone.
   */
  async closeMenu(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.menu()).toHaveCount(0);
  }

  /**
   * The "Add comment" row of the open menu. Its label is what the item's `name()` returns for a
   * cell with no comment, so it finds the row without depending on its position.
   */
  addCommentItem(): Locator {
    return this.menu().locator('td').filter({ hasText: /^\s*Add comment\s*$/ });
  }

  /**
   * How many times the fixture's `disabled()` and `hidden()` overrides have run.
   */
  async overrideCalls(): Promise<{ disabled: number, hidden: number }> {
    return this.page.evaluate(() => (window as unknown as {
      overrideCalls: { disabled: number, hidden: number }
    }).overrideCalls);
  }

  /**
   * The open context menu.
   */
  private menu(): Locator {
    return this.page.locator('.htContextMenu:visible');
  }
}
