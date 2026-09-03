import { type Page, type Locator, expect } from '@playwright/test';

type RendererCall = {
  renderer: string;
  col: number;
  prop: string;
  violation: boolean;
};

declare global {
  interface Window {
    htRendererCalls: RendererCall[];
    hot: { countCols(): number };
  }
}

/**
 * Page Object for the shortened-`columns` fixture (GitHub issue #5543).
 *
 * The fixture records every renderer call instead of exposing only the settled
 * DOM, because the defect this covers lives in an intermediate render that a
 * later one repairs. Specs therefore ask this object for the recorded calls, not
 * for cell text.
 */
export class UpdateSettingsColumnShrinkPage {
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
   * Navigates to the fixture and waits for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/update-settings-column-shrink.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    // The bundle script and the block that builds the grid are separate, so wait
    // for the library itself before asserting on anything the fixture exposes.
    await this.page.waitForFunction(() => 'Handsontable' in window);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A single data cell, by visual row/column, via its stable test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Drops the first of the two columns through `updateSettings()`, in a payload
   * that also carries `data` - the shape the issue reports.
   */
  async shrinkWithData(): Promise<void> {
    await this.page.getByTestId('shrink-with-data').click();
  }

  /**
   * The same shrink with a theme in the payload, which paints once more before
   * the data phase.
   */
  async shrinkWithTheme(): Promise<void> {
    await this.page.getByTestId('shrink-with-theme').click();
  }

  /**
   * The same shrink without `data`, which takes the other branch of
   * `updateSettings()`.
   */
  async shrinkColumnsOnly(): Promise<void> {
    await this.page.getByTestId('shrink-columns-only').click();
  }

  /**
   * Every renderer call recorded since the last shrink.
   */
  rendererCalls(): Promise<RendererCall[]> {
    return this.page.evaluate(() => window.htRendererCalls);
  }

  /**
   * The renderer calls that were handed a value belonging to another column.
   */
  async violations(): Promise<RendererCall[]> {
    return (await this.rendererCalls()).filter(call => call.violation);
  }

  /**
   * The grid's current column count.
   */
  columnCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.countCols());
  }

  /**
   * Asserts the surviving column renders its own values at index 0.
   */
  async expectSurvivingColumn(): Promise<void> {
    await expect(this.cell(0, 0)).toHaveText('Alpha');
    await expect(this.cell(1, 0)).toHaveText('Bravo');
  }
}
