import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page object for the GH #7553 fixture: one grid whose validator resolves on demand, so a test can
 * hold a cell mid-validation and land an `updateSettings` in that exact window. Cells are addressed
 * by `data-testid="cell-<row>-<col>"`.
 *
 * `window.hot`, `window.initInvalidMarkGrid`, `window.resolveValidation` and
 * `window.pendingValidationCount` are declared in `windowTypes.ts` - the single home of the
 * `Window` augmentation shared by every page object in this directory.
 */
export class InvalidMarkUpdateSettingsPage {
  /** The Playwright page the fixture is driven through. */
  readonly page: Page;
  /** The active theme, passed through to the fixture URL. */
  readonly theme: string;
  /** The active bundle, passed through to the fixture URL. */
  readonly bundle: string;
  /** Uncaught page errors seen since construction, in the order they fired. */
  readonly pageErrors: string[] = [];

  /**
   * Wires up the page object for one theme/bundle leg and starts collecting uncaught page errors
   * immediately, so a spec that never calls `goto()` before an assertion still sees them.
   */
  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    page.on('pageerror', (error) => { this.pageErrors.push(error.message); });
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   *
   * The bundle is injected with `document.write`, so it loads separately from the block that builds
   * the grid. Wait for `Handsontable` itself first, and with `waitForFunction` rather than `expect`:
   * the plain UMD bundle is ~6 MB and every worker pulls its own copy, so a cold or busy server
   * outlasts the 10s `expect` timeout while `waitForFunction` polls against the test budget.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/invalid-mark-update-settings.html?theme=${this.theme}&bundle=${this.bundle}`);
    await this.page.waitForFunction(() => 'Handsontable' in window);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** Rebuilds the grid with extra settings merged over the fixture defaults. */
  async initGrid(overrides: Record<string, unknown> = {}): Promise<void> {
    await this.page.evaluate(settings => window.initInvalidMarkGrid(settings), overrides);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** Writes a value straight through the API, without waiting for validation to resolve. */
  async setDataAtCell(row: number, col: number, value: unknown): Promise<void> {
    await this.page.evaluate(
      ({ r, c, v }) => { window.hot.setDataAtCell(r, c, v); },
      { r: row, c: col, v: value }
    );
  }

  /**
   * Releases the oldest validator callback still waiting. Asserts that one WAS waiting, so a test
   * whose timing assumption is wrong fails here instead of passing on a no-op.
   */
  async resolveValidation(): Promise<void> {
    await expect.poll(() => this.page.evaluate(() => window.pendingValidationCount())).toBeGreaterThan(0);
    const released = await this.page.evaluate(() => window.resolveValidation());

    expect(released).toBe(true);
  }

  /**
   * Calls `updateSettings` with one of the three payload shapes that clear the cell meta cache.
   * The payload is built inside the page, because a `cells` FUNCTION cannot cross `evaluate()` -
   * argument serialization drops it, and the call would then no longer clear anything.
   */
  async updateSettingsWith(kind: 'cells' | 'cell' | 'columns', columnCount = 5): Promise<void> {
    await this.page.evaluate(({ k, count }) => {
      const payload = {
        cells: () => ({ cells: () => ({}) }),
        cell: () => ({ cell: [] }),
        columns: () => ({ columns: Array.from({ length: count }, () => ({})) }),
      }[k]();

      window.hot.updateSettings(payload);
    }, { k: kind, count: columnCount });
  }

  /** Calls `updateSettings` with a plain, serializable payload. */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(s => { window.hot.updateSettings(s); }, settings);
  }

  /** Writes one cell meta key through the public API (an imperative, user-defined write). */
  async setCellMeta(row: number, col: number, key: string, value: unknown): Promise<void> {
    await this.page.evaluate(
      ({ r, c, k, v }) => { window.hot.setCellMeta(r, c, k, v); },
      { r: row, c: col, k: key, v: value }
    );
  }

  /** Reads one cell meta key, stringified so `undefined` stays distinguishable. */
  async cellMetaValue(row: number, col: number, key: string): Promise<string> {
    return this.page.evaluate(
      ({ r, c, k }) => String((window.hot.getCellMeta(r, c) as Record<string, unknown>)[k]),
      { r: row, c: col, k: key }
    );
  }

  /** The number of columns the grid currently shows. */
  async columnCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.countCols());
  }

  /** Inserts rows above the given visual row index. */
  async insertRowAbove(row: number, amount = 1): Promise<void> {
    await this.page.evaluate(
      ({ r, a }) => { window.hot.alter('insert_row_above', r, a); },
      { r: row, a: amount }
    );
  }

  /** The cell's `valid` meta flag, as a string so `undefined` is distinguishable from `"true"`. */
  async cellValidFlag(row: number, col: number): Promise<string> {
    return this.page.evaluate(
      ({ r, c }) => String(window.hot.getCellMeta(r, c).valid),
      { r: row, c: col }
    );
  }

  /** The cell's current value. */
  async cellValue(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(({ r, c }) => window.hot.getDataAtCell(r, c), { r: row, c: col });
  }

  /** How many cells currently render the invalid highlight. */
  invalidCells(): Locator {
    return this.page.locator('.ht_master td.htInvalid');
  }
}
