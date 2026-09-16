import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

interface CopyPastePlugin {
  paste(pastableText: string, pastableHtml?: string): void;
}

interface HandsontableFixture {
  getSelected(): number[][] | undefined;
  selectCells(ranges: number[][]): void;
  listen(): void;
  unlisten(): void;
  isListening(): boolean;
  countSourceRows(): number;
  getSourceData(): unknown[][];
  getSourceDataAtCell(row: number, col: number): unknown;
  getPlugin(name: string): CopyPastePlugin;
}

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the full
// instance type, and narrowing it here would be a TS2430 conflict.
interface FixtureWindow {
  hot: HandsontableFixture;
  htChanges: unknown[][];
  htPendingValidations: unknown[];
  htResolveValidations(): number;
}

interface PageOptions {
  validated?: boolean;
  allowInsertRow?: boolean;
  asyncValidator?: boolean;
  afterPasteMove?: boolean;
  merge?: boolean;
}

/**
 * Page Object for the fixture that pastes a block extending past the last row into a range that may
 * include a validated (`dropdown`) column.
 *
 * A validated column defers row creation to a microtask, so the selection `CopyPaste` makes
 * synchronously after the paste can be clamped against a stale row count. The cases read the
 * selection and the source row count to prove where the post-paste selection ended up and whether
 * the grid grew.
 */
export class PasteSelectionValidatedColumnPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly validated: boolean;
  readonly allowInsertRow: boolean;
  readonly asyncValidator: boolean;
  readonly afterPasteMove: boolean;
  readonly merge: boolean;

  constructor(page: Page, theme = 'main', bundle = 'umd', options: PageOptions = {}) {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.validated = options.validated ?? true;
    this.allowInsertRow = options.allowInsertRow ?? true;
    this.asyncValidator = options.asyncValidator ?? false;
    this.afterPasteMove = options.afterPasteMove ?? false;
    this.merge = options.merge ?? false;
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   */
  async goto(): Promise<void> {
    const query = `theme=${this.theme}&bundle=${this.bundle}` +
      `&validated=${this.validated ? 'on' : 'off'}` +
      `&allowInsertRow=${this.allowInsertRow ? 'on' : 'off'}` +
      `&validator=${this.asyncValidator ? 'async' : 'none'}` +
      `&afterPasteMove=${this.afterPasteMove ? 'on' : 'off'}` +
      `&merge=${this.merge ? 'on' : 'off'}`;

    await this.page.goto(`/tests/fixtures/demo/paste-selection-validated-column.html?${query}`);

    // Wait for the bundle before the cell. The test id comes from the fixture's `afterRenderer`, so
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
   * Reports whether the grid is currently listening for keyboard and clipboard input. This is the
   * exact state the re-select guard reads, and it is the observable proxy for a focus steal:
   * `selectCell` re-listens (and focuses the grid's own input), so it flips this back to `true`.
   */
  async isListening(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.isListening());
  }

  /**
   * Makes the grid stop listening while leaving the selection untouched.
   *
   * This is the exact precondition the focus-steal guard exists for: focus has left the grid, yet
   * the selection range still starts where the paste did - so the guard's later origin check would
   * PASS and only the `isListening()` test can stop the re-select. A real outside CLICK is the wrong
   * gesture here: it deselects the cell, and a null selection is caught by the earlier origin guard,
   * which would let this case pass without ever exercising the `isListening()` branch.
   */
  async unlisten(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).hot.unlisten());
  }

  /**
   * Releases every callback the async validator has parked, letting the deferred write settle.
   * Returns how many were released, so a case can prove the write really was held open.
   */
  async resolveValidations(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htResolveValidations());
  }

  /**
   * Returns how many validator callbacks are currently parked. The positive control that the paste's
   * write is genuinely deferred: greater than zero means row creation has not run yet.
   */
  async pendingValidationCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htPendingValidations.length);
  }

  /**
   * Selects a single cell and pastes a block into it through the `copyPaste` plugin.
   *
   * The paste is driven through `getPlugin('copyPaste').paste(text, '')` - the deterministic path,
   * since a synthetic Ctrl+V is handled in the browser process and never reaches the plugin. The
   * second argument is passed as an empty string on purpose: `paste(text)` alone defaults the HTML
   * flavor to `text`, so the block would be set as `text/html` too; passing `''` keeps this a pure
   * `text/plain` paste. `onPaste` bails when the grid is not listening or an editor is open, so the
   * selection goes through `selectCells()` (never a click, which could open the dropdown editor)
   * and `listen()` runs before the paste.
   */
  async pasteBlockAt(row: number, column: number, text: string): Promise<void> {
    await this.page.evaluate(([targetRow, targetColumn, pasted]) => {
      const hot = (window as unknown as FixtureWindow).hot;

      hot.selectCells([[targetRow as number, targetColumn as number, targetRow as number, targetColumn as number]]);
      hot.listen();
      hot.getPlugin('copyPaste').paste(pasted as string, '');
    }, [row, column, text] as [number, number, string]);
  }

  /**
   * Fires a paste through the plugin WITHOUT selecting a cell or calling `listen()` first, so
   * `onPaste` hits its early-return guard (the grid is not listening) and bails before writing.
   * This is the "an unrelated paste event reaches `onPaste` and bails" lever: it must NOT wipe a
   * still-pending earlier async paste's plan.
   */
  async pasteWhileNotListening(text: string): Promise<void> {
    await this.page.evaluate((pasted) => {
      (window as unknown as FixtureWindow).hot.getPlugin('copyPaste').paste(pasted as string, '');
    }, text);
  }

  /**
   * Returns the grid's current selection.
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSelected());
  }

  /**
   * Returns the number of records in the source data. The severity of this bug rides on this count:
   * a paste past the last row must grow it, and the post-paste selection must cover the grown rows.
   */
  async sourceRowCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.countSourceRows());
  }

  /**
   * Returns the whole source data set, in physical row order.
   */
  async sourceData(): Promise<unknown[][]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSourceData());
  }

  /**
   * Returns one value straight from the source data.
   */
  async sourceCell(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(
      ([targetRow, targetCol]) => (window as unknown as FixtureWindow).hot.getSourceDataAtCell(targetRow, targetCol),
      [row, col] as [number, number],
    );
  }

  /**
   * Returns how many changes the grid has committed since it was created. This is the positive
   * control that the paste WROTE and settled: a poll on the selection alone would pass on its first
   * sample, before a deferred validator had grown the grid, and prove nothing.
   */
  async changeCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htChanges.length);
  }
}
