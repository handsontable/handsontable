import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

interface PasteValidationFixture {
  selectCells(ranges: number[][]): void;
  listen(): void;
  countRows(): number;
  getDataAtCol(column: number): unknown[];
  getCellMeta(row: number, col: number): { valid?: boolean };
  getPlugin(name: string): { paste(pastableText: string, pastableHtml?: string): void };
}

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the full
// instance type, and narrowing it here would be a TS2430 conflict.
interface FixtureWindow {
  hot: PasteValidationFixture;
}

/**
 * Page object for the fixture that pastes a block past the last row of a grid with `trimRows`. The
 * grid holds five source records, two of them trimmed, and a validator that accepts three brands.
 */
export class PasteValidationTrimRowsPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly trimmed: boolean;
  readonly readonlyTrimmed: boolean;

  constructor(page: Page, theme = 'main', bundle = 'umd', options: { trimmed?: boolean, readonlyTrimmed?: boolean } = {}) {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.trimmed = options.trimmed ?? true;
    this.readonlyTrimmed = options.readonlyTrimmed ?? false;
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/paste-validation-trim-rows.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&trim=${this.trimmed ? 'on' : 'off'}&readonlyTrimmed=${this.readonlyTrimmed ? 'on' : 'off'}`
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
   * Selects one cell and pastes a plain-text block into it through the `copyPaste` plugin.
   */
  async pasteAt(row: number, column: number, text: string): Promise<void> {
    await this.page.evaluate(([targetRow, targetColumn, pasted]) => {
      const hot = (window as unknown as FixtureWindow).hot;

      hot.selectCells([[targetRow as number, targetColumn as number, targetRow as number, targetColumn as number]]);
      hot.listen();
      hot.getPlugin('copyPaste').paste(pasted as string, '');
    }, [row, column, text] as [number, number, string]);
  }

  /**
   * Returns the values of the first column, in visual order.
   */
  async columnValues(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getDataAtCol(0));
  }

  /**
   * Returns the number of visual rows.
   */
  async countRows(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.countRows());
  }

  /**
   * Reports a cell's validation flag as a string, so "never validated" is not read as "valid".
   */
  async validState(row: number, col: number): Promise<'unvalidated' | 'valid' | 'invalid'> {
    return this.page.evaluate(([targetRow, targetColumn]) => {
      const { valid } = (window as unknown as FixtureWindow).hot.getCellMeta(targetRow, targetColumn);

      if (valid === undefined) {
        return 'unvalidated';
      }

      return valid ? 'valid' : 'invalid';
    }, [row, col] as [number, number]);
  }
}

