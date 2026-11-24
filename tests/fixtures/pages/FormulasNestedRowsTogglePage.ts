import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the fixture that turns NestedRows on while a HyperFormula engine is attached
 * (DEV-2978).
 *
 * The grid is built with the plugin off, so the engine holds the two top-level rows. The spec then
 * toggles the plugin and compares what the engine holds against the grid the user sees.
 */
export class FormulasNestedRowsTogglePage {
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
   * Navigate to the fixture and wait for the grid to render.
   *
   * `nested: 'on'` builds the grid with the plugin already enabled, which is the reference layout a
   * runtime toggle has to reproduce.
   */
  async goto(options: { nested?: 'off' | 'on', scenario?: 'tree' | 'sheet-switch' } = {}): Promise<void> {
    const nested = options.nested ? `&nested=${options.nested}` : '';
    const scenario = options.scenario ? `&scenario=${options.scenario}` : '';

    await this.page.goto(
      `/tests/fixtures/demo/formulas-nested-rows-toggle.html` +
      `?theme=${this.theme}&bundle=${this.bundle}${nested}${scenario}`
    );

    await awaitBundle(this.page);

    const fixtureError = await this.page.evaluate(() => window.htFixtureError);

    if (fixtureError) {
      throw new Error(`The fixture grid failed to build: ${fixtureError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** Turns the plugin on or off the way an app toggling the feature does. */
  async setNestedRows(value: boolean): Promise<void> {
    await this.page.evaluate(enabled => window.hot.updateSettings({ nestedRows: enabled }), value);
  }

  /**
   * How many rows HyperFormula holds for this grid's sheet.
   *
   * Trailing empty rows are not counted, which is why the fixture's last row carries a formula -
   * the number then describes the whole grid and can be compared with `countRows()` directly.
   */
  sheetHeight(): Promise<number> {
    return this.page.evaluate(() => {
      const plugin = window.hot.getPlugin('formulas');

      return plugin.engine!.getSheetDimensions(plugin.sheetId!).height;
    });
  }

  /**
   * What HyperFormula holds for this grid's sheet, serialized - formulas as their own text.
   *
   * This is the measure to reach for when the grid SHRANK: the engine grows a sheet to calculate
   * values outside it and does not give that extent back, so `getSheetDimensions()` keeps reporting
   * the taller layout while the content is already the shorter one.
   */
  sheetContent(): Promise<unknown[][]> {
    return this.page.evaluate(() => {
      const plugin = window.hot.getPlugin('formulas');

      return plugin.engine!.getSheetSerialized(plugin.sheetId!);
    });
  }

  /** The grid's own row count, after any flattening. */
  rowCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.countRows());
  }

  /**
   * The whole grid as the user reads it, row by row - the name and what the `calc` column shows.
   *
   * Read through `getDataAtCell`, which is the value the renderer paints: a formula the engine
   * never received comes back as its own raw text.
   */
  visibleRows(): Promise<string[][]> {
    return this.page.evaluate(() => {
      const rows: string[][] = [];

      for (let row = 0; row < window.hot.countRows(); row++) {
        rows.push([String(window.hot.getDataAtCell(row, 0)), String(window.hot.getDataAtCell(row, 1))]);
      }

      return rows;
    });
  }

  /** Writes a value, by visual row/column. */
  async setCell(row: number, col: number, value: string): Promise<void> {
    await this.page.evaluate(
      ({ r, c, v }) => window.hot.setDataAtCell(r, c, v), { r: row, c: col, v: value }
    );
  }

  /**
   * Everything the page logged through `console.error`, in order.
   *
   * Throws rather than defaulting to `[]` when the fixture's capture is missing: the spec's only
   * negative assertion is `toEqual([])`, and a silent default would let it pass against a fixture
   * that no longer records anything.
   */
  async consoleErrors(): Promise<string[]> {
    const errors = await this.page.evaluate(() => window.consoleErrors);

    if (errors === undefined) {
      throw new Error('The fixture is not capturing console errors, so asserting on them proves nothing.');
    }

    return errors;
  }

  /**
   * How many full sheet rebuilds the engine has taken since the last reset.
   *
   * One resync is one `setSheetContent`, so this is what proves an `updateSettings()` that changes
   * no row count skipped the scan entirely.
   */
  sheetWriteCount(): Promise<number> {
    return this.page.evaluate(() => window.sheetWriteCount ?? 0);
  }

  /** Zeroes the sheet-rebuild counter. */
  async resetSheetWriteCount(): Promise<void> {
    await this.page.evaluate(() => {
      window.sheetWriteCount = 0;
    });
  }

  /** Sends a settings payload that changes nothing about the row count. */
  async updateUnrelatedSetting(value: boolean): Promise<void> {
    await this.page.evaluate(rowHeaders => window.hot.updateSettings({ rowHeaders }), value);
  }

  /** Switches the bound engine sheet the way an app does — through `updateSettings`. */
  async switchSheet(sheetName: string): Promise<void> {
    await this.page.evaluate(
      name => window.hot.updateSettings({ formulas: { engine: window.htEngine, sheetName: name } }), sheetName
    );
  }

  /** The serialized content of one sheet in the shared engine, by name (sheet-switch scenario). */
  sharedSheetContent(sheetName: string): Promise<unknown[][]> {
    return this.page.evaluate(
      name => window.htEngine!.getSheetSerialized(window.htEngine!.getSheetId(name)), sheetName
    );
  }
}
