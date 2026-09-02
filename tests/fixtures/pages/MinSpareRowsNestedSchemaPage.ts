import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page object for the GH #5069 fixture: one grid with `minSpareRows` and a nested `dataSchema`
 * default reached through a dotted `columns[].data` path. Cells are addressed by
 * `data-testid="cell-<row>-<col>"`; edits go through the real editor (double-click, type, Enter).
 *
 * `window.hot` and `window.initNestedSchemaGrid` are declared in `windowTypes.ts` – the single
 * home of the `Window` augmentation shared by every page object in this directory.
 */
export class MinSpareRowsNestedSchemaPage {
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
   * Navigate to the fixture and wait for the grid to render (web-first wait on a real DOM
   * condition).
   *
   * The bundle is injected with `document.write`, so it loads separately from the block that
   * builds the grid. Wait for `Handsontable` itself first, and with `waitForFunction` rather
   * than `expect`: the plain UMD bundle is ~6 MB and every worker pulls its own copy, so a cold
   * or busy server outlasts the 10s `expect` timeout while `waitForFunction` polls against the
   * test budget. Without this the spec flakes on whichever leg happens to warm the server.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/min-spare-rows-nested-schema.html?theme=${this.theme}&bundle=${this.bundle}`);
    await this.page.waitForFunction(() => 'Handsontable' in window);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Types a value into a cell the way a user does: select it, type, commit with Enter. Typing
   * into a selected cell REPLACES its content, where a double-click would open the editor on the
   * existing value and append to it. Waits for the committed value to appear so the follow-up
   * assertions run against a settled grid rather than racing the deferred `adjustRowsAndCols`.
   */
  async typeIntoCell(row: number, col: number, value: string): Promise<void> {
    await this.cell(row, col).click();
    await this.page.keyboard.type(value);
    await this.page.keyboard.press('Enter');
    await expect(this.cell(row, col)).toHaveText(value);
  }

  /** The number of rows the grid currently renders, spare rows included. */
  async rowCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.countRows());
  }

  /** The number of empty rows at the bottom of the grid — what `minSpareRows` is measured against. */
  async trailingEmptyRowCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.countEmptyRows(true));
  }

  /** Whether the grid reports the given visual row as empty. */
  async isEmptyRow(row: number): Promise<boolean> {
    return this.page.evaluate(index => window.hot.isEmptyRow(index), row);
  }

  /** Whether the grid reports the given visual column as empty. */
  async isEmptyCol(col: number): Promise<boolean> {
    return this.page.evaluate(index => window.hot.isEmptyCol(index), col);
  }

  /** Rebuilds the grid with the given setting overrides, so one test cannot leak into the next. */
  async rebuild(overrides: Record<string, unknown> = {}): Promise<void> {
    await this.page.evaluate(settings => window.initNestedSchemaGrid(settings), overrides);
    await expect(this.cell(0, 0)).toBeVisible();
  }
}
