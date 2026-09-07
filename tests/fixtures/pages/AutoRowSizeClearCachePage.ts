import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the AutoRowSize `clearCache()` fixture.
 *
 * The reader sees this defect as row-header numbers sliding away from their rows, so the assertions
 * compare the row-header cells in the inline-start overlay with the data rows in the master table,
 * row by row.
 */
export class AutoRowSizeClearCachePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly inlineStartOverlay: Locator;
  readonly holder: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.inlineStartOverlay = this.grid.locator('.ht_clone_inline_start');
    this.holder = this.grid.locator('.ht_master .wtHolder');
  }

  /**
   * Drops every measured row height and asks for a redraw - the call the defect was reported for.
   */
  async wipeRowHeightCache(): Promise<void> {
    await this.page.evaluate(
      () => (window as unknown as { wipeRowHeightCache: () => void }).wipeRowHeightCache()
    );
  }

  /**
   * Scrolls the grid, then waits for the scroll to have actually landed and been drawn.
   *
   * Each offset is clamped to the grid's own range, so a caller can ask for "as far as it goes"
   * with a large number and not depend on a total width that differs per theme.
   *
   * @param {number} top Vertical offset, in pixels.
   * @param {number} left Horizontal offset, in pixels.
   */
  async scrollTo(top: number, left: number): Promise<void> {
    const landed = await this.holder.evaluate((holder, [t, l]) => {
      holder.scrollTop = Math.min(t as number, holder.scrollHeight - holder.clientHeight);
      holder.scrollLeft = Math.min(l as number, holder.scrollWidth - holder.clientWidth);

      return [holder.scrollTop, holder.scrollLeft];
    }, [top, left]);

    // A real DOM condition rather than a sleep: the scroll has landed and a frame has been painted.
    await expect.poll(() => this.holder.evaluate(h => [h.scrollTop, h.scrollLeft]))
      .toEqual(landed);
    await this.page.evaluate(
      () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );
  }

  /**
   * How far the row headers have drifted from their rows, in pixels - the largest disagreement
   * across every rendered row, counting both the row's height and where its top edge sits.
   *
   * Reads the two tables that must stay in step: the master body, which holds the data cells, and
   * the inline-start overlay, which holds the row headers.
   *
   * @returns {Promise<number>} `0` when every row lines up.
   */
  async worstRowHeaderDrift(): Promise<number> {
    return this.grid.evaluate((root) => {
      const masterRows = [...root.querySelectorAll('.ht_master .wtHolder table tbody tr')];
      const cloneRows = [...root.querySelectorAll('.ht_clone_inline_start .wtHolder table tbody tr')];
      let worst = 0;

      for (let i = 0; i < masterRows.length && i < cloneRows.length; i++) {
        const master = masterRows[i].getBoundingClientRect();
        const clone = cloneRows[i].getBoundingClientRect();

        worst = Math.max(
          worst,
          Math.abs(master.height - clone.height),
          Math.abs(master.top - clone.top)
        );
      }

      return worst;
    });
  }

  /**
   * How many of the rendered rows the plugin has no measured height for.
   *
   * The drift is only the symptom; an unmeasured row is the cause, and asserting on it keeps the
   * test pointed at the defect rather than at one theme's pixel arithmetic.
   *
   * @returns {Promise<number>}
   */
  async unmeasuredRenderedRows(): Promise<number> {
    return this.page.evaluate(() => {
      const hot = (window as unknown as { hot: {
        view: { getFirstRenderedVisibleRow(): number, getLastRenderedVisibleRow(): number },
        toPhysicalRow(row: number): number | null,
        getPlugin(name: string): { rowHeightsMap: { getValues(): (number | null)[] } },
      } }).hot;
      const heights = hot.getPlugin('autoRowSize').rowHeightsMap.getValues();
      let unmeasured = 0;

      for (let row = hot.view.getFirstRenderedVisibleRow();
        row <= hot.view.getLastRenderedVisibleRow(); row++) {
        const physicalRow = hot.toPhysicalRow(row) ?? row;

        if (heights[physicalRow] === null || heights[physicalRow] === undefined) {
          unmeasured += 1;
        }
      }

      return unmeasured;
    });
  }

  /** Navigate and wait for the grid to have rendered - a real DOM condition, never a sleep. */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/auto-row-size-clear-cache.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await expect(this.inlineStartOverlay).toBeVisible();
    await expect(this.grid.locator('.ht_master tbody tr').first()).toBeVisible();
  }
}
