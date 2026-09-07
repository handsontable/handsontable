import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the "`numericRenderer` receives a shared array `className`" fixture (DEV-2618,
 * follow-up to GitHub #7427 / DEV-2604).
 *
 * The renderer used to alias the array it was handed and push `htRight` / `htNumeric` into it. A
 * grid-level or column-level array is one instance shared by every cell through the cell meta
 * prototype chain, so the page object exposes the two things that damaged — the class tokens on a
 * cell of a column that merely shares the array, and the source array itself.
 */
export class NumericArrayClassNamePage {
  /** Grid-level array shared by a numeric column and a text column. */
  static readonly GRID_LEVEL = 'grid-level';
  /** The same array instance handed to two columns explicitly. */
  static readonly COLUMN_LEVEL = 'column-level';
  /** The plain string path, for regression cover. */
  static readonly STRING_PATH = 'string-path';
  /** A shared array that already carries an alignment class. */
  static readonly ALIGNED = 'aligned';

  /** Every grid the fixture builds. */
  static readonly ALL_GRIDS = ['grid-level', 'column-level', 'string-path', 'aligned'];

  /** The two classes the fixture passes as an array. */
  static readonly USER_CLASSES = ['shared', 'mark'];

  /** The classes `numericRenderer` adds to a numeric cell that has no alignment of its own. */
  static readonly NUMERIC_CLASSES = ['htNumeric', 'htRight'];

  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /** Navigate and wait for every grid to have rendered — a real DOM condition, never a sleep. */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/numeric-array-classname.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    // Report a constructor that threw as the error it threw, not as a visibility timeout. The
    // fixture stamps `data-init-error` synchronously while the page script runs, so by the time
    // `goto()` resolves it is either set or never will be — read it before waiting on anything.
    for (const gridId of NumericArrayClassNamePage.ALL_GRIDS) {
      const initError = await this.initError(gridId);

      if (initError !== null) {
        throw new Error(`Grid "${gridId}" failed to build: ${initError}`);
      }
    }

    for (const gridId of NumericArrayClassNamePage.ALL_GRIDS) {
      await expect(this.grid(gridId).locator('.ht_master')).toBeVisible();
    }
  }

  /** One of the grid containers. */
  grid(gridId: string): Locator {
    return this.page.getByTestId(gridId);
  }

  /** The message of the error the grid's constructor threw, or `null` when it built cleanly. */
  async initError(gridId: string): Promise<string | null> {
    return this.grid(gridId).getAttribute('data-init-error');
  }

  /** One data cell of one grid. Plain cells live only in `.ht_master`, so this hooks cleanly. */
  cell(gridId: string, row: number, column: number): Locator {
    return this.grid(gridId).locator('.ht_master').getByTestId(`cell-${row}-${column}`);
  }

  /**
   * The class tokens actually on a cell, sorted so the assertion does not depend on the order the
   * renderer happened to append in.
   */
  async cellClasses(gridId: string, row: number, column: number): Promise<string[]> {
    const className = await this.cell(gridId, row, column).getAttribute('class') ?? '';

    return className.split(' ').filter(token => token.length > 0).sort();
  }

  /**
   * The `className` array the fixture passed in, read back after rendering.
   *
   * This is the leak itself: the renderer pushing into the value it was handed rather than into a
   * copy leaves `htRight` and `htNumeric` sitting in the user's own array.
   */
  async sourceArray(gridId: string): Promise<string[]> {
    return this.page.evaluate(
      id => (window as unknown as { sourceArrays: Record<string, string[]> }).sourceArrays[id as string],
      gridId
    );
  }

  /** Force another full draw, so an accumulating push would show up as a growing array. */
  async render(gridId: string): Promise<void> {
    await this.page.evaluate(
      id => {
        const hot = (window as unknown as {
          hots: Record<string, { render: () => void }>;
        }).hots[id as string];

        hot.render();
      },
      gridId
    );
  }
}
