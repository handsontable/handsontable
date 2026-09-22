import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the
// full instance type, and narrowing it here would be a TS2430 conflict. Every access is cast.
interface FixtureWindow {
  hot: {
    getDataAtCell(row: number, col: number): unknown;
  };
}

/**
 * Page Object for the fixture that overwrites a checkbox column with a custom renderer chaining the
 * built-in checkbox renderer and then rebuilding the cell via `td.innerHTML += ...`
 * (handsontable/dev-handsontable#342, DEV-185).
 */
export class CheckboxCustomRendererPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture and waits for the bundle and the first data cell.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/checkbox-custom-renderer.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    // Waiting for the bundle itself, not only for a cell: the injected bundle script and the
    // block that builds the grid are separate, so a cell that is missing cannot otherwise be told
    // apart from a bundle that has not arrived yet.
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
   * Returns the checkbox input the custom renderer built inside a cell.
   */
  checkbox(row: number, col: number): Locator {
    return this.cell(row, col).locator('input[type="checkbox"]');
  }

  /**
   * Clicks a cell's checkbox, which toggles the underlying cell value.
   */
  async clickCheckbox(row: number, col: number): Promise<void> {
    await this.checkbox(row, col).click();
  }

  /**
   * Returns the underlying data value for a cell.
   */
  async dataAt(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(
      ([r, c]) => (window as unknown as FixtureWindow).hot.getDataAtCell(r, c),
      [row, col]
    );
  }
}
