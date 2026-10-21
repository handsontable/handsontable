import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the `asyncValues` batch fixture: an AI column filled in batches, with Classify and
 * Stop buttons and a progress text.
 */
export class AsyncValuesBatchPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly classify: Locator;
  readonly stop: Locator;
  readonly progress: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.classify = page.getByTestId('classify');
    this.stop = page.getByTestId('stop');
    this.progress = page.getByTestId('progress');
  }

  /**
   * Navigates to the fixture and waits for the grid.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/async-values-batch.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toHaveText('Stainless Steel Water Bottle');
  }

  /**
   * A data cell, by visual row and column.
   */
  cell(row: number, column: number): Locator {
    return this.page.getByTestId(`cell-${row}-${column}`);
  }

  /**
   * The physical rows of every batch the source was called with, in call order.
   */
  async batchRows(): Promise<number[][]> {
    return this.page.evaluate(() => (window as any).batches.map((batch: { rows: number[] }) => batch.rows));
  }

  /**
   * Whether each batch's AbortSignal was aborted.
   */
  async batchesAborted(): Promise<boolean[]> {
    return this.page.evaluate(() => (window as any).batches.map((batch: { signal: AbortSignal }) => batch.signal.aborted));
  }

  /**
   * Resolves a batch with one value per cell.
   */
  async resolveBatch(index: number, values: unknown[]): Promise<void> {
    await this.page.evaluate(([batch, answer]) => (window as any).resolveBatch(batch, answer), [index, values] as const);
  }

  /**
   * The number of cells with a pending request.
   */
  async countPending(): Promise<number> {
    return this.page.evaluate(() => (window as any).hot.getPlugin('asyncValues').countPending());
  }
}
