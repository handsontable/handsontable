import { expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';
import { FixedColumnsEndPage } from './FixedColumnsEndPage';

/**
 * Query params the `fixed-columns-end-limits.html` fixture understands. All numbers or flags.
 */
export interface FixedColumnsEndLimitsOptions {
  fixedColumnsEnd?: number;
  cols?: number;
  maxCols?: number;
  minCols?: number;
  manualColumnMove?: boolean;
}

/**
 * Page Object for the fixture that combines `fixedColumnsEnd` with `maxCols` and `minCols`. It reuses the
 * interactions of the core page object and only replaces the page it opens.
 */
export class FixedColumnsEndLimitsPage extends FixedColumnsEndPage {
  /**
   * Navigate and wait for the grid to render (a real DOM condition, no sleep).
   *
   * @param {FixedColumnsEndLimitsOptions} options The fixture options.
   */
  async open(options: FixedColumnsEndLimitsOptions = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    Object.entries(options).forEach(([name, value]) => {
      if (value !== undefined && value !== false) {
        params.set(name, value === true ? '1' : String(value));
      }
    });
    await this.page.goto(`/tests/fixtures/demo/fixed-columns-end-limits.html?${params}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.master).toBeVisible();
  }

  /**
   * The text of the cells in the first row of the inline-end overlay, in column order.
   */
  async endOverlayFirstRow(): Promise<string[]> {
    return this.endOverlay.locator('tbody tr').first().locator('td').allTextContents();
  }
}
