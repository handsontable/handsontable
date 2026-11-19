import { type Page, expect } from '@playwright/test';
import { type Bundle, assertKnownBundle, awaitBundle, awaitFixtureBuilt, BUNDLE_POLLING_MS } from '../bundle';

/**
 * The configurations `row-header-width-per-level.html` builds.
 */
export type RowHeaderWidthCase =
  | 'rowSelection'
  | 'rowSelectionWidth80'
  | 'rowSelectionPerLevel'
  | 'rowSelectionRtl'
  | 'nestedRows'
  | 'extraLevelHook'
  | 'extraLevelRowSelection';

/**
 * The grid widths the fixture builds: `wide` fits every column, `narrow` scrolls them.
 */
export type RowHeaderWidthSize = 'wide' | 'narrow';

interface FixtureWindow {
  hot: {
    countCols(): number;
    view: { getLastRenderedVisibleColumn(): number | null };
  };
}

/**
 * Page Object for the row header width per level fixture: a grid with more than one row header
 * level and a frozen end column.
 */
export class RowHeaderWidthPerLevelPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture in one configuration.
   *
   * @param {RowHeaderWidthCase} gridCase The configuration.
   * @param {RowHeaderWidthSize} size The grid width.
   */
  async goto(gridCase: RowHeaderWidthCase, size: RowHeaderWidthSize): Promise<void> {
    assertKnownBundle(this.bundle, 'new RowHeaderWidthPerLevelPage(page, theme, bundle)');

    await this.page.goto(
      `/tests/fixtures/demo/row-header-width-per-level.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&case=${gridCase}&size=${size}`
    );
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.page.locator('.ht_clone_inline_end').getByTestId('cell-0-5')).toBeVisible();
  }

  /**
   * The inline-end edge of the last column's first cell, as the master draws it and as the
   * inline-end overlay draws it over the master, read in one evaluation. The inline-end edge, because
   * the first column of the inline-end overlay reaches 1px further toward the inline start to cover the
   * border of the column before it and draw the freeze line itself.
   *
   * @returns {Promise<{ master: number, clone: number }>}
   */
  async lastColumnEdges(): Promise<{ master: number; clone: number }> {
    return this.page.getByTestId('grid').evaluate((root) => {
      const read = (overlay: string) => {
        const cell = root.querySelector(`.${overlay} [data-testid="cell-0-5"]`)!;
        const rect = cell.getBoundingClientRect();

        return getComputedStyle(cell).direction === 'rtl' ? rect.left : rect.right;
      };

      return { master: read('ht_master'), clone: read('ht_clone_inline_end') };
    });
  }

  /**
   * The distance from the end edge of the last column's first cell, as the master draws it, to the
   * inline-end edge of the master holder's visible area. Measured after a scroll to the end of the
   * columns, anything above 0 is room the holder scrolls past the end of the table.
   *
   * @returns {Promise<number>}
   */
  async gapAfterLastColumn(): Promise<number> {
    return this.page.getByTestId('grid').evaluate((root) => {
      const holder = root.querySelector('.ht_master .wtHolder')!;
      const cell = root.querySelector('.ht_master [data-testid="cell-0-5"]')!.getBoundingClientRect();
      const holderBox = holder.getBoundingClientRect();
      const rtl = getComputedStyle(holder).direction === 'rtl';

      return Math.round(rtl
        ? cell.left - (holderBox.right - holder.clientWidth)
        : (holderBox.left + holder.clientWidth) - cell.right);
    });
  }

  /**
   * Scrolls the master holder to the end of the columns and waits for the master to render the last
   * column.
   */
  async scrollToEnd(): Promise<void> {
    await this.page.getByTestId('grid').evaluate((root) => {
      const holder = root.querySelector('.ht_master .wtHolder')!;
      const rtl = getComputedStyle(holder).direction === 'rtl';

      holder.scrollLeft = rtl ? -holder.scrollWidth : holder.scrollWidth;
    });
    await this.page.waitForFunction(() => {
      const { hot } = window as unknown as FixtureWindow;

      return hot.view.getLastRenderedVisibleColumn() === hot.countCols() - 1;
    }, undefined, { polling: BUNDLE_POLLING_MS });
    await this.page.evaluate(() => new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));
  }
}
