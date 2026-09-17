import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the fixture that starts with NestedRows turned OFF (DEV-2938).
 *
 * The plugin is switched on with `updateSettings()` from the spec, which is the path an app
 * takes when nesting is a user-toggled feature - and the one the React wrapper takes on its
 * first commit that carries `nestedRows`.
 */
export class NestedRowsRuntimeEnablePage {
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
   * `data: 'arrays'` seeds an array-of-arrays dataset, which the plugin cannot work with.
   */
  async goto(options: { data?: 'objects' | 'arrays' } = {}): Promise<void> {
    const dataShape = options.data ? `&data=${options.data}` : '';

    await this.page.goto(
      `/tests/fixtures/demo/nested-rows-runtime-enable.html?theme=${this.theme}&bundle=${this.bundle}${dataShape}`
    );

    await awaitBundle(this.page);
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

  /** The text of the first column, top to bottom - what the user actually sees. */
  visibleNames(): Promise<string[]> {
    return this.page.evaluate(() => {
      const rows: string[] = [];

      for (let row = 0; row < window.hot.countRows(); row++) {
        rows.push(String(window.hot.getDataAtCell(row, 0)));
      }

      return rows;
    });
  }

  /** Whether the plugin reports itself as running. */
  isPluginEnabled(): Promise<boolean> {
    return this.page.evaluate(() => window.hot.getPlugin('nestedRows').enabled);
  }

  /** Physical row indexes of the parents that are collapsed right now. */
  collapsedParents(): Promise<number[]> {
    return this.page.evaluate(() => window.hot.getPlugin('nestedRows').getCollapsedParents());
  }

  /** Collapses one parent through the public API, by visual row index. */
  collapseParent(row: number): Promise<boolean> {
    return this.page.evaluate(
      visualRow => window.hot.getPlugin('nestedRows').collapseParent(visualRow), row
    );
  }

  /** Everything the page logged through `console.error`, in order. */
  consoleErrors(): Promise<string[]> {
    return this.page.evaluate(() => window.consoleErrors);
  }
}
