import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the `sanitizer` option fixture.
 *
 * The fixture records every `(content, source)` pair the grid hands to the
 * sanitizer and flips one flag if any payload manages to execute, so specs
 * assert on those two observables rather than on markup shape.
 */
export class SanitizerPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture and wait for the grid to render. Waits on the nested
   * header being present rather than a readiness flag - it is the surface under
   * test, so its presence is the real precondition.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/sanitizer.html?theme=${this.theme}&bundle=${this.bundle}`);
    await expect(this.nestedHeader()).toBeVisible();
  }

  /**
   * The top-level nested header banner. Column headers render in the top overlay
   * clone, not the master (whose `thead` is present but hidden), and the locator is
   * narrowed to the spanning `th` so the row-header corner cell cannot match.
   */
  nestedHeader(): Locator {
    return this.page.locator('.ht_clone_top thead tr').first()
      .locator('th[colspan="2"] .colHeader');
  }

  /** Whether any payload in the fixture executed. */
  async xssFired(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as { __xssFired: boolean }).__xssFired);
  }

  /** The `source` argument of every sanitizer call so far, in order. */
  async sanitizerContexts(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { __sanitizerCalls: [string, string][] })
      .__sanitizerCalls.map(([, source]) => source));
  }

  /**
   * Dispatch a real `paste` event carrying a real `DataTransfer`, so the grid
   * reads it through the browser's clipboard API rather than a test double.
   *
   * @param {Record<string, string>} data Clipboard payload keyed by MIME type.
   */
  async paste(data: Record<string, string>): Promise<void> {
    await this.page.evaluate((payload) => {
      const dataTransfer = new DataTransfer();

      Object.entries(payload).forEach(([type, value]) => dataTransfer.setData(type, value));

      document.activeElement?.dispatchEvent(new ClipboardEvent('paste', {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true,
      }));
    }, data);
  }

  /** Select a data cell so the grid has a paste target. */
  async selectCell(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      (window as unknown as { hot: { selectCell(r: number, c: number): void } }).hot.selectCell(r, c);
    }, [row, col]);
  }

  /** Read a rendered data cell's value through the grid's own API. */
  async cellValue(row: number, col: number): Promise<string> {
    return this.page.evaluate(([r, c]) => {
      return String((window as unknown as {
        hot: { getDataAtCell(r: number, c: number): unknown };
      }).hot.getDataAtCell(r, c));
    }, [row, col]);
  }
}
