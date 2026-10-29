import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, BUNDLE_POLLING_MS } from '../bundle';
import './windowTypes';

/**
 * A selection as `[fromRow, fromCol, toRow, toCol]`, the shape `getSelectedLast()` returns.
 */
export type Selection = [number, number, number, number];

/**
 * The fixture's grid cases (`?case=`).
 */
export type SelectionRulesCase = 'staircase' | 'staircase-reversed' | 'filtered' | 'merge-to-merge' | 'two-layers';

interface FixtureWindow extends Window {
  htFilterOutColumnC(values: string[]): void;
}

/**
 * Page Object for the DEV-161 fixture: grids whose merged cells test how a selection grows to cover
 * them. Every gesture is a real pointer or key press; the selection is read back through the API.
 */
export class MergeCellsSelectionRulesPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  /**
   * Wires up the page object for one theme/bundle leg.
   */
  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture on the given case and waits for the grid to render. A captured constructor
   * throw is rethrown here, so a failed build is one diagnosed red rather than a bare wait timeout.
   */
  async goto(gridCase: SelectionRulesCase): Promise<void> {
    await this.page.goto(
      '/tests/fixtures/demo/merge-cells-selection-rules.html' +
      `?theme=${this.theme}&bundle=${this.bundle}&case=${gridCase}`,
    );

    await awaitBundle(this.page);
    await this.page.waitForFunction(
      () => 'htReady' in window || 'htBuildError' in window, undefined, { polling: BUNDLE_POLLING_MS },
    );

    const buildError = await this.page.evaluate(
      () => (window as { htBuildError?: string }).htBuildError ?? null,
    );

    if (buildError !== null) {
      throw new Error(`Handsontable constructor threw in the fixture:\n${buildError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Returns a data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Clicks a cell.
   */
  async click(row: number, col: number): Promise<void> {
    await this.cell(row, col).click();
  }

  /**
   * Ctrl+clicks (Cmd+clicks on macOS) a cell, which adds it to the selection as a new layer.
   */
  async addCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).click({ modifiers: ['ControlOrMeta'] });
  }

  /**
   * Presses the mouse on one cell, moves the pointer onto another and releases it there.
   */
  async drag(from: [number, number], to: [number, number]): Promise<void> {
    await this.cell(...from).hover();
    await this.page.mouse.down();
    await this.cell(...to).hover();
    await this.page.mouse.up();
  }

  /**
   * Presses a sequence of real keys against the focused grid.
   */
  async pressKeys(...keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.page.keyboard.press(key);
    }
  }

  /**
   * Selects a range through the API, the way a host application selects cells.
   */
  async selectRange(range: Selection): Promise<void> {
    await this.page.evaluate((ranges) => {
      window.hot.selectCells(ranges);
    }, [range]);
  }

  /**
   * The last selection as `[fromRow, fromCol, toRow, toCol]`.
   */
  async selected(): Promise<number[] | undefined> {
    return this.page.evaluate(() => window.hot.getSelectedLast());
  }

  /**
   * Every selection layer as `[fromRow, fromCol, toRow, toCol]`, oldest first.
   */
  async selectedLayers(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => window.hot.getSelected());
  }

  /**
   * Whether the grid treats the active range as more than one cell (which paints the area fill).
   */
  async isMultiple(): Promise<boolean> {
    return this.page.evaluate(() =>
      (window.hot as unknown as { selection: { isMultiple(): boolean } }).selection.isMultiple());
  }

  /**
   * Hides the rows holding the given values of column C with a Filters condition, and waits until the
   * first given row is gone from the grid.
   */
  async filterOutColumnC(values: string[]): Promise<void> {
    const rowsBefore = await this.page.evaluate(() => window.hot.countRows());

    await this.page.evaluate(
      hidden => (window as unknown as FixtureWindow).htFilterOutColumnC(hidden),
      values,
    );

    await expect.poll(() => this.page.evaluate(() => window.hot.countRows()))
      .toBe(rowsBefore - values.length);
  }

  /**
   * The values of a visual range, row by row.
   */
  async valuesAt(fromRow: number, fromCol: number, toRow: number, toCol: number): Promise<unknown[][]> {
    return this.page.evaluate(([r1, c1, r2, c2]) => {
      const rows = [];

      for (let row = r1; row <= r2; row += 1) {
        const values = [];

        for (let col = c1; col <= c2; col += 1) {
          values.push(window.hot.getDataAtCell(row, col));
        }

        rows.push(values);
      }

      return rows;
    }, [fromRow, fromCol, toRow, toCol]);
  }
}
