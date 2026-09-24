import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../../bundle';

/**
 * Where one rendered column header sits against where its column is.
 */
export interface HeaderPlacement {
  column: number;
  /**
   * The header's inline-start edge, measured from the holder's inline-start edge.
   */
  actual: number;
  /**
   * The column's offset in the table minus the horizontal scroll: where the header must be.
   */
  expected: number;
}

/**
 * Page Object for the no-rows scrollbar-drag fixture (DEV-3083): a grid with column headers and
 * `data: []`, element-scrolled, in either layout direction.
 *
 * A native scrollbar press cannot be synthesized in headless Chromium, which draws no scrollbars.
 * What the engine keys on is observable all the same: the `mousedown` of a scrollbar press targets
 * the scrollable element itself (the scrollbar is not a child node), and the drag then arrives as
 * plain `scroll` events on that element. The page object reproduces exactly that pair.
 */
export class ScrollbarDragEmptyGridPage {
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
   * Navigate and wait for the column headers to render - a real DOM condition, never a sleep.
   *
   * @param {'ltr' | 'rtl'} dir Which layout direction the grid takes.
   */
  async goto(dir: 'ltr' | 'rtl' = 'ltr'): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/walkontable/scrollbar-drag-empty-grid.html?theme=${this.theme}&bundle=${this.bundle}&dir=${dir}`
    );
    await awaitBundle(this.page);
    await expect(this.grid.locator('.ht_clone_top').getByTestId('col-header-0')).toBeVisible();
  }

  /**
   * Presses the mouse on the master holder's scrollbar: a `mousedown` whose target is the holder.
   */
  async pressScrollbar(): Promise<void> {
    await this.grid.evaluate((root) => {
      const holder = root.querySelector<HTMLElement>('.ht_master > .wtHolder');

      if (!holder) {
        throw new Error('No master holder');
      }

      holder.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
  }

  /**
   * Drags the pressed scrollbar so the grid is `distance` pixels from its inline-start edge
   * (negative `scrollLeft` in RTL), and waits for the engine to process that scroll.
   *
   * It ends on the top clone holder reaching the same offset, not on the master's: the engine
   * writes the clone offset, redraws, and syncs the sticky insets in one synchronous block
   * (`ScrollSync#syncScrollPositions`), so once the clone has moved the headers are final.
   *
   * @param {number} distance How far from the inline-start edge to scroll, in pixels.
   */
  async dragScrollbarTo(distance: number): Promise<void> {
    const scrollLeft = await this.grid.evaluate((root, value) => {
      const holder = root.querySelector<HTMLElement>('.ht_master > .wtHolder');

      if (!holder) {
        throw new Error('No master holder');
      }

      holder.scrollLeft = getComputedStyle(holder).direction === 'rtl' ? -value : value;

      return holder.scrollLeft;
    }, distance);

    await expect.poll(() => this.grid.evaluate((root) => {
      return root.querySelector<HTMLElement>('.ht_clone_top > .wtHolder')?.scrollLeft;
    })).toBe(scrollLeft);
  }

  /**
   * Releases the mouse anywhere on the page, which ends the scrollbar drag.
   */
  async releaseScrollbar(): Promise<void> {
    await this.page.evaluate(() => {
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
  }

  /**
   * How far the master holder is scrolled from its inline-start edge, in pixels.
   *
   * @returns {Promise<number>}
   */
  async scrollDistance(): Promise<number> {
    return this.grid.evaluate((root) => {
      const holder = root.querySelector<HTMLElement>('.ht_master > .wtHolder');

      if (!holder) {
        throw new Error('No master holder');
      }

      return Math.abs(holder.scrollLeft);
    });
  }

  /**
   * Where every rendered column header in the top overlay sits, against where its column is.
   *
   * @returns {Promise<HeaderPlacement[]>}
   */
  async headerPlacements(): Promise<HeaderPlacement[]> {
    return this.grid.evaluate((root) => {
      const hot = (window as any).hot;
      const holder = root.querySelector<HTMLElement>('.ht_master > .wtHolder');

      if (!holder) {
        throw new Error('No master holder');
      }

      const isRtl = getComputedStyle(holder).direction === 'rtl';
      const holderRect = holder.getBoundingClientRect();
      const scrolled = Math.abs(holder.scrollLeft);
      const headers = [...root.querySelectorAll<HTMLElement>('.ht_clone_top th[data-testid^="col-header-"]')];

      return headers.map((th) => {
        const column = Number(th.dataset.testid?.replace('col-header-', ''));
        const rect = th.getBoundingClientRect();
        let columnOffset = 0;

        for (let index = 0; index < column; index++) {
          columnOffset += hot.getColWidth(index);
        }

        return {
          column,
          actual: Math.round(isRtl ? holderRect.right - rect.right : rect.left - holderRect.left),
          expected: Math.round(columnOffset - scrolled),
        };
      });
    });
  }
}
