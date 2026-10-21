import { expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { ColumnSummaryReadOnlyPage } from './ColumnSummaryReadOnlyPage';

/**
 * Page Object for the `cells()` read-only lock fixture (DEV-149).
 *
 * It reuses the menu helpers of the DEV-148 page and only swaps the fixture: row 0 is read-only
 * through the `cells` option, and the cell at row 2, column 1 is pinned writable the same way.
 */
export class CellsReadOnlyPage extends ColumnSummaryReadOnlyPage {
  /**
   * Navigate to the fixture. The theme and bundle travel as query params so the fixture loads the
   * matching stylesheet and Handsontable build.
   */
  override async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/cells-read-only.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);

    // Rethrow a constructor failure as itself, rather than as a cell that never appeared.
    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Every `[row, col]` the grid stored a `readOnly` value for, in order, since the last call to
   * `forgetReadOnlyWrites()`.
   */
  async readOnlyWrites(): Promise<number[][]> {
    return this.page.evaluate(() => (window as unknown as { readOnlyWrites: number[][] }).readOnlyWrites);
  }

  /**
   * Forget the writes recorded so far.
   */
  async forgetReadOnlyWrites(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { readOnlyWrites: number[][] }).readOnlyWrites.length = 0;
    });
  }

  /**
   * Move a row through the manualRowMove plugin, so visual and physical row indexes differ.
   */
  async moveRow(from: number, to: number): Promise<void> {
    await this.page.evaluate(([f, t]) => {
      const hot = window.hot as unknown as {
        updateSettings: (settings: object) => void,
        getPlugin: (name: string) => { moveRow: (from: number, to: number) => void },
      };

      hot.updateSettings({ manualRowMove: true });
      hot.getPlugin('manualRowMove').moveRow(f, t);
      window.hot.render();
    }, [from, to]);
  }
}
