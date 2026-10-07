import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the initially hidden middle column/row context-menu fixture (DEV-1040).
 *
 * Column headers live in several overlays, so header locators stay scoped to `.ht_clone_top`
 * (columns) and `.ht_clone_inline_start` (rows). An unscoped `getByTestId` matches more than once
 * and fails Playwright's strict mode.
 */
export class ShowHiddenMiddleColumnPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly columnHeaderOverlay: Locator;
  readonly rowHeaderOverlay: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.columnHeaderOverlay = page.locator('.ht_clone_top');
    this.rowHeaderOverlay = page.locator('.ht_clone_inline_start');
  }

  /**
   * Navigate to the fixture. Theme and bundle travel as query params so the fixture loads the
   * matching stylesheet and Handsontable build.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/show-hidden-middle-column.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the master overlay. Hidden rows and columns are absent from the DOM, so a
   * missing test id is the observable hidden state.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * A column header, scoped to the top overlay so the match is unambiguous.
   */
  columnHeader(col: number): Locator {
    return this.columnHeaderOverlay.getByTestId(`col-header-${col}`);
  }

  /**
   * A row header, scoped to the inline-start overlay so the match is unambiguous.
   */
  rowHeader(row: number): Locator {
    return this.rowHeaderOverlay.getByTestId(`row-header-${row}`);
  }

  /**
   * The visible context menu. Handsontable renders it outside the grid container.
   */
  contextMenu(): Locator {
    return this.page.locator('.htContextMenu:visible').last();
  }

  /**
   * The Show column / Show columns item. Exact match so "Show columns" does not swallow a
   * missing singular item, and the other way around.
   */
  showColumnMenuItem(): Locator {
    return this.contextMenu().locator('td').filter({ hasText: /^Show columns?$/ });
  }

  /**
   * The Show row / Show rows item.
   */
  showRowMenuItem(): Locator {
    return this.contextMenu().locator('td').filter({ hasText: /^Show rows?$/ });
  }

  /**
   * Right-click a column header and wait for the context menu.
   */
  async openColumnHeaderMenu(col: number): Promise<void> {
    await this.columnHeader(col).click({ button: 'right' });
    await expect(this.contextMenu()).toBeVisible();
  }

  /**
   * Right-click a row header and wait for the context menu.
   */
  async openRowHeaderMenu(row: number): Promise<void> {
    await this.rowHeader(row).click({ button: 'right' });
    await expect(this.contextMenu()).toBeVisible();
  }

  /**
   * Restore hidden columns from the open menu, then wait until the menu is gone.
   */
  async clickShowColumn(): Promise<void> {
    await this.showColumnMenuItem().click();
    await expect(this.contextMenu()).toHaveCount(0);
  }

  /**
   * Restore hidden rows from the open menu, then wait until the menu is gone.
   */
  async clickShowRow(): Promise<void> {
    await this.showRowMenuItem().click();
    await expect(this.contextMenu()).toHaveCount(0);
  }
}
