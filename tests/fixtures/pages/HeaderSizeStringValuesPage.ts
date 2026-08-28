import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the header size string values fixture (issue #6154).
 *
 * Both sizes are read from the master table, which is what the reader actually sees. The row header
 * width is taken from a body row's `th`, and the column header height from the first data column's
 * header cell - the second cell of the header row, because the first one is the corner.
 */
export class HeaderSizeStringValuesPage {
  /** The size every "works" case asks for, in CSS pixels. */
  static readonly SIZE = 100;

  /** Every grid the fixture builds. `goto()` waits for all of them. */
  static readonly GRID_IDS = [
    'row-string', 'row-px', 'row-array', 'row-number',
    'col-string', 'col-px', 'col-array',
    'row-invalid', 'col-invalid', 'defaults',
  ];

  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * The grid container carrying the given test id.
   *
   * @param {string} testId The container's test id.
   * @returns {Locator}
   */
  grid(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * The rendered width of the first row header cell, in CSS pixels.
   *
   * @param {string} testId The grid's test id.
   * @returns {Promise<number>}
   */
  async rowHeaderWidth(testId: string): Promise<number> {
    return this.grid(testId).locator('.ht_master tbody tr th').first()
      .evaluate(th => th.getBoundingClientRect().width);
  }

  /**
   * The rendered height of the first data column's header cell, in CSS pixels.
   *
   * @param {string} testId The grid's test id.
   * @returns {Promise<number>}
   */
  async columnHeaderHeight(testId: string): Promise<number> {
    return this.grid(testId).locator('.ht_master thead tr').first().locator('th').nth(1)
      .evaluate(th => th.getBoundingClientRect().height);
  }

  /**
   * Re-renders one grid a number of times.
   *
   * @param {string} name The grid's key in the fixture's `grids` object.
   * @param {number} times How many draws to force.
   */
  async renderRepeatedly(name: string, times: number): Promise<void> {
    await this.page.evaluate(
      ([gridName, count]) => (window as unknown as {
        renderRepeatedly: (name: string, times: number) => void
      }).renderRepeatedly(gridName as string, count as number),
      [name, times]
    );
  }

  /**
   * Starts collecting console warnings, and returns a reader for what has been collected.
   *
   * Call before `goto()`: the grids are built during page load, so the warning fires then.
   *
   * @returns {Function} Returns the warning texts collected up to the moment it is called.
   */
  collectWarnings(): () => string[] {
    const warnings: string[] = [];

    this.page.on('console', (message) => {
      if (message.type() === 'warning') {
        warnings.push(message.text());
      }
    });

    return () => [...warnings];
  }

  /**
   * Navigate and wait for the grids to have rendered - a real DOM condition, never a sleep.
   *
   * The wait is on the overlay clones rather than on the master's own header cells. Both sizes are
   * measured from the master, but the master's header cells are the copies the overlays draw over,
   * so they do not read as visible even once the grid is fully drawn. They still take up layout,
   * which is why measuring them is still correct.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/header-size-string-values.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    // Every grid a test measures has to be waited for, not just the first few: `evaluate` waits for
    // the element to attach, not for the grid to finish drawing, so an unwaited grid can be read
    // half-drawn.
    for (const testId of HeaderSizeStringValuesPage.GRID_IDS) {
      await expect(this.grid(testId).locator('.ht_clone_inline_start')).toBeVisible();
      await expect(this.grid(testId).locator('.ht_clone_top')).toBeVisible();
    }
  }
}
