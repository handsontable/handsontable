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
 * Something a case does right after the constructor, in the same task, so it lands before the first idle
 * chunk of the sweep.
 */
export type AfterBuild =
  'toggleAutoColumnSize' | 'toggleAutoColumnSizeWithoutRender' | 'enableAutoRowSize' | 'insertTwoColumnsAtStart' | 'selectCell0x25' | 'selectCell0x25InBatch' |
  'selectCell0x25WhileSuspended' | 'suspendRender' | 'recordRenderCount' | 'selectCell0x159' | 'scrollViewportToColumn159' | 'scrollViewportToColumn159CountingReads';

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
  getPlugin(name: string): {
    inProgress: boolean;
    enablePlugin(): void;
    disablePlugin(): void;
    recalculateAllColumnsWidth(): void;
  };
  alter(action: string, index: number, amount: number): void;
  selectCell(row: number, column: number): void;
  render(): void;
  updateSettings(settings: Record<string, unknown>): void;
  batch(wrappedOperations: () => void): void;
  suspendRender(): void;
  getFirstFullyVisibleColumn(): number | null;
  getLastFullyVisibleColumn(): number | null;
  resumeRender(): void;
  getRowHeight(row: number): number | undefined;
  getCellMetaTransient(row: number, column: number): unknown;
  rootElement: HTMLElement;
  view: { getFirstRenderedVisibleColumn(): number; getLastRenderedVisibleColumn(): number };
}

