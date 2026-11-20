import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

type HotWindow = Window & {
  hot: {
    updateSettings(settings: Record<string, unknown>): void;
  };
  buildGrid(extraSettings?: Record<string, unknown>): void;
};

/**
 * The ARIA state of one corner header copy.
 */
export type CornerAttributes = {
  overlay: string;
  role: string | null;
  ariaLabel: string | null;
};

/**
 * Page Object for the corner header role fixture.
 *
 * The state under test is the `role` and `aria-label` of the corner headers: the cells of the column
 * header row that sit above the row headers, one per row-header column, in every overlay that draws
 * them.
 */
export class CornerHeaderRolePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly grid: Locator;
  readonly root: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.root = page.getByTestId('grid-root');
  }

  /**
   * Navigate to the fixture and wait for the default grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/corner-header-role.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await this.expectBuilt();
  }

  /**
   * Rebuilds the grid with extra settings merged over the fixture defaults.
   *
   * @param {object} extraSettings JSON-serializable settings.
   */
  async rebuild(extraSettings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(
      settings => (window as unknown as HotWindow).buildGrid(settings),
      extraSettings
    );
    await this.expectBuilt();
  }

  /**
   * Calls `updateSettings()` on the grid.
   *
   * @param {object} settings JSON-serializable settings.
   */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(
      nextSettings => (window as unknown as HotWindow).hot.updateSettings(nextSettings),
      settings
    );
  }

  /**
   * Returns the corner headers of the top-start corner overlay, the copy a user sees.
   */
  cornerCells(): Locator {
    return this.page.locator('.ht_clone_top_inline_start_corner thead tr:last-child > th');
  }

  /**
   * Returns the RowSelection "select all" checkbox in the corner overlay.
   */
  selectAllCheckbox(): Locator {
    return this.page.locator('.ht_clone_top_inline_start_corner').getByRole('checkbox', { name: /^Select all rows/ });
  }

  /**
   * Returns the corner header that holds the RowSelection "select all" checkbox.
   */
  cornerCellWithSelectAll(): Locator {
    return this.cornerCells().filter({ has: this.page.getByRole('checkbox', { name: /^Select all rows/ }) });
  }

  /**
   * Reads the `role` and `aria-label` of every corner header copy, in every overlay that draws the
   * column headers: the first `rowHeadersCount` cells of the last header row.
   *
   * @param {number} rowHeadersCount The number of row-header columns.
   * @returns {Promise<CornerAttributes[]>}
   */
  async cornerAttributesInEveryOverlay(rowHeadersCount: number): Promise<CornerAttributes[]> {
    return this.page.evaluate((count) => {
      const overlays = ['ht_master', 'ht_clone_top', 'ht_clone_inline_start', 'ht_clone_top_inline_start_corner'];
      const result: { overlay: string; role: string | null; ariaLabel: string | null }[] = [];

      overlays.forEach((overlay) => {
        const row = document.querySelector(`.${overlay} thead tr:last-child`);

        if (!row) {
          return;
        }

        Array.from(row.children).slice(0, count).forEach((cell) => {
          result.push({ overlay, role: cell.getAttribute('role'), ariaLabel: cell.getAttribute('aria-label') });
        });
      });

      return result;
    }, rowHeadersCount);
  }

  /**
   * Fails loud on a constructor throw, then waits for the rendered root.
   */
  private async expectBuilt(): Promise<void> {
    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.root).toBeVisible();
  }
}
