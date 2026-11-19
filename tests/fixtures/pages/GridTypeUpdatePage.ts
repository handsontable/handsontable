import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the
// full instance type, and narrowing it here would be a TS2430 conflict. Every access is cast.
interface FixtureWindow {
  hot: {
    getDataAtCell(row: number, col: number): unknown;
    updateSettings(settings: Record<string, unknown>): void;
    selectCell(row: number, col: number): boolean;
  };
}

/**
 * Page Object for the fixture whose grid is created with a grid-level `type: 'dropdown'` and has that
 * type changed through `updateSettings()`.
 */
export class GridTypeUpdatePage {
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
    await this.page.goto(`/tests/fixtures/demo/grid-type-update.html?theme=${this.theme}&bundle=${this.bundle}`);

    // Waiting for the bundle itself, not only for a cell: the injected bundle script and the
    // block that builds the grid are separate, so a cell that is missing cannot otherwise be told
    // apart from a bundle that has not arrived yet.
    await awaitBundle(this.page);

    const buildError = await this.page.evaluate(() => (window as unknown as { htBuildError?: string }).htBuildError);

    if (buildError) {
      throw new Error(`The fixture grid failed to build: ${buildError}`);
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
   * Returns the checkbox input inside a cell.
   */
  checkbox(row: number, col: number): Locator {
    return this.cell(row, col).locator('input[type="checkbox"]');
  }

  /**
   * Returns the dropdown arrow the dropdown renderer draws inside a cell.
   */
  dropdownArrow(row: number, col: number): Locator {
    return this.cell(row, col).locator('.htAutocompleteArrow');
  }

  /**
   * Returns the list the dropdown editor opens.
   */
  dropdownList(): Locator {
    return this.page.locator('.handsontableEditor.autocompleteEditor');
  }

  /**
   * Calls `updateSettings()` with a JSON-serializable payload.
   */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(
      (payload) => (window as unknown as FixtureWindow).hot.updateSettings(payload),
      settings
    );
  }

  /**
   * Selects a cell through the API. A centred click on a dropdown cell can land on its arrow, which opens
   * the editor by itself, so a key pressed next would close it instead of opening it.
   */
  async selectCell(row: number, col: number): Promise<void> {
    await this.page.evaluate(
      ([r, c]) => (window as unknown as FixtureWindow).hot.selectCell(r, c),
      [row, col]
    );
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
