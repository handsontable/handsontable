import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the "hiding plugins receive an array `className`" fixture
 * (GitHub #7427 / DEV-2604).
 *
 * The fixture holds four independent grids, addressed by the ids below. Each one hands
 * `hiddenRows` or `hiddenColumns` an array `className`; the page object exposes the two things the
 * bug damaged — whether the grid rendered at all, and the exact set of class tokens on a cell.
 */
export class HidingArrayClassNamePage {
  /** `hiddenRows` enabled with nothing hidden — the issue's own fiddle. */
  static readonly ROWS_NONE = 'rows-none';
  /** `hiddenRows` with row 0 hidden, so row 1 carries the `afterHiddenRow` marker. */
  static readonly ROWS_HIDDEN = 'rows-hidden';
  /** `hiddenColumns` enabled with nothing hidden. */
  static readonly COLS_NONE = 'cols-none';
  /** `hiddenColumns` with column 0 hidden, so column 1 carries the `afterHiddenColumn` marker. */
  static readonly COLS_HIDDEN = 'cols-hidden';
  /** Grid-level array `className` — one array instance shared by every cell. */
  static readonly GRID_LEVEL = 'grid-level';
  /** Both hiding plugins on one grid. */
  static readonly BOTH_PLUGINS = 'both-plugins';
  /** A user class that contains the marker name as a substring. */
  static readonly SUBSTRING = 'substring';
  /** The plain string path, for regression cover. */
  static readonly STRING_PATH = 'string-path';

  /** Every grid the fixture builds. */
  static readonly ALL_GRIDS = [
    'rows-none', 'rows-hidden', 'cols-none', 'cols-hidden',
    'grid-level', 'both-plugins', 'substring', 'string-path',
  ];

  /** The two classes the fixture passes as an array. */
  static readonly USER_CLASSES = ['test', 'test2'];

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
      `/tests/fixtures/demo/hiding-array-classname.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    const gridIds = HidingArrayClassNamePage.ALL_GRIDS;

    // Report a constructor that threw as the error it threw, not as a visibility timeout. The
    // fixture stamps `data-init-error` synchronously while the page script runs, so by the time
    // `goto()` resolves it is either set or never will be — read it before waiting on anything.
    for (const gridId of gridIds) {
      const initError = await this.initError(gridId);

      if (initError !== null) {
        throw new Error(`Grid "${gridId}" failed to build: ${initError}`);
      }
    }

    for (const gridId of gridIds) {
      await expect(this.grid(gridId).locator('.ht_master')).toBeVisible();
    }
  }

  /** One of the four grid containers. */
  grid(gridId: string): Locator {
    return this.page.getByTestId(gridId);
  }

  /**
   * The message of the error the grid's constructor threw, or `null` when it built cleanly.
   *
   * This is what the loud half of the bug produced: `cellProperties.className.split is not a
   * function`, raised inside `afterGetCellMeta` while the first render walked the cells.
   */
  async initError(gridId: string): Promise<string | null> {
    return this.grid(gridId).getAttribute('data-init-error');
  }

  /** One data cell of one grid. Plain cells live only in `.ht_master`, so this hooks cleanly. */
  cell(gridId: string, row: number, column: number): Locator {
    return this.grid(gridId).locator('.ht_master').getByTestId(`cell-${row}-${column}`);
  }

  /**
   * The class tokens actually on a cell, sorted so the assertion does not depend on the order the
   * plugin happened to append in.
   *
   * Read as a token list rather than a raw string on purpose: the silent half of the bug produced
   * the single token `test,test2`, which a substring check on the class attribute would happily
   * accept as containing "test".
   */
  async cellClasses(gridId: string, row: number, column: number): Promise<string[]> {
    const className = await this.cell(gridId, row, column).getAttribute('class') ?? '';

    return className.split(' ').filter(token => token.length > 0).sort();
  }

  /** The `className` the plugin left behind in the cell's meta. */
  async cellMetaClassName(gridId: string, row: number, column: number): Promise<unknown> {
    return this.page.evaluate(
      ([id, r, c]) => {
        const hot = (window as unknown as {
          hots: Record<string, { getCellMeta: (row: number, col: number) => { className?: unknown } }>;
        }).hots[id as string];

        return hot.getCellMeta(r as number, c as number).className ?? null;
      },
      [gridId, row, column] as [string, number, number]
    );
  }

  /**
   * Whether the plugin left an OWN `className` on the cell meta, rather than letting the
   * column-level or grid-level value keep cascading through the prototype chain.
   *
   * This is what the write-on-change guard protects. Without it the hook materializes an own
   * property on every cell it merely reads, which shadows the cascade — and nothing else in the
   * suite can see that happen, because the rendered classes come out the same either way.
   */
  async hasOwnClassName(gridId: string, row: number, column: number): Promise<boolean> {
    return this.page.evaluate(
      ([id, r, c]) => {
        const hot = (window as unknown as {
          hots: Record<string, { getCellMeta: (row: number, col: number) => object }>;
        }).hots[id as string];

        return Object.prototype.hasOwnProperty.call(hot.getCellMeta(r as number, c as number), 'className');
      },
      [gridId, row, column] as [string, number, number]
    );
  }

  /**
   * The grid-level `className` array the fixture passed in, read back after rendering.
   *
   * A grid-level array is ONE instance shared by every cell through the meta prototype chain, so a
   * plugin that pushed into the value it was handed would leak its marker into all of them.
   */
  async gridLevelSourceArray(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { gridLevelClassName: string[] }).gridLevelClassName);
  }

  /** Show the rows again, so the plugin has to take its marker class back off. */
  async showRows(gridId: string, rows: number[]): Promise<void> {
    await this.page.evaluate(
      ([id, rowsToShow]) => {
        const hot = (window as unknown as {
          hots: Record<string, { getPlugin: (name: string) => { showRows: (r: number[]) => void }; render: () => void }>;
        }).hots[id as string];

        hot.getPlugin('hiddenRows').showRows(rowsToShow as number[]);
        hot.render();
      },
      [gridId, rows] as [string, number[]]
    );
  }

  /** Show the columns again, so the plugin has to take its marker class back off. */
  async showColumns(gridId: string, columns: number[]): Promise<void> {
    await this.page.evaluate(
      ([id, columnsToShow]) => {
        const hot = (window as unknown as {
          hots: Record<string, {
            getPlugin: (name: string) => { showColumns: (c: number[]) => void }; render: () => void;
          }>;
        }).hots[id as string];

        hot.getPlugin('hiddenColumns').showColumns(columnsToShow as number[]);
        hot.render();
      },
      [gridId, columns] as [string, number[]]
    );
  }
}
