import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

interface HandsontableFixture {
  getSelected(): number[][] | undefined;
  selectCell(row: number, column: number): void;
  getPlugin(name: string): { copy?(): void };
}

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the
// full instance type, and narrowing it here would be a TS2430 conflict.
interface FixtureWindow {
  hot: HandsontableFixture;
  htSourceAt(row: number, col: number): string;
  htPastePlainText(row: number, col: number, text: string): void;
  htValidState(row: number, col: number): string;
  htTypeAndCommit(row: number, col: number, text: string): void;
  htEmptyEditorAndCommit(row: number, col: number): Promise<number>;
  htLoadPlainLabels(): void;
  htUndo(): void;
}

/**
 * Page Object for the fixture that pastes a bare label into columns whose `source` holds
 * key/value entries.
 *
 * Every assertion reads the DATA SOURCE, never the rendered text: a stored `{ key, value }` entry
 * and the bare label `'BMW'` render the same string, so the rendered cell cannot tell them apart.
 * The invalid state is the one exception, and it is read from both the meta and the class the
 * renderer puts on the element.
 */
export class AutocompleteKeyValuePastePage {
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
      `/tests/fixtures/demo/autocomplete-key-value-paste.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    // Wait for the bundle before the cell. The test id comes from the fixture's renderer, so
    // "cell not found" alone cannot tell a slow bundle apart from a grid that failed to render.
    await awaitBundle(this.page);

    // Rethrow a constructor throw the fixture captured. Without this a settings error surfaces as
    // "element(s) not found" from the locator below, with the real exception only in the browser
    // console - the fail-loud rule in `tests/AGENTS.md`.
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
   * Describes what the data source holds at a cell, as a `type:value` string.
   */
  async sourceAt(row: number, col: number): Promise<string> {
    return this.page.evaluate(
      ([r, c]) => (window as unknown as FixtureWindow).htSourceAt(r, c),
      [row, col],
    );
  }

  /**
   * Pastes plain text into a cell. The CopyPaste plugin's `paste()` sets only the `text/plain`
   * clipboard flavor, which is exactly what the browser hands the grid for a paste-as-plain-text
   * (<kbd>Cmd/Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd>) and for a paste from any other
   * application. Simulating the key combination itself would test the browser, not the grid: the
   * accelerator is handled in the browser process, so a synthetic key event never reaches this
   * code path at all.
   */
  async pastePlainText(row: number, col: number, text: string): Promise<void> {
    await this.page.evaluate(
      ([r, c, value]) => {
        (window as unknown as FixtureWindow).htPastePlainText(Number(r), Number(c), String(value));
      },
      [row, col, text],
    );
  }

  /**
   * Copies one cell with the real clipboard, so the rich flavors the grid writes are in play.
   */
  async copyCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).click({ position: { x: 5, y: 5 } });

    await expect.poll(() => this.selected()).toEqual([[row, col, row, col]]);

    await this.page.keyboard.press('ControlOrMeta+c');
  }

  /**
   * Pastes the real clipboard into a cell with <kbd>Cmd/Ctrl</kbd>+<kbd>V</kbd>.
   */
  async pasteClipboardInto(row: number, col: number): Promise<void> {
    await this.cell(row, col).click({ position: { x: 5, y: 5 } });

    await expect.poll(() => this.selected()).toEqual([[row, col, row, col]]);

    await this.page.keyboard.press('ControlOrMeta+v');
  }

  /**
   * Opens the cell's editor, waits for its choices to load, then clears the text and commits.
   *
   * Returns how many choices were loaded. The count is the proof the test exercised the lookup:
   * the choices query is deferred, so an editor opened and committed in one tick has none, and a
   * spec written that way passes whether the empty-text guard exists or not.
   */
  async emptyEditorAndCommit(row: number, col: number): Promise<number> {
    return this.page.evaluate(
      ([r, c]) => (window as unknown as FixtureWindow).htEmptyEditorAndCommit(r, c),
      [row, col],
    );
  }

  /**
   * Types a label into the cell's editor and commits it. This is the path that always resolved a
   * label to its source entry, so it is the reference every paste case is compared against.
   */
  async typeAndCommit(row: number, col: number, text: string): Promise<void> {
    await this.page.evaluate(
      ([r, c, value]) => {
        (window as unknown as FixtureWindow).htTypeAndCommit(Number(r), Number(c), String(value));
      },
      [row, col, text],
    );
  }

  /**
   * Reports the cell's validation state as `'valid'`, `'invalid'` or `'unvalidated'`.
   *
   * Three states rather than a boolean on purpose. A probe reading `valid !== false` answers
   * `true` for a cell nothing has validated yet, so an assertion for "valid" would pass on its
   * first poll - before validation ran, and therefore also against code that stores a bare string
   * and only then marks the cell invalid.
   */
  async validState(row: number, col: number): Promise<string> {
    return this.page.evaluate(
      ([r, c]) => (window as unknown as FixtureWindow).htValidState(r, c),
      [row, col],
    );
  }

  /**
   * Replaces the dataset with rows holding bare labels, through `updateData()`.
   */
  async loadPlainLabels(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).htLoadPlainLabels());
  }

  /**
   * Undoes the last action.
   */
  async undo(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).htUndo());
  }

  /**
   * Returns the grid's current selection.
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSelected());
  }
}
