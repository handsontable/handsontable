import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

type HotWindow = Window & {
  hot: any;
  otherData: unknown[][];
  htBuildError?: string;
};

/**
 * Page Object for the fixture that holds a column header drag while the column order starts over.
 */
export class ManualColumnMoveDataReplacePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
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
      `/tests/fixtures/demo/manual-column-move-data-replace.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);

    const buildError = await this.page.evaluate(() => (window as unknown as HotWindow).htBuildError ?? null);

    if (buildError !== null) {
      throw new Error(`Handsontable constructor threw in the fixture:\n${buildError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the master overlay, by visual row and column.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * A column header of the top overlay, by visual column.
   */
  header(col: number): Locator {
    return this.grid.locator('.ht_clone_top thead th').nth(col + 1);
  }

  /**
   * Selects a column through the API, presses its sortable label and drags it, held at the inline start
   * of the frozen first column's header. A release there moves the column to the start.
   */
  async startColumnMove(fromCol: number): Promise<void> {
    await this.page.evaluate(col => (window as unknown as HotWindow).hot.selectColumns(col), fromCol);

    const label = this.header(fromCol).locator('.columnSorting');
    const labelBox = await label.boundingBox();
    const targetBox = await this.header(0).boundingBox();

    if (!labelBox || !targetBox) {
      throw new Error('A column header is not rendered.');
    }

    await this.page.mouse.move(labelBox.x + (labelBox.width / 2), labelBox.y + (labelBox.height / 2));
    await this.page.mouse.down();
    await this.cell(1, fromCol).hover();
    await this.page.mouse.move(targetBox.x + 4, targetBox.y + (targetBox.height / 2));
  }

  /**
   * Releases the held pointer button.
   */
  async release(): Promise<void> {
    await this.page.mouse.up();
  }

  /**
   * Presses and releases the pointer on the page, away from the grid.
   */
  async clickAwayFromGrid(): Promise<void> {
    await this.page.mouse.click(2, 2);
  }

  /**
   * Whether ManualColumnMove reports a drag in progress.
   */
  isDragging(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.getPlugin('manualColumnMove').isDragging());
  }

  /**
   * Which table holds the drop guideline: the master table, the frozen start overlay, or none.
   */
  guidelineTable(): Promise<'master' | 'frozen' | 'none'> {
    return this.page.evaluate(() => {
      const guideline = document.querySelector('.ht__manualColumnMove--guideline');

      if (guideline?.closest('.ht_master')) {
        return 'master';
      }

      return guideline?.closest('.ht_clone_inline_start') ? 'frozen' : 'none';
    });
  }

  /**
   * The physical column of each visual column.
   */
  columnOrder(): Promise<number[]> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as HotWindow;

      return Array.from({ length: hot.countCols() }, (_, col) => hot.toPhysicalColumn(col));
    });
  }

  /**
   * The values of a visual column, in visual row order.
   */
  column(col: number): Promise<unknown[]> {
    return this.page.evaluate(c => (window as unknown as HotWindow).hot.getDataAtCol(c), col);
  }

  /**
   * Replaces the data with `loadData()`.
   */
  loadOtherData(): Promise<void> {
    return this.page.evaluate(() => {
      const win = window as unknown as HotWindow;

      win.hot.loadData(win.otherData);
    });
  }

  /**
   * Replaces the data with a same-shape `updateData()`, the way a framework wrapper sends it on a re-render.
   */
  updateOtherData(): Promise<void> {
    return this.page.evaluate(() => {
      const win = window as unknown as HotWindow;

      win.hot.updateData(win.otherData);
    });
  }

  /**
   * Sets the `columns` option, which starts the column order over.
   */
  setColumns(): Promise<void> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.updateSettings({
      columns: [{ data: 0 }, { data: 1 }, { data: 2 }],
    }));
  }

  /**
   * Sets the `manualColumnMove` option.
   */
  setManualColumnMove(value: boolean): Promise<void> {
    return this.page.evaluate(
      enabled => (window as unknown as HotWindow).hot.updateSettings({ manualColumnMove: enabled }), value);
  }
}
