import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

interface CopyPastePlugin {
  paste(pastableText: string): void;
}

interface HandsontableFixture {
  getSelected(): number[][] | undefined;
  selectCells(ranges: number[][]): void;
  listen(): void;
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
}

interface PageOptions {
  validated?: boolean;
  allowInsertRow?: boolean;
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

  constructor(page: Page, theme = 'main', bundle = 'umd', options: PageOptions = {}) {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.validated = options.validated ?? true;
    this.allowInsertRow = options.allowInsertRow ?? true;
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   */
  async goto(): Promise<void> {
    const query = `theme=${this.theme}&bundle=${this.bundle}` +
      `&validated=${this.validated ? 'on' : 'off'}` +
      `&allowInsertRow=${this.allowInsertRow ? 'on' : 'off'}`;

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
   * Selects a single cell and pastes a block into it through the `copyPaste` plugin.
   *
   * The paste is driven through `getPlugin('copyPaste').paste(text)`, which sets only `text/plain`
   * - the deterministic path, since a synthetic Ctrl+V is handled in the browser process and never
   * reaches the plugin. `onPaste` bails when the grid is not listening or an editor is open, so the
   * selection goes through `selectCells()` (never a click, which could open the dropdown editor)
   * and `listen()` runs before the paste.
   */
  async pasteBlockAt(row: number, column: number, text: string): Promise<void> {
    await this.page.evaluate(([targetRow, targetColumn, pasted]) => {
      const hot = (window as unknown as FixtureWindow).hot;

      hot.selectCells([[targetRow as number, targetColumn as number, targetRow as number, targetColumn as number]]);
      hot.listen();
      hot.getPlugin('copyPaste').paste(pasted as string);
    }, [row, column, text] as [number, number, string]);
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
