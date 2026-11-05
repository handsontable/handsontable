import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the full
// instance type. Every access goes through an explicit cast instead.
interface FixtureWindow {
  hot: {
    getSourceDataAtCell(row: number, col: number): unknown;
    getSelected(): number[][] | undefined;
    setCellMeta(row: number, col: number, key: string, value: unknown): void;
    render(): void;
  };
}

/**
 * Page Object for `multiselect-chip-remove.html`: one multiselect column per way a cell can refuse
 * edits (column `readOnly`, `cells()` `readOnly`, `editor: false`, and column `readOnly` with
 * `readOnlyStyling: false`), beside an editable control in column 0. Every cell starts as
 * `['a', 'b', 'c']`.
 */
export class MultiselectChipRemovePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   *
   * @param {object} [options] Fixture options.
   * @param {boolean} [options.tableReadOnly] Set `readOnly` on the whole table.
   */
  async goto({ tableReadOnly = false }: { tableReadOnly?: boolean } = {}): Promise<void> {
    const query = `theme=${this.theme}&bundle=${this.bundle}`
      + (tableReadOnly ? '&tableReadOnly=1' : '');

    await this.page.goto(`/tests/fixtures/demo/multiselect-chip-remove.html?${query}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Returns a data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Returns every chip remove button in a cell. The renderer builds them, so they carry no test id.
   */
  removeButtons(row: number, col: number): Locator {
    return this.cell(row, col).locator('.ht-multi-select-chip-remove');
  }

  /**
   * Returns the label of the first chip in a cell: a press there lands on the chip, away from its
   * remove button and from the dropdown arrow.
   */
  firstChipLabel(row: number, col: number): Locator {
    return this.cell(row, col).locator('.ht-multi-select-chip-label').first();
  }

  /**
   * Returns the raw value stored for a cell.
   */
  async sourceAt(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(([r, c]) => (
      (window as unknown as FixtureWindow).hot.getSourceDataAtCell(r, c)
    ), [row, col]);
  }

  /**
   * Changes one cell meta value without re-rendering, so the cell keeps the chips it drew before.
   */
  async setCellMetaWithoutRender(row: number, col: number, key: string, value: unknown): Promise<void> {
    await this.page.evaluate(([r, c, k, v]) => {
      (window as unknown as FixtureWindow).hot.setCellMeta(r as number, c as number, k as string, v);
    }, [row, col, key, value]);
  }

  /**
   * Changes one cell meta value and re-renders the grid, the way an application toggles a cell.
   */
  async setCellMetaAndRender(row: number, col: number, key: string, value: unknown): Promise<void> {
    await this.page.evaluate(([r, c, k, v]) => {
      const { hot } = window as unknown as FixtureWindow;

      hot.setCellMeta(r as number, c as number, k as string, v);
      hot.render();
    }, [row, col, key, value]);
  }

  /**
   * Returns the current selection.
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSelected());
  }
}
