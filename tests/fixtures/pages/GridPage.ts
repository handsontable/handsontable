import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the Handsontable demo fixture.
 *
 * The point of a page object: tests express intent (`editCell`, `rowCount`),
 * and the selectors + interaction mechanics live here, in one place. When the
 * DOM shifts, one file changes, not every spec. Selectors prefer `data-testid`
 * (stamped by the fixture renderer) over structural CSS, so hooks are stable
 * and unambiguous. Waits are condition-based — never fixed timeouts.
 */
export class GridPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly addRowButton: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.addRowButton = page.getByTestId('add-row');
  }

  /**
   * Navigate to the fixture and wait for the grid to render. The active theme
   * and bundle are passed as query params so the fixture loads the matching
   * stylesheet and Handsontable build (umd/umd-min — the Puppeteer parity
   * legs). We wait on a real DOM condition (the first cell is visible) rather
   * than a custom readiness flag or a fixed timeout — the web-first pattern
   * the authoring skill teaches.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/grid.html?theme=${this.theme}&bundle=${this.bundle}`);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** Assert a cell shows the expected text (web-first, auto-retrying). */
  async expectCell(row: number, col: number, text: string): Promise<void> {
    await expect(this.cell(row, col)).toHaveText(text);
  }

  /** Open a cell's editor, type a value, and commit it. */
  async editCell(row: number, col: number, value: string): Promise<void> {
    await this.cell(row, col).dblclick();
    const editor = this.page.locator('.handsontableInput');
    await expect(editor).toBeVisible();
    await editor.fill(value);
    await editor.press('Enter');
  }

  /** Click a cell to select it. */
  async selectCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).click();
  }

  /** Press a sequence of keys — e.g. keyboard navigation across the grid. */
  async pressKeys(...keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.page.keyboard.press(key);
    }
  }

  /** Type into the currently selected cell (HOT fast-edit) and commit with Enter. */
  async typeIntoSelected(value: string): Promise<void> {
    await this.page.keyboard.type(value);
    await this.page.keyboard.press('Enter');
  }

  /** The number of rendered data rows in the master overlay. */
  rowLocator(): Locator {
    return this.page.locator('.ht_master .htCore tbody tr');
  }

  async rowCount(): Promise<number> {
    return this.rowLocator().count();
  }
}
