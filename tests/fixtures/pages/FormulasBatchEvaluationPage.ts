import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';
import './windowTypes';

/**
 * Page Object for the `formulas.batchEvaluation` fixture: a grid of numbers in column A, `=A<n>*1000` in column B,
 * autosized columns, and a counter of the recalculations the grid reports.
 */
export class FormulasBatchEvaluationPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate to the fixture and wait until the first formula is calculated and painted.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/formulas-batch-evaluation.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.cell(0, 1)).toHaveText('1000');
  }

  /**
   * A single data cell, by visual row/column, via its stable test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The number of recalculations the grid reported since the page loaded.
   */
  async valuesUpdates(): Promise<number> {
    return this.page.evaluate(() => window.valuesUpdates);
  }

  /**
   * Writes the values into column A, one `setDataAtCell()` each, inside `hot.batch()`.
   */
  async writeInBatch(values: number[]): Promise<void> {
    await this.page.evaluate((written) => {
      window.hot.batch(() => {
        written.forEach((value, row) => window.hot.setDataAtCell(row, 0, value));
      });
    }, values);
  }

  /**
   * Writes the value into the first cell of column A inside `hot.batchExecution()`.
   */
  async writeInBatchExecution(value: number): Promise<void> {
    await this.page.evaluate((written) => {
      window.hot.batchExecution(() => window.hot.setDataAtCell(0, 0, written));
    }, value);
  }

  /**
   * Forgets the draws recorded so far.
   */
  async clearRenderLog(): Promise<void> {
    await this.page.evaluate(() => {
      window.renderLog.length = 0;
    });
  }

  /**
   * What each draw left on screen for the first formula cell, in order: its text, and whether the cell shows all
   * of it. A cell narrower than its text cuts it off, which is what an autosized column that was not measured
   * again before the draw looks like.
   */
  async renderLog(): Promise<Array<{ text: string | null, fits: boolean }>> {
    return this.page.evaluate(() => window.renderLog.slice());
  }
}
