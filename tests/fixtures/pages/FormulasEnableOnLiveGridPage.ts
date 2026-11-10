import { type Page, type Locator } from '@playwright/test';
import { awaitBundle } from '../bundle';
import './windowTypes';
import type { CellValue } from './windowTypes';

/**
 * Page object for the live grid fixture (`formulas-enable-on-live-grid.html`): a grid built without
 * Formulas, with `columnSorting` and `manualRowMove`, that a spec turns Formulas on for.
 */
export class FormulasEnableOnLiveGridPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /** Open the fixture and wait for the bundle. */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/formulas-enable-on-live-grid.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);
  }

  /** A data cell in the master table, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /** Sort by a column the way a user does: click its header label. */
  async sortByHeader(col: number): Promise<void> {
    await this.page.locator('.ht_clone_top').getByTestId(`col-header-${col}`).locator('span.colHeader').click();
  }

  /** `updateSettings({ formulas: { engine: HyperFormula } })` on the live grid, run in the page. */
  async enableFormulas(): Promise<void> {
    await this.page.evaluate(() => {
      const { HyperFormula } = window as unknown as { HyperFormula: unknown };

      window.hot.updateSettings({ formulas: { engine: HyperFormula } } as never);
    });
  }

  /**
   * The values of the engine sheet the grid is bound to, in the engine's own order (an error as its text).
   */
  async engineValues(): Promise<CellValue[][]> {
    return this.page.evaluate(() => {
      const formulas = window.hot.getPlugin('formulas') as unknown as {
        sheetId: number,
        engine: { getSheetValues(sheetId: number): unknown[][] },
      };

      return formulas.engine.getSheetValues(formulas.sheetId)
        .map(row => row.map(value => (value !== null && typeof value === 'object'
          ? (value as { value: CellValue }).value : value as CellValue)));
    });
  }

  /** `getData()`, read in the page. */
  async data(): Promise<CellValue[][]> {
    return this.page.evaluate(() => window.hot.getData() as CellValue[][]);
  }
}
