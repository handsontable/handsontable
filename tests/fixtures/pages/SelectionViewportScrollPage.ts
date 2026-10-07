import { expect } from '@playwright/test';
import { SelectionFeaturesPage } from './SelectionFeaturesPage';

/**
 * Page Object for the viewport scroll a selection makes. It extends the selection features page (same
 * fixture, cells stamped with `data-testid="cell-<row>-<col>"`) with the reads that scroll needs.
 *
 * A selection that scrolls the viewport also queues a scroll of the browser window to the selected cell,
 * and that one runs on the next `afterScroll` hook, which the holder's `scroll` event fires a frame later.
 * So whatever these specs assert about the end state, they assert after `afterScrollCount()` has moved:
 * before that, the queued scroll has not run, and a check would pass whether or not it misbehaves.
 */
export class SelectionViewportScrollPage extends SelectionFeaturesPage {
  /**
   * Start counting `afterScroll` calls from zero. Call it before the action whose deferred scroll the spec
   * waits for.
   */
  async countAfterScroll(): Promise<void> {
    await this.page.evaluate(() => {
      window.afterScrollCount = 0;
      window.hot.addHook('afterScroll', () => {
        window.afterScrollCount = (window.afterScrollCount ?? 0) + 1;
      });
    });
  }

  /**
   * Wait until the grid has fired `afterScroll` since `countAfterScroll()`. The selection's queued window
   * scroll is an `afterScroll` listener added after the counter, so it has run by the time this returns.
   */
  async waitForAfterScroll(): Promise<void> {
    await expect.poll(() => this.page.evaluate(() => window.afterScrollCount ?? 0)).toBeGreaterThan(0);
  }

  /**
   * Select a cell and, in the same task, scroll the viewport so that `targetCol` is at the inline start,
   * before the browser has dispatched the `scroll` event of the selection's own scroll. This is what an
   * application does when it selects a cell and then shows another part of the grid. Returns the master
   * holder's `scrollLeft` before the selection, after it, and after the second scroll.
   */
  async selectCellThenScrollToColumn(
    row: number, col: number, targetCol: number,
  ): Promise<{ before: number, afterSelection: number, afterScroll: number }> {
    return this.page.evaluate(([targetRow, column, scrollColumn]) => {
      const holder = document.querySelector('.ht_master .wtHolder')!;
      const before = holder.scrollLeft;

      window.hot.selectCell(targetRow, column);

      const afterSelection = holder.scrollLeft;

      window.hot.scrollViewportTo({ col: scrollColumn, horizontalSnap: 'start' });

      return { before, afterSelection, afterScroll: holder.scrollLeft };
    }, [row, col, targetCol] as const);
  }

  /**
   * The master holder's `scrollLeft`.
   */
  async masterScrollLeft(): Promise<number> {
    return this.page.evaluate(() => document.querySelector('.ht_master .wtHolder')!.scrollLeft);
  }

  /**
   * The first column the viewport shows whole, as the last draw computed it.
   */
  async firstFullyVisibleColumn(): Promise<number> {
    return this.page.evaluate(() => window.hot.getFirstFullyVisibleColumn());
  }

  /**
   * Push the grid below the fold of the browser window with a spacer above it, so that showing a cell
   * takes a scroll of the window.
   */
  async pushGridBelowTheFold(): Promise<void> {
    await this.page.evaluate(() => {
      const spacer = document.createElement('div');

      spacer.style.height = `${window.innerHeight * 2}px`;
      document.body.insertBefore(spacer, document.querySelector('[data-testid="grid"]'));
    });
  }

  /**
   * Whether a master cell lies wholly inside the browser window's viewport.
   */
  async isCellInWindow(row: number, col: number): Promise<boolean> {
    return this.page.evaluate(([targetRow, targetCol]) => {
      const cell = document.querySelector(`.ht_master [data-testid="cell-${targetRow}-${targetCol}"]`);
      const rect = cell?.getBoundingClientRect();

      return !!rect && rect.top >= 0 && rect.bottom <= window.innerHeight &&
        rect.left >= 0 && rect.right <= window.innerWidth;
    }, [row, col] as const);
  }
}
