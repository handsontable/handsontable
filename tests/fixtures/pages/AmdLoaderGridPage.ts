import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the AMD-loader-collision fixture (`amd-loader-grid.html`).
 *
 * The fixture installs a RequireJS-style global `define` (with `define.amd`)
 * BEFORE the Handsontable bundle loads — the SharePoint/Dojo/RequireJS hosting
 * scenario. The page object exposes the grid cells plus the count of AMD
 * registrations the fake loader captured, so a spec can prove the AMD code
 * path was actually exercised and the bundle still initialized.
 */
export class AmdLoaderGridPage {
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
   * Navigate to the fixture. Waits only for the document `load` event — the
   * bundle and grid init are synchronous inline scripts, so any load-time
   * failure (the regression this fixture guards) has already surfaced as a
   * page error by then. Cell visibility is asserted separately by the spec.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/amd-loader-grid.html?theme=${this.theme}&bundle=${this.bundle}`);
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** Assert a cell shows the expected text (web-first, auto-retrying). */
  async expectCell(row: number, col: number, text: string): Promise<void> {
    await expect(this.cell(row, col)).toHaveText(text);
  }

  /** How many modules registered through the page's fake AMD loader. */
  async amdRegistrationCount(): Promise<number> {
    return this.page.evaluate(() => (window as any).__amdRegistrations.length);
  }
}
