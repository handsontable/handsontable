import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Geometry read back from the fixture: what the engine wrote to the hider, how much of the grid is
 * actually in the DOM, and what the spreader measures.
 */
export interface OverlayGeometry {
  hiderWidth: number;
  hiderHeight: number;
  renderedRows: number;
  spreaderWidth: number;
  spreaderHeight: number;
}

/**
 * How many resizes happened, and who asked. `engineResizes` counts Walkontable deciding on its own;
 * `externalRequests` counts anything reaching `view.adjustElementsSize()` from outside the engine.
 */
export interface ResizeCounters {
  engineResizes: number;
  externalRequests: number;
}

/**
 * The engine's own view of the geometry, read from the layout snapshot it resolves once per draw.
 * This is what the resize gate compares — not the DOM it eventually writes.
 */
export interface LayoutInputs {
  workspaceWidth: number;
  workspaceHeight: number;
  rowHeaderWidth: number;
  columnHeaderHeight: number;
  hiderWidth: number;
  hiderHeight: number;
}

/**
 * Page Object for the overlay self-resize fixture (DEV-19).
 *
 * The grid is virtualized on both axes, so the hider size (the whole grid) and the rendered band
 * (what is on screen) move independently. Every method here drives the grid through its public API
 * only — no test may reach for `view.adjustElementsSize()`, because whether the engine needs that
 * call is the thing under test.
 */
export class OverlaySelfResizePage {
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
   * Navigate to the fixture and wait for the first draw to settle — the hider carrying a real
   * height is the condition, because that is the write this whole spec is about.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/overlay-self-resize.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await expect(this.grid.locator('.ht_master .wtHider')).toBeVisible();
    await this.page.waitForFunction(
      () => (window as any).readGeometry?.().hiderHeight > 0,
      undefined,
      { polling: 50 }
    );
  }

  /** The hider size the engine wrote, plus the rendered band and the spreader measurements. */
  async geometry(): Promise<OverlayGeometry> {
    return this.page.evaluate(() => (window as any).readGeometry());
  }

  /** How many resizes ran, and how many were requested from outside the engine. */
  async counters(): Promise<ResizeCounters> {
    return this.page.evaluate(() => ({ ...(window as any).counters }));
  }

  /**
   * The layout snapshot the engine's own gate reads — the inputs that decide whether a resize is
   * needed, rather than the DOM it eventually writes.
   */
  async layoutInputs(): Promise<LayoutInputs> {
    return this.page.evaluate(() => (window as any).readLayoutInputs());
  }

  /** Zero both counters so the next operation is measured on its own. */
  async resetCounters(): Promise<void> {
    await this.page.evaluate(() => (window as any).resetCounters());
  }

  /**
   * Hide a run of columns through the HiddenColumns plugin. A pure width change: the total narrows
   * while the rendered row band is untouched.
   *
   * @param {number[]} columns Visual column indexes to hide.
   */
  async hideColumns(columns: number[]): Promise<void> {
    await this.page.evaluate((cols) => {
      const hot = (window as any).hot;

      hot.updateSettings({ hiddenColumns: { columns: cols } });
    }, columns);
  }

  /**
   * Replace the dataset with one of a different height. A pure total-height change: with far more
   * rows than fit, the rendered band comes back the same size.
   *
   * @param {number} rows How many rows the new dataset has.
   * @param {number} cols How many columns the new dataset has.
   */
  async loadRows(rows: number, cols: number): Promise<void> {
    await this.page.evaluate(({ rows: r, cols: c }) => {
      const hot = (window as any).hot;

      hot.loadData((window as any).Handsontable.helper.createSpreadsheetData(r, c));
    }, { rows, cols });
  }

  /** Force a draw that changes nothing. Used to prove the resize does not fire on every render. */
  async renderWithoutChanges(): Promise<void> {
    await this.page.evaluate(() => (window as any).hot.render());
  }

  /**
   * Resize the grid's container and let the grid react. The workspace box is part of the geometry
   * the engine compares, so this must reach the overlays even though no row or column changed.
   *
   * @param {number} height The new container height in pixels.
   */
  async resizeContainerTo(height: number): Promise<void> {
    await this.page.evaluate((px) => {
      const container = document.querySelector('[data-testid="grid"]') as HTMLElement;

      container.style.height = `${px}px`;
      (window as any).hot.refreshDimensions();
    }, height);
  }

  /**
   * Run several geometry-changing operations inside one `batchRender`, so the engine sees one draw.
   * Used to show the resize is deduplicated rather than repeated per operation.
   */
  async batchSeveralGeometryChanges(): Promise<void> {
    await this.page.evaluate(() => {
      const hot = (window as any).hot;

      hot.batchRender(() => {
        hot.alter('insert_row_above', 1, 20);
        hot.alter('insert_col_start', 1, 5);
        hot.alter('remove_row', 40, 10);
      });
    });
  }

  /**
   * Scroll the viewport to a row and wait until the master has actually rendered it. Waiting on the
   * rendered band, rather than on the call returning, matters here: the engine debounces its
   * scroll-path size check by 200ms, so a counter read before the band settles would measure the
   * scroll that has not happened yet.
   *
   * @param {number} row The row to bring to the top of the viewport.
   */
  async scrollVerticallyTo(row: number): Promise<void> {
    // Wait for the band to MOVE, not to reach an exact index: `scrollViewportTo` clamps near the
    // end of the data, so an absolute target past the last reachable row never arrives.
    const before = await this.page.evaluate(
      () => (window as any).hot.view._wt.wtTable.getFirstRenderedRow()
    );

    await this.page.evaluate((top) => {
      (window as any).hot.scrollViewportTo({ row: top, verticalSnap: 'top' });
    }, row);

    await this.page.waitForFunction(
      (previous) => (window as any).hot.view._wt.wtTable.getFirstRenderedRow() !== previous,
      before,
      { polling: 50 }
    );
  }
}
