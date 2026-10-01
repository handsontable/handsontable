import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

interface PaginationPasteFixture {
  selectCells(ranges: number[][]): void;
  listen(): void;
  getDataAtCol(column: number): unknown[];
  getPlugin(name: string): {
    copy(): void;
    paste(pastableText: string, pastableHtml?: string): void;
  };
}

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the full
// instance type, and narrowing it here would be a TS2430 conflict.
interface FixtureWindow {
  hot: PaginationPasteFixture;
}

/**
 * Page object for the fixture with a paginated grid (fifteen records, ten per page) whose
 * `fragmentSelection` option is toggled through the query string.
 */
export class PaginationPasteFragmentSelectionPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly fragmentSelection: boolean;

  constructor(page: Page, theme = 'main', bundle = 'umd', options: { fragmentSelection?: boolean } = {}) {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.fragmentSelection = options.fragmentSelection ?? true;
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/pagination-paste-fragment-selection.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&fragmentSelection=${this.fragmentSelection ? 'on' : 'off'}`
    );
    await awaitBundle(this.page);

    // Rethrow a constructor throw the fixture captured, instead of a bare "element(s) not found".
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
   * Selects a range of rows in the first column and copies it through the `copyPaste` plugin.
   */
  async copyRows(startRow: number, endRow: number): Promise<void> {
    await this.page.evaluate(([start, end]) => {
      const hot = (window as unknown as FixtureWindow).hot;

      hot.selectCells([[start, 0, end, 0]]);
      hot.listen();
      hot.getPlugin('copyPaste').copy();
    }, [startRow, endRow] as [number, number]);
  }

  /**
   * Selects one cell of the first column and pastes a plain-text block into it. With
   * `fragmentSelection` on, moving the selection does not refresh the plugin's copy-source ranges.
   */
  async pasteAt(row: number, text: string): Promise<void> {
    await this.page.evaluate(([targetRow, pasted]) => {
      const hot = (window as unknown as FixtureWindow).hot;

      hot.selectCells([[targetRow as number, 0, targetRow as number, 0]]);
      hot.listen();
      hot.getPlugin('copyPaste').paste(pasted as string, '');
    }, [row, text] as [number, string]);
  }

  /**
   * Returns the values of the first column, in visual order.
   */
  async columnValues(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getDataAtCol(0));
  }
}
