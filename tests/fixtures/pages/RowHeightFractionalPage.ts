import { type Page, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';

export interface PaneRowHeights {
  /**
   * The height of each rendered row of the master table, in order.
   */
  master: number[];
  /**
   * The height of each rendered row of the row-header clone, in order.
   */
  clone: number[];
  /**
   * How far each pane's last row ends below the pane's first row's top edge.
   */
  masterBottom: number;
  cloneBottom: number;
}

/**
 * Page Object for the row-height-fractional fixture: a grid with row headers whose cells wrap at a
 * line height that is not a whole number of pixels, so a row's content height is fractional.
 *
 * The row-header clone gets its row heights from what the engine (or AutoRowSize) recorded, the
 * master from its own content, so a record rounded to a whole pixel pulls the two apart, row by row.
 */
export class RowHeightFractionalPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture and waits for the bundle and the first row of both panes.
   *
   * @param options.autoRowSize Whether the AutoRowSize plugin supplies the row heights.
   * @param options.frozen Whether the first column is frozen and the grid scrolls sideways.
   * @param options.renderAll Whether every row is rendered (off: scrolling recycles the rows).
   * @param options.zoom The CSS zoom of an ancestor of the grid, applied before the grid is built.
   */
  async goto({ autoRowSize = false, frozen = false, renderAll = true, zoom = 1 } = {}): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/row-height-fractional.html` +
      `?theme=${this.theme}&bundle=${this.bundle}&autoRowSize=${autoRowSize ? 1 : 0}` +
      `&frozen=${frozen ? 1 : 0}&renderAll=${renderAll ? 1 : 0}&zoom=${zoom}`
    );
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.page.locator('.ht_master tbody tr').first()).toBeAttached();
    await expect(this.page.locator('.ht_clone_inline_start tbody tr').first()).toBeAttached();
  }

  /**
   * The theme the grid actually resolved. Linking a theme's stylesheet does not apply it, so a
   * leg that skipped the container class would quietly test one configuration six times.
   */
  async activeTheme(): Promise<string> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { getCurrentThemeName(): string },
    }).hot.getCurrentThemeName());
  }

  /**
   * The computed line height of a body cell, in px. The trigger of the whole spec: a line height
   * that is not a whole number of pixels is what makes a wrapped row's content height fractional.
   */
  async cellLineHeight(): Promise<number> {
    return this.page.evaluate(() => {
      const cell = document.querySelector('[data-testid="grid"] .ht_master tbody td') as HTMLElement;

      return Number.parseFloat(getComputedStyle(cell).lineHeight);
    });
  }

  /**
   * How many rows of the master are taller than a whole pixel count, i.e. have a fraction.
   *
   * The precondition of every assertion on this page: with no fractional row there is nothing
   * for a rounded record to get wrong, and the rest of the spec would pass on unfixed code.
   *
   * @param minFraction The smallest fractional part that counts.
   */
  async fractionalRowCount(minFraction = 0.05): Promise<number> {
    const { master } = await this.rowHeights();

    return master.filter(height => height - Math.floor(height) >= minFraction).length;
  }

  /**
   * Every rendered row's height in the master and in the row-header clone, read in ONE evaluation
   * (two round trips would let a redraw recycle the rows in between).
   */
  async rowHeights(): Promise<PaneRowHeights> {
    return this.page.evaluate(() => {
      const read = (selector: string) => {
        const rows = [...document.querySelectorAll(`[data-testid="grid"] ${selector} tbody tr`)] as HTMLElement[];
        const heights = rows.map(row => row.getBoundingClientRect().height);
        const first = rows[0].getBoundingClientRect();
        const last = rows[rows.length - 1].getBoundingClientRect();

        return { heights, bottom: last.bottom - first.top };
      };
      const master = read('.ht_master');
      const clone = read('.ht_clone_inline_start');

      return {
        master: master.heights,
        clone: clone.heights,
        masterBottom: master.bottom,
        cloneBottom: clone.bottom,
      };
    });
  }

  /**
   * The first row the master renders. Moves when a scroll recycles the rows, which `scrollTop` alone
   * does not prove: a grid that renders every row scrolls without drawing anything new.
   */
  async firstRenderedRow(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { view: { _wt: { wtTable: { getFirstRenderedRow(): number } } } },
    }).hot.view._wt.wtTable.getFirstRenderedRow());
  }

  /**
   * Scrolls the master holder to a vertical offset, then waits until the rows have been drawn for it
   * and the clone has followed (a scroll is answered a frame later).
   */
  async scrollTo(top: number): Promise<void> {
    const before = await this.firstRenderedRow();

    await this.page.evaluate((scrollTop) => {
      (document.querySelector('[data-testid="grid"] .ht_master .wtHolder') as HTMLElement).scrollTop = scrollTop;
    }, top);

    await expect.poll(() => this.page.evaluate(() => {
      const master = document.querySelector('[data-testid="grid"] .ht_master .wtHolder') as HTMLElement;
      const clone = document.querySelector('[data-testid="grid"] .ht_clone_inline_start .wtHolder') as HTMLElement;

      return Math.abs(master.scrollTop - clone.scrollTop) < 1;
    }), { message: 'the row-header clone follows the master scroll' }).toBe(true);

    // A scroll that moves the band draws other rows, and it is the draw this method ends on. Scrolling
    // back to the top moves it too, unless the band was at the top already.
    if (top > 0 || before > 0) {
      await expect.poll(() => this.firstRenderedRow(), { message: 'the scroll drew other rows' }).not.toBe(before);
    }
  }

  /**
   * Scrolls the master holder sideways, so its rendered column band starts past the frozen column.
   * Waits for the band to move, which is what makes the frozen column's row heights live in the
   * overlay alone.
   */
  async scrollSidewaysTo(left: number): Promise<void> {
    await this.page.evaluate((scrollLeft) => {
      (document.querySelector('[data-testid="grid"] .ht_master .wtHolder') as HTMLElement).scrollLeft = scrollLeft;
    }, left);

    await expect.poll(() => this.page.evaluate(() => (window as unknown as {
      hot: { view: { _wt: { wtTable: { getFirstRenderedColumn(): number } } } },
    }).hot.view._wt.wtTable.getFirstRenderedColumn()), {
      message: 'the master renders a column band that starts past the frozen column',
    }).toBeGreaterThan(0);
  }

  /**
   * How many times the row-height cache is dropped over `renders` full draws. A settled grid costs
   * none; a record that never settles drops it on every draw and the rows stay aligned throughout.
   */
  async countRowCacheInvalidations(renders: number): Promise<number> {
    return this.page.evaluate(count => (window as unknown as {
      countRowCacheInvalidations: (renders: number) => number,
    }).countRowCacheInvalidations(count), renders);
  }

  /**
   * Gives every row a `minRowHeights` floor equal to its content height rounded to a whole pixel. A row
   * whose content has a fraction below one half is then rendered at its content height, taller than its
   * floor, while `offsetHeight` reads the floor.
   */
  async floorRowsAtRoundedContent(): Promise<void> {
    await this.page.evaluate(() => {
      const { hot } = window as unknown as { hot: { updateSettings(settings: object): void } };
      const rows = [...document.querySelectorAll('[data-testid="grid"] .ht_master tbody tr')] as HTMLElement[];
      const floors = rows.map(row => Math.round(row.getBoundingClientRect().height));

      hot.updateSettings({ minRowHeights: (row: number) => floors[row] });
    });
  }

  /**
   * The height AutoRowSize stored for each rendered row of the master, by row, next to the height the
   * row renders at. Read in ONE evaluation, for the same reason as `rowHeights()`.
   */
  async storedRowHeights(): Promise<{ stored: number, rendered: number }[]> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as { hot: { getRowHeight(row: number): number } };
      const rows = [...document.querySelectorAll('[data-testid="grid"] .ht_master tbody tr')] as HTMLElement[];

      return rows.map((row, index) => ({
        stored: hot.getRowHeight(index),
        rendered: row.getBoundingClientRect().height,
      }));
    });
  }
}