interface FixtureWindow extends Window {
  hot: FixtureHot;
  Handsontable: { hooks: { add(key: string, callback: () => void): void } };
  renderCount: number;
  rendersAtBuild: number;
  metaReadsDuringCall: number;
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
  async build(grid: SyncBudgetGrid, budget?: number, after?: AfterBuild): Promise<BuildResult> {
    const result = await this.page.evaluate(({ spec, cellsBudget, then }) => {
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

      const widths = Array.from({ length: win.hot.countCols() }, (_, column) => win.hot.getColWidth(column));
      const rowHeights = Array.from({ length: 10 }, (_, row) => win.hot.getRowHeight(row));
      const plugin = win.hot.getPlugin('autoColumnSize');

      switch (then) {
        case 'toggleAutoColumnSize':
          plugin.disablePlugin();
          plugin.enablePlugin();
          win.hot.render();
          break;
        case 'toggleAutoColumnSizeWithoutRender':
          plugin.disablePlugin();
          plugin.enablePlugin();
          break;
        case 'enableAutoRowSize':
          win.hot.updateSettings({ autoRowSize: true });
          break;
        case 'insertTwoColumnsAtStart':
          win.hot.alter('insert_col_start', 0, 2);
          break;
        case 'selectCell0x25':
          win.hot.selectCell(0, 25);
          break;
        case 'selectCell0x25InBatch':
          win.hot.batch(() => win.hot.selectCell(0, 25));
          break;
        case 'selectCell0x25WhileSuspended':
          win.hot.suspendRender();
          win.hot.selectCell(0, 25);
          win.hot.resumeRender();
          break;
        case 'suspendRender':
          win.hot.suspendRender();
          break;
        case 'selectCell0x159':
          win.hot.selectCell(0, 159);
          break;
        case 'scrollViewportToColumn159':
          win.hot.scrollViewportTo({ col: 159 });
          break;
        case 'scrollViewportToColumn159CountingReads': {
          // The sampler reads the cell meta of a column it measures, and the draw does not read it this way, so
          // the reads during the call are the columns the call measured.
          const read = win.hot.getCellMetaTransient;
          let reads = 0;

          win.hot.getCellMetaTransient = (row: number, column: number) => {
            reads += 1;

            return read(row, column);
          };

          try {
            win.hot.scrollViewportTo({ col: 159 });
          } finally {
            win.hot.getCellMetaTransient = read;
          }

          win.metaReadsDuringCall = reads;
          break;
        }
        case 'recordRenderCount':
          // Read in the constructor's task, before any idle chunk can end the sweep.
          win.rendersAtBuild = win.renderCount;
          break;
        default:
          break;
      }

      return {
        constructorColumns: win.constructorColumns,
        widths,
        // The rows in view, read before anything after the constructor can measure them again.
        rowHeights,
      };
    }, { spec: grid, cellsBudget: budget, then: after });

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
   * The heights of the first `count` rows, as the grid reads them now.
   */
  async rowHeights(count: number): Promise<Array<number | undefined>> {
    return this.page.evaluate((rows) => {
      const { hot } = window as unknown as FixtureWindow;

      return Array.from({ length: rows }, (_, row) => hot.getRowHeight(row));
    }, count);
  }

  /**
   * Calls the public `recalculateAllColumnsWidth()` and reports the visual columns it read cell meta for
   * before it returned.
   */
  async recalculateAllColumnsWidth(): Promise<number[]> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as FixtureWindow;
      const read = hot.getCellMetaTransient;
      const readColumns = new Set<number>();

      hot.getCellMetaTransient = (row: number, column: number) => {
        readColumns.add(column);

        return read(row, column);
      };

      try {
        hot.getPlugin('autoColumnSize').recalculateAllColumnsWidth();
      } finally {
        hot.getCellMetaTransient = read;
      }

      return Array.from(readColumns).sort((a, b) => a - b);
    });
  }

  /**
   * Waits for the sweep to end, resumes the rendering a case held with `build(…, 'suspendRender')`, and
   * reports how many cells the grid read cell meta for while the resumed render ran.
   */
  async resumeRenderAfterSweep(): Promise<number> {
    await this.waitForSweepEnd();

    return this.page.evaluate(() => {
      const { hot } = window as unknown as FixtureWindow;
      const read = hot.getCellMetaTransient;
      let probes = 0;

      hot.getCellMetaTransient = (row: number, column: number) => {
        probes += 1;

        return read(row, column);
      };

      try {
        hot.resumeRender();
      } finally {
        hot.getCellMetaTransient = read;
      }

      return probes;
    });
  }

  /**
   * Selects a cell and then resumes the rendering a case held with `build(…, 'suspendRender')`.
   */
  async selectCellAndResumeRender(row: number, column: number): Promise<void> {
    await this.page.evaluate(([visualRow, visualColumn]) => {
      const { hot } = window as unknown as FixtureWindow;

      hot.selectCell(visualRow, visualColumn);
      hot.resumeRender();
    }, [row, column]);
  }

  /**
   * The first and the last fully visible column, read in one evaluation.
   */
  async fullyVisibleColumns(): Promise<Array<number | null>> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as FixtureWindow;

      return [hot.getFirstFullyVisibleColumn(), hot.getLastFullyVisibleColumn()];
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

        // A `<col>` that is missing or has no inline width reads as NaN, which no comparison would flag.
        if (!Number.isFinite(drawn) || Math.abs(drawn - held) > 0.5) {
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
  async loadLongerData(grid: SyncBudgetGrid): Promise<{
    widths: number[]; readColumns: number[]; firstVisibleColumn: number | null;
  }> {
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
        firstVisibleColumn: hot.getFirstFullyVisibleColumn(),
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

  /**
   * Counts the draws of every grid the fixture builds from now on. A case reads the draws made after the
   * constructor with `build(…, 'recordRenderCount')` and `rendersSinceBuild()`.
   */
  async countRenders(): Promise<void> {
    await this.page.evaluate(() => {
      const win = window as unknown as FixtureWindow;

      win.renderCount = 0;
      win.rendersAtBuild = 0;
      win.Handsontable.hooks.add('afterRender', () => {
        win.renderCount += 1;
      });
    });
  }

  /**
   * The draws made since the grid built with `build(…, 'recordRenderCount')` returned from its constructor.
   */
  async rendersSinceBuild(): Promise<number> {
    return this.page.evaluate(() => {
      const win = window as unknown as FixtureWindow;

      return win.renderCount - win.rendersAtBuild;
    });
  }

  /**
   * Calls `scrollViewportTo({ col })` once, with no `render()` before it, and does not wait for a draw.
   */
  async scrollViewportToColumn(column: number): Promise<void> {
    await this.page.evaluate((col) => {
      (window as unknown as FixtureWindow).hot.scrollViewportTo({ col });
    }, column);
  }

  /**
   * The cell meta reads the call made by `build(…, 'scrollViewportToColumn159CountingReads')` caused.
   */
  async metaReadsDuringCall(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).metaReadsDuringCall);
  }

  /**
   * Whether the cell is drawn and any part of it lies inside the master holder's visible box. A column wider
   * than the viewport is never fully visible, so the full-visibility reads cannot say.
   */
  async cellIsInView(row: number, column: number): Promise<boolean> {
    return this.page.evaluate(([visualRow, visualColumn]) => {
      const { hot } = window as unknown as FixtureWindow;
      const cell = (hot as unknown as { getCell(r: number, c: number): HTMLElement | null }).getCell(visualRow, visualColumn);
      const holder = hot.rootElement.querySelector('.ht_master .wtHolder') as HTMLElement;

      if (cell === null) {
        return false;
      }

      const box = cell.getBoundingClientRect();
      const view = holder.getBoundingClientRect();

      return box.right > view.left && box.left < view.right;
    }, [row, column]);
  }

  /**
   * The last column the master table renders.
   */
  async lastRenderedColumn(): Promise<number> {
    return this.page.evaluate(() => {
      return (window as unknown as FixtureWindow).hot.view.getLastRenderedVisibleColumn();
    });
  }
}
