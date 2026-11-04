import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

interface EditorState {
  opened: boolean;
  waiting: boolean;
}

interface FixtureWindow {
  htPending: unknown[];
  htEdits: unknown[];
  htLoaded: unknown[] | null;
  htReload(): void;
  htAnswer(value: string, result: boolean): boolean;
  htSourceData(): Record<string, string>[];
  htEditorState(): EditorState;
}

/**
 * Page Object for the fixture whose `name` and `title` validators hold every answer until the spec
 * releases it, and whose app reloads the data with `loadData()` on demand.
 */
export class ValidatedEditReloadPage {
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
   * Opens the fixture and waits for the first data cell to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/validated-edit-reload.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    await awaitBundle(this.page);

    const initError = await this.page.getByTestId('grid').getAttribute('data-init-error');

    if (initError !== null) {
      throw new Error(`The fixture grid failed to build: ${initError}`);
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
   * Selects a cell with the mouse, types a value with the keyboard, and confirms it with Enter.
   */
  async typeAndConfirm(row: number, col: number, value: string): Promise<void> {
    await this.cell(row, col).click();
    await this.page.keyboard.type(value);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Reports how many validator answers the page still holds.
   */
  async pendingCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htPending.length);
  }

  /**
   * Reloads the grid's data with other records, as the app's refresh does.
   */
  async reload(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).htReload());
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
   * Returns the source rows the grid holds.
   */
  async sourceData(): Promise<Record<string, string>[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htSourceData());
  }

  /**
   * Returns the array the last reload passed to `loadData()`, as plain objects.
   */
  async loadedArray(): Promise<unknown[] | null> {
    return this.page.evaluate(() => JSON.parse(JSON.stringify((window as unknown as FixtureWindow).htLoaded)));
  }

  /**
   * Returns the changes `afterChange` reported with the `edit` source.
   */
  async edits(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htEdits);
  }

  /**
   * Reports whether the active editor is open and whether it waits for a validator.
   */
  async editorState(): Promise<EditorState> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htEditorState());
  }
}
