import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { dragFillHandle } from '../gestures';

interface HandsontableFixture {
  getSelected(): number[][] | undefined;
}

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the
// full instance type, and narrowing it here would be a TS2430 conflict.
interface FixtureWindow {
  hot: HandsontableFixture;
  htValidState(row: number, col: number): string;
  htStrictAt(row: number, col: number): string;
  htDataAt(row: number, col: number): string;
  htPasteFrom(row: number, col: number, text: string): void;
  htSetDataAtCell(row: number, col: number, value: string): void;
  htValidateCells(): Promise<void>;
  htReapplyColumns(): void;
}

/**
 * Page Object for the fixture that validates a `dropdown` column declared with `strict: false`,
 * next to a flexible `autocomplete` column and a default `dropdown` column.
 *
 * The validation state is read from the cell meta as three states (`valid`, `invalid`,
 * `unvalidated`), and the class the renderer puts on the element is checked beside it. Reading only
 * `valid !== false` would pass for a cell nothing has validated yet.
 */
export class DropdownStrictValidationPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle = 'umd') {
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
      `/tests/fixtures/demo/dropdown-strict-validation.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    // Wait for the bundle before the cell. The test id comes from the fixture's renderer, so
    // "cell not found" alone cannot tell a slow bundle apart from a grid that failed to render.
    await awaitBundle(this.page);

    // Rethrow a constructor throw the fixture captured, instead of letting it surface as
    // "element(s) not found" from the locator below.
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
   * Reports the cell's validation state as `'valid'`, `'invalid'` or `'unvalidated'`.
   */
  async validState(row: number, col: number): Promise<string> {
    return this.page.evaluate(
      ([r, c]) => (window as unknown as FixtureWindow).htValidState(r, c),
      [row, col],
    );
  }

  /**
   * Reports the `strict` value on the cell's meta, as a string. A `dropdown` cell declared with
   * `strict: false` reads `'false'` until its editor is prepared, so this proves whether the cell
   * was ever selected.
   */
  async strictAt(row: number, col: number): Promise<string> {
    return this.page.evaluate(
      ([r, c]) => (window as unknown as FixtureWindow).htStrictAt(r, c),
      [row, col],
    );
  }

  /**
   * Returns what the cell holds, as a string. A write that `allowInvalid: false` rejected leaves
   * the previous value in place, which the validation flag alone cannot show.
   */
  async dataAt(row: number, col: number): Promise<string> {
    return this.page.evaluate(
      ([r, c]) => (window as unknown as FixtureWindow).htDataAt(r, c),
      [row, col],
    );
  }

  /**
   * Selects one cell and pastes tab-separated text from it, so the cells to its right receive
   * values without ever being selected.
   */
  async pasteFrom(row: number, col: number, text: string): Promise<void> {
    await this.page.evaluate(
      ([r, c, value]) => {
        (window as unknown as FixtureWindow).htPasteFrom(Number(r), Number(c), String(value));
      },
      [row, col, text],
    );
  }

  /**
   * Writes a value through `setDataAtCell()`, with no selection involved.
   */
  async setDataAtCell(row: number, col: number, value: string): Promise<void> {
    await this.page.evaluate(
      ([r, c, v]) => {
        (window as unknown as FixtureWindow).htSetDataAtCell(Number(r), Number(c), String(v));
      },
      [row, col, value],
    );
  }

  /**
   * Runs `validateCells()` and resolves once every validator has reported.
   */
  async validateCells(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).htValidateCells());
  }

  /**
   * Re-applies the same `columns` array through `updateSettings()`, which rebuilds the cell meta.
   */
  async reapplyColumns(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).htReapplyColumns());
  }

  /**
   * Selects a cell with a real click and waits for the selection to land on it.
   */
  async clickCell(row: number, col: number): Promise<void> {
    // Clicking the left edge keeps the pointer off the dropdown arrow, which would open the editor.
    await this.cell(row, col).click({ position: { x: 5, y: 5 } });

    await expect.poll(() => this.selected()).toEqual([[row, col, row, col]]);
  }

  /**
   * The fill handle of the current selection, scoped to the master overlay.
   *
   * The grid draws three corner elements and keeps two of them hidden. Which one is shown depends
   * on the selection: a single cell shows `current`, a range shows `area`. Matching on `:visible`
   * alone therefore works for both, and resolves to exactly one element.
   */
  fillHandle(): Locator {
    return this.page.locator('.ht_master .wtBorder.corner:visible');
  }

  /**
   * Drags the fill handle with a real pointer down to the given cell and releases it.
   */
  async dragFillHandleTo(row: number, col: number): Promise<void> {
    await dragFillHandle(this.page, this.fillHandle(), this.cell(row, col));
  }

  /**
   * Returns the grid's current selection.
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSelected());
  }
}
