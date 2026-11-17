import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';

/**
 * Query params of the `fixed-rows-bottom-load-data.html` fixture this page object uses.
 */
export interface FixedRowsBottomLoadDataOptions {
  rows?: number;
  fixedRowsTop?: number;
  fixedRowsBottom?: number;
  fixedColumnsStart?: number;
  fixedColumnsEnd?: number;
  /**
   * Comma-separated visual rows to hide, for example `'8,9'`.
   */
  hiddenRows?: string;
}

/**
 * What a hook read through `hot.getCell(row, col, true)` while the frozen bottom rows still held the last draw.
 * `null` is the documented answer for a cell that is not rendered; a string is the text of the cell returned.
 */
export type TopmostCellProbe = Record<number, string | null>;

interface HotLike {
  selectCell(row: number, col: number): void;
  loadData(data: unknown[][]): void;
  alter(action: string, index: number, amount?: number): void;
  countRows(): number;
  getSelected(): number[][] | undefined;
  getCell(row: number, col: number, topmost?: boolean): HTMLElement | null;
  addHook(name: string, callback: () => void): void;
}

type FixtureWindow = Window & { hot: HotLike; createGridData: (rows: number) => string[][] };

/**
 * Page Object for `loadData()` and row removal on a grid with `fixedRowsBottom`, on the
 * `fixed-rows-bottom-load-data.html` fixture. Every cell holds "<row>-<col>", so the text of a cell read back
 * from the DOM names the record it shows.
 */
export class FixedRowsBottomLoadDataPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly masterRows: Locator;
  readonly bottomCloneRows: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.masterRows = page.locator('.ht_master .htCore tbody tr');
    this.bottomCloneRows = page.locator('.ht_clone_bottom .htCore tbody tr');
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   *
   * @param {FixedRowsBottomLoadDataOptions} options The fixture options.
   */
  async goto(options: FixedRowsBottomLoadDataOptions = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    Object.entries(options).forEach(([name, value]) => params.set(name, String(value)));

    await this.page.goto(`/tests/fixtures/demo/fixed-rows-bottom-load-data.html?${params.toString()}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.masterRows.first()).toBeVisible();
  }

  /**
   * Select a cell through the API.
   */
  async selectCell(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => (window as unknown as FixtureWindow).hot.selectCell(r, c), [row, col]);
  }

  /**
   * Run `loadData()` with a fresh dataset of `rows` rows and return the message of the error it threw, or `null`
   * when it did not throw.
   */
  async loadDataExpectingError(rows: number): Promise<string | null> {
    return this.page.evaluate((count) => {
      const { hot, createGridData } = window as unknown as FixtureWindow;

      try {
        hot.loadData(createGridData(count));
      } catch (error) {
        return (error as Error).message;
      }

      return null;
    }, rows);
  }

  /**
   * Run `updateSettings()` with a fresh dataset of `rows` rows and the given settings in one call, the way the
   * wrappers send them, and return the message of the error it threw, or `null` when it did not throw.
   */
  async updateDataAndSettingsExpectingError(rows: number, settings: object): Promise<string | null> {
    return this.page.evaluate(([count, newSettings]) => {
      const win = window as unknown as FixtureWindow & { hot: HotLike & { updateSettings(s: object): void } };

      try {
        win.hot.updateSettings({ data: win.createGridData(count as number), ...(newSettings as object) });
      } catch (error) {
        return (error as Error).message;
      }

      return null;
    }, [rows, settings] as const);
  }

  /**
   * Run `alter('remove_row', index)` in the page and return the message of the error it threw, or `null`.
   */
  async removeRowExpectingError(index: number): Promise<string | null> {
    return this.page.evaluate((i) => {
      try {
        (window as unknown as FixtureWindow).hot.alter('remove_row', i, 1);
      } catch (error) {
        return (error as Error).message;
      }

      return null;
    }, index);
  }

  /**
   * Make every run of `hookName` read `hot.getCell(row, 0, true)` for the given rows. `afterRemoveRow` and
   * `afterSelectionEnd` (which `loadData()` fires before it renders) run while the frozen bottom rows still hold
   * the draw from before the change. The latest answers are stored for `probedCells()`.
   */
  async probeTopmostCellsIn(hookName: 'afterRemoveRow' | 'afterSelectionEnd', rows: number[]): Promise<void> {
    await this.page.evaluate(([name, probedRows]) => {
      const win = window as unknown as FixtureWindow & { probed: TopmostCellProbe };

      win.probed = {};
      win.hot.addHook(name as string, () => {
        (probedRows as number[]).forEach((row) => {
          try {
            win.probed[row] = win.hot.getCell(row, 0, true)?.textContent ?? null;
          } catch (error) {
            win.probed[row] = `error: ${(error as Error).message}`;
          }
        });
      });
    }, [hookName, rows] as const);
  }

  /**
   * What `probeTopmostCellsIn()` recorded.
   */
  async probedCells(): Promise<TopmostCellProbe> {
    return this.page.evaluate(() => (window as unknown as { probed: TopmostCellProbe }).probed);
  }

  /**
   * The cells the bottom-end corner clone draws (it exists when the grid has `fixedColumnsEnd`).
   */
  bottomEndCornerCells(): Locator {
    return this.page.locator('.ht_clone_bottom_inline_end_corner .htCore tbody td');
  }

  /**
   * The number of rows the grid reports.
   */
  async countRows(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.countRows());
  }

  /**
   * The selected ranges as `[fromRow, fromCol, toRow, toCol]`.
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSelected());
  }

  /**
   * The text of the cell `hot.getCell(row, 0, true)` returns after the grid rendered, `null` when it returns none.
   */
  async topmostCellText(row: number, col = 0): Promise<string | null> {
    return this.page.evaluate(([r, c]) => {
      const cell = (window as unknown as FixtureWindow).hot.getCell(r, c, true);

      return cell ? cell.textContent : null;
    }, [row, col]);
  }
}
