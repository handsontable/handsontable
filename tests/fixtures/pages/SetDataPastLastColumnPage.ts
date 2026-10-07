import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

interface HandsontableFixture {
  getSelected(): number[][] | undefined;
  getActiveEditor(): { isOpened(): boolean; getValue(): unknown } | undefined;
  getSourceDataAtRow(row: number): Record<string, unknown>;
  setDataAtCell(row: number, col: number, value: unknown): void;
}

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the full
// instance type. Every access goes through an explicit cast instead.
interface FixtureWindow {
  hot: HandsontableFixture;
}

/**
 * Page Object for the fixture with a two-column object data source, which can never gain a column
 * past its last one.
 */
export class SetDataPastLastColumnPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/set-data-past-last-column.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    // Wait for the bundle before the cell, so "cell not found" cannot hide a slow bundle.
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
   * Selects a cell and types into it, which opens its editor with the typed text.
   */
  async typeIntoCell(row: number, col: number, text: string): Promise<void> {
    await this.cell(row, col).click();

    await expect.poll(() => this.selected()).toEqual([[row, col, row, col]]);

    await this.page.keyboard.type(text);

    await expect.poll(() => this.isEditorOpen()).toBe(true);
  }

  /**
   * Calls `setDataAtCell()` through the API, the way application code would.
   */
  async setDataAtCell(row: number, col: number, value: unknown): Promise<void> {
    await this.page.evaluate(
      ([targetRow, targetColumn, newValue]) => {
        (window as unknown as FixtureWindow).hot.setDataAtCell(
          targetRow as number, targetColumn as number, newValue
        );
      },
      [row, col, value],
    );
  }

  /**
   * Reports whether the cell editor is open.
   */
  async isEditorOpen(): Promise<boolean> {
    return this.page.evaluate(() => (
      (window as unknown as FixtureWindow).hot.getActiveEditor()?.isOpened() === true
    ));
  }

  /**
   * Returns the value the open editor holds, or null when there is no active editor.
   */
  async editorValue(): Promise<unknown> {
    return this.page.evaluate(() => (
      (window as unknown as FixtureWindow).hot.getActiveEditor()?.getValue() ?? null
    ));
  }

  /**
   * Returns the current selection.
   */
  async selected(): Promise<number[][] | null> {
    return this.page.evaluate(() => (
      (window as unknown as FixtureWindow).hot.getSelected() ?? null
    ));
  }

  /**
   * Returns a row of the source data.
   */
  async sourceRow(row: number): Promise<Record<string, unknown>> {
    return this.page.evaluate(
      targetRow => (window as unknown as FixtureWindow).hot.getSourceDataAtRow(targetRow),
      row,
    );
  }
}
