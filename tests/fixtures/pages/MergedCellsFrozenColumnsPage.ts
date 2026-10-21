import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * The panes a row can be rendered in, keyed by the CSS class of the pane's root element.
 */
export const PANES = [
  'ht_master',
  'ht_clone_inline_start',
  'ht_clone_top',
  'ht_clone_top_inline_start_corner',
  'ht_clone_inline_end',
] as const;

export type PaneName = typeof PANES[number];

/**
 * Where one row sits in one pane: its offset from the top of the pane's table body and its height.
 */
export interface RowGeometry {
  offset: number;
  height: number;
}

/**
 * The slice of the fixture's window this page drives. Declared locally rather than augmenting `Window`,
 * which `windowTypes.ts` already does with another `hot` type (TS2717).
 */
interface FixtureWindow {
  initGrid(settings: Record<string, unknown>): void;
  hot: {
    getPlugin(name: 'manualColumnResize'): { setManualSize(column: number, width: number): void };
    render(): void;
    updateSettings(settings: Record<string, unknown>): void;
    scrollViewportTo(options: object): boolean;
    getFirstFullyVisibleColumn(): number | null;
    getFirstRenderedVisibleColumn(): number | null;
    getLastRenderedVisibleColumn(): number | null;
    getFirstFullyVisibleRow(): number | null;
  };
}

/**
 * Page Object for the "merged cells in the frozen columns" fixture
 * (tests/fixtures/demo/merged-cells-frozen-columns.html).
 *
 * A merged block that sits in, or crosses, the frozen columns is rendered by every pane that holds a
 * part of it. These helpers read what each pane shows in ONE evaluation, so no draw can land between
 * the values a comparison needs (`tests/AGENTS.md`, Determinism).
 */
