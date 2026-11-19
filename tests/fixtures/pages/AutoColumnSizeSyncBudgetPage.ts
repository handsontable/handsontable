import { type Page, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * The grid a case builds: `rows` × `cols` of text whose longest value differs per column, plus settings that
 * cross into the page as JSON. A column listed in `numericColumns` holds numbers and the `numeric` type.
 */
export interface SyncBudgetGrid {
  rows: number;
  cols: number;
  numericColumns?: number[];
  values?: Array<{ row: number; col: number; value: string }>;
  settings?: Record<string, unknown>;
}

/**
 * What the constructor did: the visual columns it read cell meta for (the columns measured before the
 * first paint), every column's width, and the heights of the first ten rows, right after it returned.
 */
export interface BuildResult {
  constructorColumns: number[];
  widths: number[];
  rowHeights: Array<number | undefined>;
}

interface FixtureHot {
  countCols(): number;
  getColWidth(column: number): number;
  loadData(data: unknown[][]): void;
  scrollViewportTo(options: { col: number; horizontalSnap?: 'start' | 'end' }): boolean;
  getPlugin(name: string): { inProgress: boolean };
  getRowHeight(row: number): number | undefined;
  getCellMetaTransient(row: number, column: number): unknown;
  rootElement: HTMLElement;
  view: { getFirstRenderedVisibleColumn(): number; getLastRenderedVisibleColumn(): number };
}

interface FixtureWindow extends Window {
  hot: FixtureHot;
  constructorColumns: number[];
  buildGrid(settings: Record<string, unknown>, budget?: number): void;
}

/**
 * Page Object for the AutoColumnSize sync budget fixture. Each case rebuilds the one grid, optionally with
 * a lowered `AutoColumnSize.SYNC_CELLS_BUDGET`, so a small grid takes the path a tall grid takes by default.
 */
export class AutoColumnSizeSyncBudgetPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture and waits for the placeholder grid.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/auto-column-size-sync-budget.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.page.getByTestId('grid').locator('.ht_master td').first()).toBeVisible();
  }

  /**
   * Builds the grid and reports what its constructor measured. `budget` replaces the plugin's synchronous
   * cell budget for this grid; leave it out to build with the plugin's own.
   */
  async build(grid: SyncBudgetGrid, budget?: number): Promise<BuildResult> {
    const result = await this.page.evaluate(({ spec, cellsBudget }) => {
      const win = window as unknown as FixtureWindow;
      const numeric = new Set(spec.numericColumns ?? []);
      const data = Array.from({ length: spec.rows }, (_, row) => Array.from({ length: spec.cols }, (__, col) => {
        if (numeric.has(col)) {
          return (row * 1013 + col) % 99991;
        }

        // The longest value of a column grows with the column, and the very last row holds it, so a
        // measure that skipped rows would come out narrower.
        const length = row === spec.rows - 1 ? 6 + col : 1 + ((row * 7 + col * 3) % (4 + col));

        return `${col}:${'w'.repeat(length)}`;
      }));

      (spec.values ?? []).forEach(({ row, col, value }) => {
        data[row][col] = value;
      });

      const columns = spec.numericColumns ?
        Array.from({ length: spec.cols }, (_, col) => (numeric.has(col) ? { type: 'numeric' } : {})) :
        undefined;

      win.buildGrid({ data, ...(columns ? { columns } : {}), ...spec.settings }, cellsBudget);

      return {
        constructorColumns: win.constructorColumns,
        widths: Array.from({ length: win.hot.countCols() }, (_, column) => win.hot.getColWidth(column)),
        // The rows in view, read before anything after the constructor can measure them again.
        rowHeights: Array.from({ length: 10 }, (_, row) => win.hot.getRowHeight(row)),
      };
    }, { spec: grid, cellsBudget: budget });

    await expect(this.page.getByTestId('grid').locator('.ht_master td').first()).toBeVisible();

    return result;
  }

  /**
   * Every column's width, as the grid reads it now.
   */
  async widths(): Promise<number[]> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as FixtureWindow;

      return Array.from({ length: hot.countCols() }, (_, column) => hot.getColWidth(column));
    });
  }

  /**
   * The rendered master columns whose drawn `<col>` width differs from the width the grid holds, read in one
   * evaluation as `column: drawn vs held`.
   */
  async staleDrawnColumns(): Promise<string[]> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as FixtureWindow;
      const first = hot.view.getFirstRenderedVisibleColumn();
      const last = hot.view.getLastRenderedVisibleColumn();
      // The first `<col>` is the row header's.
      const cols = Array.from(hot.rootElement.querySelectorAll<HTMLElement>('.ht_master colgroup col')).slice(1);
      const stale: string[] = [];

      for (let column = first; column <= last; column++) {
        const drawn = parseFloat(cols[column - first]?.style.width ?? '');
        const held = hot.getColWidth(column);

        if (Math.abs(drawn - held) > 0.5) {
          stale.push(`${column}: ${drawn} vs ${held}`);
        }
      }

      return stale;
    });
  }

  /**
   * Resolves once the plugin has no sweep in progress.
   */
  async waitForSweepEnd(): Promise<void> {
    await expect.poll(() => this.page.evaluate(() => {
      return (window as unknown as FixtureWindow).hot.getPlugin('autoColumnSize').inProgress;
    })).toBe(false);
  }

  /**
   * The visual columns whose header the grid draws inside the visible part of its holder, read from the
   * master table and the frozen clones in one evaluation.
   */
  async onScreenColumns(): Promise<number[]> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as FixtureWindow;
      const holder = hot.rootElement.querySelector('.ht_master .wtHolder') as HTMLElement;
      const box = holder.getBoundingClientRect();
      const visibleStart = box.left;
      const visibleEnd = box.left + holder.clientWidth;
      const columns = new Set<number>();
      const headers = hot.rootElement.querySelectorAll('.ht_clone_top thead tr:last-child th, ' +
        '.ht_clone_top_inline_start_corner thead tr:last-child th, .ht_clone_top_inline_end_corner thead tr:last-child th');

      headers.forEach((header) => {
        const label = header.querySelector('.colHeader');
        const rect = header.getBoundingClientRect();

        if (label === null || rect.width === 0 || rect.right <= visibleStart || rect.left >= visibleEnd) {
          return;
        }

        const column = (hot as unknown as { getCoords(el: Element): { col: number } }).getCoords(header).col;

        if (column >= 0) {
          columns.add(column);
        }
      });

      return Array.from(columns).sort((a, b) => a - b);
    });
  }

  /**
   * Scrolls the viewport so the column starts at its inline start edge, and waits for the draw that shows it.
   */
  async scrollColumnToStart(column: number): Promise<void> {
    await this.page.evaluate((col) => {
      (window as unknown as FixtureWindow).hot.scrollViewportTo({ col, horizontalSnap: 'start' });
    }, column);
    await expect.poll(() => this.page.evaluate(() => {
      return (window as unknown as FixtureWindow).hot.view.getFirstRenderedVisibleColumn();
    })).toBeGreaterThan(0);
  }

  /**
   * Loads data of the same shape with every value made longer, and reports the widths `loadData()` left
   * behind before anything else ran, and the visual columns it read cell meta for.
   */
  async loadLongerData(grid: SyncBudgetGrid): Promise<{ widths: number[]; readColumns: number[] }> {
    return this.page.evaluate((spec) => {
      const { hot } = window as unknown as FixtureWindow;
      const read = hot.getCellMetaTransient;
      const readColumns = new Set<number>();
      const data = Array.from({ length: spec.rows }, (_, row) => Array.from({ length: spec.cols }, (__, col) => {
        const length = row === spec.rows - 1 ? 12 + col : 3 + ((row * 5 + col) % (6 + col));

        return `${col}:${'m'.repeat(length)}`;
      }));

      hot.getCellMetaTransient = (row: number, column: number) => {
        readColumns.add(column);

        return read(row, column);
      };

      try {
        hot.loadData(data);
      } finally {
        hot.getCellMetaTransient = read;
      }

      return {
        widths: Array.from({ length: hot.countCols() }, (_, column) => hot.getColWidth(column)),
        readColumns: Array.from(readColumns).sort((a, b) => a - b),
      };
    }, grid);
  }

  /**
   * The width of the content the master holder scrolls over.
   */
  async scrollWidth(): Promise<number> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as FixtureWindow;

      return (hot.rootElement.querySelector('.ht_master .wtHolder') as HTMLElement).scrollWidth;
    });
  }
}
