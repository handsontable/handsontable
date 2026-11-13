import { type Page, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';
import { dragResizeHandle } from '../gestures';

/**
 * The settings a case builds its grid with. Only JSON-serializable values cross into the page.
 */
export interface GridSettings {
  data: unknown[][];
  mergeCells?: Array<{ row: number; col: number; rowspan: number; colspan: number }> | boolean;
  columns?: Array<Record<string, unknown>>;
  hiddenColumns?: { columns: number[] };
  hiddenRows?: { rows: number[] };
  autoColumnSize?: { syncLimit: number };
  stretchH?: 'all' | 'last' | 'none';
  width?: number;
  manualColumnResize?: boolean;
  manualColumnMove?: boolean;
  columnSorting?: boolean;
  trimRows?: boolean;
  rowHeaders?: boolean;
  cell?: Array<{ row: number; col: number; className: string }>;
}

/**
 * A plugin method the spec calls at runtime, by plugin name. Only JSON-serializable arguments cross into
 * the page.
 */
export type PluginCall =
  | ['hiddenRows', 'showRows' | 'hideRows', number[]]
  | ['hiddenColumns', 'showColumns' | 'hideColumns', number[]]
  | ['undoRedo', 'undo' | 'redo']
  | ['manualColumnResize', 'setManualSize', number, number]
  | ['manualColumnMove', 'moveColumn', number, number]
  | ['columnSorting', 'sort', { column: number, sortOrder: 'asc' | 'desc' }]
  | ['trimRows', 'trimRows' | 'untrimRows', number[]];

interface FixtureHot {
  countCols(): number;
  getColWidth(column: number): number;
  setDataAtCell(row: number, column: number, value: unknown): void;
  setCellMeta(row: number, column: number, key: string, value: unknown): void;
  getCell(row: number, column: number): HTMLElement | null;
  alter(action: string, index: number): void;
  loadData(data: unknown[][]): void;
  updateData(data: unknown[][]): void;
  updateSettings(settings: Record<string, unknown>): void;
  rootElement: HTMLElement;
  render(): void;
  getPlugin(name: string): Record<string, (...args: unknown[]) => unknown>;
}

interface FixtureWindow extends Window {
  hot: FixtureHot;
  buildGrid(settings: GridSettings): void;
}

/**
 * Page Object for the fixture with one auto-sized grid that each case rebuilds with its own data and
 * merges. AutoColumnSize measures every column, because no case sets `colWidths`.
 */
export class AutoColumnSizeMergedCellsPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture and waits for the placeholder grid to be built and rendered.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/auto-column-size-merged-cells.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.page.getByTestId('grid').locator('.ht_master td').first()).toBeVisible();
  }

  /**
   * Rebuilds the grid with the given settings and returns the column widths it renders with.
   */
  async build(settings: GridSettings): Promise<number[]> {
    await this.page.evaluate(gridSettings => (window as unknown as FixtureWindow).buildGrid(gridSettings), settings);
    await expect(this.page.getByTestId('grid').locator('.ht_master td').first()).toBeVisible();

    return this.widths();
  }

  /**
   * The width of every column, as the grid renders it.
   */
  async widths(): Promise<number[]> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as FixtureWindow;

      return Array.from({ length: hot.countCols() }, (_, column) => hot.getColWidth(column));
    });
  }

  /**
   * Merges a range through the MergeCells API, the way the context menu does.
   */
  async merge(startRow: number, startColumn: number, endRow: number, endColumn: number): Promise<void> {
    await this.page.evaluate(([r1, c1, r2, c2]) => {
      (window as unknown as FixtureWindow).hot.getPlugin('mergeCells').merge!(r1, c1, r2, c2);
    }, [startRow, startColumn, endRow, endColumn]);
  }

  /**
   * Unmerges a range through the MergeCells API, the way the context menu does.
   */
  async unmerge(startRow: number, startColumn: number, endRow: number, endColumn: number): Promise<void> {
    await this.page.evaluate(([r1, c1, r2, c2]) => {
      (window as unknown as FixtureWindow).hot.getPlugin('mergeCells').unmerge!(r1, c1, r2, c2);
    }, [startRow, startColumn, endRow, endColumn]);
  }

  /**
   * Calls a plugin method, then renders, the way an application's call followed by `render()` does.
   */
  async callPlugin(...call: PluginCall): Promise<void> {
    await this.page.evaluate(([plugin, method, ...args]) => {
      const { hot } = window as unknown as FixtureWindow;

      hot.getPlugin(plugin)[method]!(...args);
      hot.render();
    }, call);
  }

  /**
   * Resizes a column the way a user does: hovers its header, then drags the resize handle that appears.
   */
  async dragColumnResizeHandle(visualColumn: number, deltaX: number): Promise<void> {
    const handle = this.page.getByTestId('grid').locator('.manualColumnResizer');

    // Park the pointer first, so hovering the header produces the `mouseover` the plugin reacts to.
    await this.page.mouse.move(0, 0);
    // `nth(column + 1)` skips the corner cell.
    await this.page.getByTestId('grid').locator('.ht_clone_top thead tr').first().locator('th')
      .nth(visualColumn + 1)
      .hover();
    await expect(handle).toBeVisible();
    await dragResizeHandle(this.page, handle, { x: deltaX });
  }

  /**
   * Undoes or redoes the last action with no render after it, the way Ctrl+Z does: the undo renders
   * by itself, so what it leaves on screen is what the user sees.
   */
  async undoRedo(action: 'undo' | 'redo'): Promise<void> {
    await this.page.evaluate((name) => {
      (window as unknown as FixtureWindow).hot.getPlugin('undoRedo')[name]!();
    }, action);
  }

  /**
   * Inserts one column before the given one.
   */
  async insertColumnBefore(column: number): Promise<void> {
    await this.page.evaluate(index => (window as unknown as FixtureWindow).hot.alter('insert_col_start', index), column);
  }

  /**
   * Replaces the data through `loadData()`.
   */
  async loadData(data: unknown[][]): Promise<void> {
    await this.page.evaluate(rows => (window as unknown as FixtureWindow).hot.loadData(rows), data);
  }

  /**
   * Sets a cell meta key, then renders, the way an application's call followed by `render()` does.
   */
  async setCellMeta(row: number, column: number, key: string, value: unknown): Promise<void> {
    await this.page.evaluate(([r, c, k, v]) => {
      const { hot } = window as unknown as FixtureWindow;

      hot.setCellMeta(r as number, c as number, k as string, v);
      hot.render();
    }, [row, column, key, value]);
  }

  /**
   * Adds a stylesheet rule to the page, the way an application changes its CSS at runtime.
   */
  async addStyle(css: string): Promise<void> {
    await this.page.evaluate((rule) => {
      const style = document.createElement('style');

      style.textContent = rule;
      document.head.appendChild(style);
    }, css);
  }

  /**
   * Removes one column through `alter()`.
   */
  async removeColumn(column: number): Promise<void> {
    await this.page.evaluate(index => (window as unknown as FixtureWindow).hot.alter('remove_col', index), column);
  }

  /**
   * Replaces the data through `updateData()`, which keeps the merges (the wrappers' path).
   */
  async updateData(data: unknown[][]): Promise<void> {
    await this.page.evaluate(rows => (window as unknown as FixtureWindow).hot.updateData(rows), data);
  }

  /**
   * Applies settings through `updateSettings()`.
   */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(next => (window as unknown as FixtureWindow).hot.updateSettings(next), settings);
  }

  /**
   * Renders the grid, the way an application's `render()` call does.
   */
  async render(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).hot.render());
  }

  /**
   * Scrolls the grid's own holder until a column is rendered, the way a wheel or a scrollbar does.
   * That draw re-measures only the columns with no width yet, unlike `scrollViewportTo()`, whose full
   * render re-measures every rendered column and would hide a stale width.
   */
  async scrollToColumn(column: number): Promise<void> {
    await this.page.evaluate((col) => {
      const { hot } = window as unknown as FixtureWindow;
      const holder = hot.rootElement.querySelector<HTMLElement>('.ht_master .wtHolder');
      let offset = 0;

      for (let index = 0; index < col; index++) {
        offset += hot.getColWidth(index);
      }

      if (holder) {
        holder.scrollLeft = offset;
      }
    }, column);
    await expect.poll(() => this.page.evaluate(
      col => (window as unknown as FixtureWindow).hot.getCell(0, col) !== null, column
    )).toBe(true);
  }

  /**
   * Tells whether the text of a cell fits on one line: the cell is no taller than a cell of another
   * row holding a single short word. Both are read in one round trip.
   */
  async fitsOnOneLine(row: number, column: number, referenceRow: number): Promise<boolean> {
    return this.page.evaluate(([r, c, ref]) => {
      const { hot } = window as unknown as FixtureWindow;
      const cell = hot.getCell(r, c);
      const reference = hot.getCell(ref, c);

      return cell !== null && reference !== null && cell.offsetHeight <= reference.offsetHeight;
    }, [row, column, referenceRow]);
  }

  /**
   * Writes a value through `setDataAtCell()`, the path an edit takes.
   */
  async setDataAtCell(row: number, column: number, value: unknown): Promise<void> {
    await this.page.evaluate(([r, c, v]) => {
      (window as unknown as FixtureWindow).hot.setDataAtCell(r as number, c as number, v);
    }, [row, column, value]);
  }
}