export class MergedCellsFrozenColumnsPage {
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
   * Navigates to the fixture and waits for the bundle.
   */
  async goto(): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    await this.page.goto(`/tests/fixtures/demo/merged-cells-frozen-columns.html?${params}`);
    await awaitBundle(this.page);
  }

  /**
   * Builds a fresh grid. `values` places a `markers:<n>` or `tall:<px>` value in a cell (see the fixture).
   *
   * @param {object} settings Handsontable settings plus the fixture's `rows`, `cols` and `values`.
   */
  async initGrid(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(s => (window as unknown as FixtureWindow).initGrid(s), settings);
    await expect(this.grid.locator('.ht_master tbody tr').first()).toBeVisible();
  }

  /**
   * How many of the rendered markers the user can actually see: a marker counts when the browser hit-tests
   * its own center to it, so a copy that is clipped away, or covered by another pane, does not count.
   */
  async visibleMarkers(): Promise<{ count: number, panes: string[] }> {
    return this.grid.evaluate((root) => {
      const panes: string[] = [];

      root.querySelectorAll('[data-testid="marker"]').forEach((marker) => {
        const rect = marker.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + (rect.width / 2), rect.top + (rect.height / 2));

        if (rect.width > 0 && hit === marker) {
          panes.push(/ht_(master|clone_\w+)/.exec(marker.closest('.handsontable')?.className ?? '')?.[0] ?? '?');
        }
      });

      return { count: panes.length, panes };
    });
  }

  /**
   * The geometry of the given rows in every pane that renders them, read in one evaluation.
   *
   * @param {number[]} rows The row indexes (`data-testid="row-<n>"` on the TR).
   */
  async rowGeometry(rows: number[]): Promise<Partial<Record<PaneName, Record<number, RowGeometry>>>> {
    return this.grid.evaluate((root, { rowIndexes, paneNames }) => {
      const result: Record<string, Record<number, { offset: number, height: number }>> = {};

      paneNames.forEach((pane) => {
        const body = root.querySelector(`.${pane} .htCore tbody`);

        if (!body || (body.closest(`.${pane}`) as HTMLElement).style.display === 'none') {
          return;
        }

        const bodyTop = body.getBoundingClientRect().top;

        rowIndexes.forEach((row) => {
          const tr = body.querySelector(`[data-testid="row-${row}"]`);

          if (tr) {
            const rect = tr.getBoundingClientRect();

            result[pane] ??= {};
            result[pane][row] = { offset: Math.round(rect.top - bodyTop), height: Math.round(rect.height) };
          }
        });
      });

      return result;
    }, { rowIndexes: rows, paneNames: [...PANES] });
  }

  /**
   * For every pane that renders a row, how far its offset and height differ from the master's. An empty list
   * means every pane agrees with the master. A row that the master or every other pane leaves unrendered is
   * reported too: an empty answer must mean that panes were compared, not that nothing was there to compare.
   *
   * @param {number[]} rows The row indexes to compare.
   */
  async rowsDisagreeingWithMaster(rows: number[]): Promise<string[]> {
    const geometry = await this.rowGeometry(rows);
    const master = geometry.ht_master ?? {};
    const mismatches: string[] = [];

    rows.forEach((row) => {
      if (master[row] === undefined) {
        mismatches.push(`row ${row}: not rendered by the master`);
      }

      if (!Object.entries(geometry).some(([pane, paneRows]) => pane !== 'ht_master' && paneRows?.[row] !== undefined)) {
        mismatches.push(`row ${row}: not rendered by any pane besides the master`);
      }
    });

    Object.entries(geometry).forEach(([pane, paneRows]) => {
      Object.entries(paneRows ?? {}).forEach(([row, { offset, height }]) => {
        const reference = master[Number(row)];

        if (reference && (reference.offset !== offset || reference.height !== height)) {
          mismatches.push(`${pane} row ${row}: ${offset}/${height}px, master ${reference.offset}/${reference.height}px`);
        }
      });
    });

    return mismatches;
  }

  /**
   * The height of a row in the master pane, `NaN` when the master does not render it.
   *
   * @param {number} row The row index.
   */
  async masterRowHeight(row: number): Promise<number> {
    return (await this.rowGeometry([row])).ht_master?.[row]?.height ?? NaN;
  }

  /**
   * Repaints the grid the given number of times.
   *
   * @param {number} times How many renders to run.
   */
  async render(times: number): Promise<void> {
    await this.page.evaluate((count) => {
      for (let i = 0; i < count; i++) {
        (window as unknown as FixtureWindow).hot.render();
      }
    }, times);
  }

  /**
   * Updates the grid's settings.
   *
   * @param {object} settings The settings to apply.
   */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(s => (window as unknown as FixtureWindow).hot.updateSettings(s), settings);
  }

  /**
   * Resizes a column the way a drag on its header does, and redraws.
   *
   * @param {number} column The visual column index.
   * @param {number} width The new width in pixels.
   */
  async resizeColumn(column: number, width: number): Promise<void> {
    await this.page.evaluate(({ col, size }) => {
      const { hot } = window as unknown as FixtureWindow;

      hot.getPlugin('manualColumnResize').setManualSize(col, size);
      hot.render();
    }, { col: column, size: width });
  }

  /**
   * How far the layout wrapper of the inline-end band starts from where the master's cell of the same block
   * starts its content, in pixels: positive when the wrapper starts later. `null` when either is not rendered.
   * Both are the block's content start, so a left-to-right grid aligns them to the pixel.
   */
  async inlineEndWrapperDrift(): Promise<number | null> {
    return this.grid.evaluate((root) => {
      const contentStart = (cell: HTMLElement) => {
        const { left } = cell.getBoundingClientRect();

        return left + cell.clientLeft + parseFloat(getComputedStyle(cell).paddingLeft);
      };
      const blockCell = Array
        .from(root.querySelectorAll<HTMLTableCellElement>('.ht_master [data-testid="row-1"] td'))
        .find(cell => cell.colSpan > 1 && cell.style.display !== 'none');
      const wrapper = root.querySelector<HTMLElement>('.ht_clone_inline_end .htMergedCellContentWindow');

      if (!blockCell || !wrapper) {
        return null;
      }

      return wrapper.getBoundingClientRect().left - contentStart(blockCell);
    });
  }

  /**
   * How much wider the layout wrapper of the inline-start pane is than the content box of the master's cell of
   * the same block, in pixels. Both lay the block's content out, so they are the same width when the wrapper
   * follows the block's columns. `null` when either is not rendered.
   */
  async startWrapperWidthDrift(): Promise<number | null> {
    return this.grid.evaluate((root) => {
      const contentWidth = (cell: HTMLElement) => {
        const style = getComputedStyle(cell);

        return cell.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      };
      const blockCell = Array
        .from(root.querySelectorAll<HTMLTableCellElement>('.ht_master [data-testid="row-1"] td'))
        .find(cell => cell.colSpan > 1 && cell.style.display !== 'none');
      const wrapper = root.querySelector<HTMLElement>('.ht_clone_inline_start .htMergedCellContentWindow');

      if (!blockCell || !wrapper) {
        return null;
      }

      return wrapper.getBoundingClientRect().width - contentWidth(blockCell);
    });
  }

  /**
   * How many content-window wrappers the panes hold, and how deeply the deepest one is nested in another.
   */
  async contentWindows(): Promise<{ count: number, nested: number }> {
    return this.grid.evaluate(root => ({
      count: root.querySelectorAll('.htMergedCellContentWindow').length,
      nested: root.querySelectorAll('.htMergedCellContentWindow .htMergedCellContentWindow').length,
    }));
  }

  /**
   * The first column the master renders, read from the grid.
   */
  async masterFirstRenderedColumn(): Promise<number | null> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getFirstRenderedVisibleColumn());
  }

  /**
   * Scrolls the viewport so `column` is the first one at the inline start, and waits for the master to
   * show it there, give or take the one column a scroll to the end cannot snap (a render-state probe,
   * not the scroll offset). The first RENDERED column is no probe
   * here: the master renders a merged block from its origin, so it can stay at 0 after the scroll.
   *
   * @param {number} column The visual column index.
   */
  async scrollToColumn(column: number): Promise<void> {
    await this.page.evaluate(col => (window as unknown as FixtureWindow).hot.scrollViewportTo({ col, horizontalSnap: 'start' }), column);
    await expect.poll(() => this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getFirstFullyVisibleColumn() ?? -1))
      .toBeGreaterThanOrEqual(column - 1);
  }

  /**
   * Scrolls the viewport to its inline end and waits for the master to render the last column.
   *
   * @param {number} lastColumn The visual index of the grid's last column.
   */
  async scrollToEnd(lastColumn: number): Promise<void> {
    await this.page.evaluate(col => (window as unknown as FixtureWindow).hot
      .scrollViewportTo({ col, horizontalSnap: 'end' }), lastColumn);
    await expect.poll(() => this.page.evaluate(() => (window as unknown as FixtureWindow).hot
      .getLastRenderedVisibleColumn())).toBe(lastColumn);
  }

  /**
   * Scrolls the viewport so `row` is the first one at the top, and waits for the master to show it there,
   * give or take one partly visible row.
   *
   * @param {number} row The visual row index.
   */
  async scrollToRow(row: number): Promise<void> {
    await this.page.evaluate(r => (window as unknown as FixtureWindow).hot.scrollViewportTo({ row: r, verticalSnap: 'top' }), row);
    await expect.poll(() => this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getFirstFullyVisibleRow() ?? -1))
      .toBeGreaterThanOrEqual(row - 1);
  }
}
