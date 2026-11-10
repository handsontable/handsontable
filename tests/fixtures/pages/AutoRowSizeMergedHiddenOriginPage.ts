import { type Page, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';

/**
 * The settings a case builds its grid with. Only JSON-serializable values cross into the page.
 */
export interface GridSettings {
  mergeCells?: Array<{ row: number; col: number; rowspan: number; colspan: number }>;
  hiddenRows?: { rows: number[] } | boolean;
  hiddenColumns?: { columns: number[] } | boolean;
  colWidths?: number | number[];
  trimRows?: boolean;
  filters?: boolean;
  manualRowMove?: boolean;
  manualColumnMove?: boolean;
  manualColumnFreeze?: boolean;
  height?: number;
  dataRows?: number;
}

/**
 * A plugin method the spec calls at runtime, by plugin name. Only JSON-serializable arguments cross into
 * the page.
 */
export type PluginCall =
  | ['hiddenRows', 'showRows' | 'hideRows', number[]]
  | ['hiddenColumns', 'showColumns' | 'hideColumns', number[]]
  | ['trimRows', 'trimRows' | 'untrimRows', number[]]
  | ['manualRowMove', 'moveRow', number, number]
  | ['manualColumnMove', 'moveColumn', number, number]
  | ['manualColumnFreeze', 'freezeColumn', number];

/**
 * A row whose row header is not as tall as the row beside it.
 */
export interface MisalignedRow {
  row: number;
  master: number;
  rowHeader: number;
}

interface FixtureHot {
  rootElement: HTMLElement;
  setDataAtCell(row: number, column: number, value: unknown): void;
  getPlugin(name: string): Record<string, (...args: unknown[]) => unknown>;
  alter(action: string, index: number, amount?: number): void;
  getCopyableText(startRow: number, startCol: number, endRow: number, endCol: number): string;
  render(): void;
}

interface FixtureWindow extends Window {
  hot: FixtureHot;
  buildGrid(settings: GridSettings): void;
}

/**
 * Page Object for the fixture with one grid that has AutoRowSize and AutoColumnSize on. Each case rebuilds
 * it with its own merge, hidden rows or columns, and text, and then compares the height of every row in the
 * master with the row header beside it.
 */
export class AutoRowSizeMergedHiddenOriginPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture and waits for the placeholder grid to be built and rendered.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/auto-row-size-merged-hidden-origin.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.page.getByTestId('grid').locator('.ht_master td').first()).toBeVisible();
  }

  /**
   * Rebuilds the grid with the given settings, then writes the text into the merge's first cell the way
   * an edit does.
   */
  async build(settings: GridSettings, mergeText: { row: number; col: number; value: string }): Promise<void> {
    await this.page.evaluate(([gridSettings, { row, col, value }]) => {
      const fixtureWindow = window as unknown as FixtureWindow;

      fixtureWindow.buildGrid(gridSettings);
      fixtureWindow.hot.setDataAtCell(row, col, value);
    }, [settings, mergeText] as const);
    await expect(this.page.getByTestId('grid').locator('.ht_master td').first()).toBeVisible();
  }

  /**
   * Rebuilds the grid with the given settings and writes no text, for a case that hides or filters rows
   * first and writes the text after.
   */
  async buildWithoutText(settings: GridSettings): Promise<void> {
    await this.page.evaluate((gridSettings) => {
      (window as unknown as FixtureWindow).buildGrid(gridSettings);
    }, settings);
    await expect(this.page.getByTestId('grid').locator('.ht_master td').first()).toBeVisible();
  }

  /**
   * Filters out the rows of a column that hold the given value (`neq`). `filter()` renders the grid itself.
   * Needs the grid built with `filters: true`.
   */
  async filterOutValue(column: number, value: string): Promise<void> {
    await this.page.evaluate(([col, val]) => {
      const { hot } = window as unknown as FixtureWindow;
      const filters = hot.getPlugin('filters');

      filters.addCondition(col as number, 'neq', [val as string]);
      filters.filter();
    }, [column, value] as const);
  }

  /**
   * Removes one row through `alter('remove_row')`, the path the context menu takes. `alter()` renders the grid
   * itself.
   */
  async removeRow(index: number): Promise<void> {
    await this.page.evaluate((row) => {
      (window as unknown as FixtureWindow).hot.alter('remove_row', row);
    }, index);
  }

  /**
   * Writes a value through `setDataAtCell()`, the path an edit takes.
   */
  async setDataAtCell(row: number, column: number, value: string): Promise<void> {
    await this.page.evaluate(([r, c, v]) => {
      (window as unknown as FixtureWindow).hot.setDataAtCell(r as number, c as number, v as string);
    }, [row, column, value] as const);
  }

  /**
   * The text a copy of the cell returns, read through `getCopyableText()`. It is `''` for a cell that stores
   * `copyable: false`.
   */
  async copyableText(row: number, column: number): Promise<string> {
    return this.page.evaluate(([r, c]) => (window as unknown as FixtureWindow).hot
      .getCopyableText(r as number, c as number, r as number, c as number), [row, column] as const);
  }

  /**
   * Scrolls the grid's own holder to its end, the way a wheel or a scrollbar does, and waits for the last row to
   * be drawn. That draw measures no row, unlike `scrollViewportTo()`, whose full render measures every row it
   * draws and would hide a height left stale.
   */
  async scrollToEnd(lastRow: number): Promise<void> {
    await this.page.evaluate(() => {
      const holder = (window as unknown as FixtureWindow).hot.rootElement
        .querySelector<HTMLElement>('.ht_master .wtHolder');

      if (holder) {
        holder.scrollTop = holder.scrollHeight;
      }
    });
    await expect.poll(() => this.page.evaluate(
      row => (window as unknown as FixtureWindow).hot.getCell(row, 0) !== null, lastRow
    )).toBe(true);
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
   * The rows whose row header is not as tall as the row beside it. Both panes are read in one evaluation
   * on the grid's root, which the engine never recycles, so a draw cannot land between the two reads.
   * Empty when every row lines up, and one entry carrying the two heights when a row does not.
   */
  async misalignedRows(): Promise<MisalignedRow[]> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as FixtureWindow;
      const heightsOf = (selector: string) => Array.from(hot.rootElement.querySelectorAll(selector))
        .map(row => row.getBoundingClientRect().height);
      const master = heightsOf('.ht_master tbody tr');
      const rowHeader = heightsOf('.ht_clone_inline_start tbody tr');
      const rows: Array<{ row: number; master: number; rowHeader: number }> = [];

      for (let row = 0; row < Math.max(master.length, rowHeader.length); row++) {
        const masterHeight = master[row] ?? -1;
        const rowHeaderHeight = rowHeader[row] ?? -1;

        if (Math.abs(masterHeight - rowHeaderHeight) > 0.5) {
          rows.push({ row, master: masterHeight, rowHeader: rowHeaderHeight });
        }
      }

      return rows;
    });
  }

  /**
   * How much taller the tallest row of the master is than the shortest one. The precondition of a case:
   * with no row grown by the merge's text, every comparison of the two panes passes on code that has the
   * bug.
   */
  async tallestRowExtra(): Promise<number> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as FixtureWindow;
      const heights = Array.from(hot.rootElement.querySelectorAll('.ht_master tbody tr'))
        .map(row => row.getBoundingClientRect().height);

      return Math.max(...heights) - Math.min(...heights);
    });
  }

  /**
   * The height of every row of the master, in the order they are drawn. Two grids that draw the same rows with
   * the same text compare by it, one of them with nothing hidden as the control.
   */
  async rowHeights(): Promise<number[]> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as FixtureWindow;

      return Array.from(hot.rootElement.querySelectorAll('.ht_master tbody tr'))
        .map(row => row.getBoundingClientRect().height);
    });
  }
}
