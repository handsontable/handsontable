import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

interface EditorState {
  opened: boolean;
  waiting: boolean;
  row: number | null;
  col: number | null;
  value: unknown;
}

interface FixtureWindow {
  htSaves: Array<[string, string]>;
  htPendingFetches: unknown[];
  htGate(value: string): void;
  htAnswer(value: string, result: boolean): boolean;
  htPrependRecord(): void;
  htReleaseFetches(): number;
  htEditorState(): EditorState;
  hot: { getDataAtCell(row: number, col: number): unknown };
}

/**
 * Page Object for the DataProvider fixture whose server holds every refetch until the spec releases it, and
 * whose `name` validator holds its answer for a gated value.
 */
export class DataProviderOvertakenEditPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;

    page.on('pageerror', (error) => { this.pageErrors.push(error.message); });
  }

  /**
   * Opens the fixture and waits for the first fetch to render its rows.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/data-provider-overtaken-edit.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    await awaitBundle(this.page);

    const initError = await this.page.getByTestId('grid').getAttribute('data-init-error');

    if (initError !== null) {
      throw new Error(`The fixture grid failed to build: ${initError}`);
    }

    await expect(this.cell(0, 1)).toHaveText('James Okafor');
  }

  /**
   * Returns a data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Returns the cell editor's text area.
   */
  editorInput(): Locator {
    return this.page.locator('textarea.handsontableInput');
  }

  /**
   * Selects a cell with the mouse, types a value with the keyboard, and confirms it with Enter.
   */
  async typeAndConfirm(row: number, col: number, value: string): Promise<void> {
    await this.cell(row, col).click();
    await this.page.keyboard.type(value);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Makes the validator hold its answer for a value.
   */
  async gate(value: string): Promise<void> {
    await this.page.evaluate(v => (window as unknown as FixtureWindow).htGate(v), value);
  }

  /**
   * Answers the held validator of a value. Fails when no validator waits on it.
   */
  async answer(value: string, result: boolean): Promise<void> {
    const answered = await this.page.evaluate(
      ([v, r]) => (window as unknown as FixtureWindow).htAnswer(v as string, r as boolean),
      [value, result],
    );

    expect(answered, `a validator waits on "${value}"`).toBe(true);
  }

  /**
   * Reports how many fetches the server holds.
   */
  async pendingFetchCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htPendingFetches.length);
  }

  /**
   * Adds a record at the top of the server's list.
   */
  async prependRecord(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).htPrependRecord());
  }

  /**
   * Answers every fetch the server holds. Fails when none waits.
   */
  async releaseFetches(): Promise<void> {
    const released = await this.page.evaluate(() => (window as unknown as FixtureWindow).htReleaseFetches());

    expect(released, 'a fetch waits for the server').toBeGreaterThan(0);
  }

  /**
   * Returns the `[id, name]` pairs the server saved, in order.
   */
  async saves(): Promise<Array<[string, string]>> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htSaves);
  }

  /**
   * Reports whether the active editor is open, whether it waits for a validator, where it is, and its value.
   */
  async editorState(): Promise<EditorState> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htEditorState());
  }
}
