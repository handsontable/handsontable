import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the header markup gate fixture.
 *
 * The fixture parameterizes one header label and records the two observables the
 * gate's contract is written in: every missing-sanitizer warning the grid emitted,
 * and every `(content, source)` pair it handed to a configured sanitizer.
 */
export class HeaderMarkupGatePage {
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
   * Navigate to the fixture and wait for the first column header to render.
   *
   * @param {Record<string, string>} params Fixture parameters: `colHeader` and `nested`
   * (`prose`, `angle`, `markup`, or `entity`), and `sanitizer` (`truncate`).
   */
  async goto(params: Record<string, string> = {}): Promise<void> {
    const query = new URLSearchParams({ theme: this.theme, bundle: this.bundle, ...params });

    await this.page.goto(`/tests/fixtures/demo/header-markup-gate.html?${query}`);
    // Wait for the bundle on its own budget before asserting on anything the fixture rendered.
    // `expect` is the wrong tool for that wait: every worker pulls its own ~6 MB copy of
    // `dist/handsontable.js`, so a cold server outlasts the 10s timeout.
    await this.page.waitForFunction(() => 'Handsontable' in window);
    await expect(this.columnHeader()).toBeVisible();
  }

  /**
   * The first column header's label. Column headers render in the top overlay clone,
   * not the master (whose `thead` is present but hidden), and the row-header corner
   * cell is skipped by taking the second `th`.
   */
  columnHeader(): Locator {
    return this.page.locator('.ht_clone_top thead tr').last()
      .locator('th').nth(1)
      .locator('.colHeader');
  }

  /** The spanning label of the top nested-header row. */
  nestedHeader(): Locator {
    return this.page.locator('.ht_clone_top thead tr').first()
      .locator('th[colspan="2"] .colHeader');
  }

  /**
   * Force a second render pass, so a spec can show that a warning absent after the first is
   * still absent after another one - the case a one-shot read on its own would miss.
   */
  async rerender(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { hot: { render(): void } }).hot.render();
    });
  }

  /** Every warning the grid logged, in order. */
  async warnings(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { __warnings: string[] }).__warnings);
  }

  /** Whether the grid warned that HTML was written with no sanitizer configured. */
  async warnedAboutMissingSanitizer(): Promise<boolean> {
    return (await this.warnings()).some(warning => warning.includes('without a sanitizer'));
  }

  /** The content argument of every sanitizer call so far, in order. */
  async sanitizerContents(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { __sanitizerCalls: [string, string][] })
      .__sanitizerCalls.map(([content]) => content));
  }

  /**
   * How many times the sanitizer was handed exactly this content. Both the rendered header and
   * the ghost table that measures it sanitize the same label under the same source, so the count
   * is the only observable that distinguishes one surface from both.
   *
   * @param {string} content The exact content to count.
   */
  async sanitizerCallsFor(content: string): Promise<number> {
    return (await this.sanitizerContents()).filter(seen => seen === content).length;
  }

  /** The `source` argument of every sanitizer call so far, in order. */
  async sanitizerContexts(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { __sanitizerCalls: [string, string][] })
      .__sanitizerCalls.map(([, source]) => source));
  }
}
