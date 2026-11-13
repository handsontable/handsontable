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
   * The `scrollLeft` of the master holder and of the top overlay's holder, read in one evaluation. A window
   * scroll to a cell in a frozen row moves the overlay's holder at once, and the master only on that holder's
   * next `scroll` event, when the overlay's holder has been put back - so between them, one of the two always
   * shows the move, whenever it is read.
   */
  async holderScrollLefts(): Promise<{ master: number, topOverlay: number }> {
    return this.page.evaluate(() => ({
      master: document.querySelector('.ht_master .wtHolder')!.scrollLeft,
      topOverlay: document.querySelector('.ht_clone_top .wtHolder')!.scrollLeft,
    }));
  }

  /**
   * Whether the grid renders the cell, in the master or in a frozen overlay. The window scroll a selection
   * queues reads the cell when it runs and does nothing when it is gone, so a spec about that scroll asserts
   * this first, or it passes because there was nothing to scroll to.
   */
  async isCellRendered(row: number, col: number): Promise<boolean> {
    return this.page.evaluate(([targetRow, targetCol]) => window.hot.getCell(targetRow, targetCol, true) !== null,
      [row, col] as const);
  }

  /**
   * The first row the viewport shows whole, as the last draw computed it.
   */
  async firstFullyVisibleRow(): Promise<number> {
    return this.page.evaluate(() => window.hot.getFirstFullyVisibleRow());
  }

  /**
   * The row the last selection layer ends on.
   */
  async selectionEndRow(): Promise<number | null> {
    return this.page.evaluate(() => window.hot.getSelectedRangeLast().to.row);
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
   * Push the grid down so that only its top 200px are above the fold of the browser window: the rows past
   * that need a scroll of the window to be seen, with the grid's own viewport left where it is.
   */
  async placeGridAcrossTheFold(): Promise<void> {
    await this.page.evaluate(() => {
      const spacer = document.createElement('div');

      spacer.style.height = `${window.innerHeight - 200}px`;
      document.body.insertBefore(spacer, document.querySelector('[data-testid="grid"]'));
    });
  }

  /**
   * Scroll the browser window back to its top.
   */
  async scrollWindowToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => this.page.evaluate(() => window.scrollY)).toBe(0);
  }

  /**
   * The browser window's `scrollY`.
   */
  async windowScrollY(): Promise<number> {
    return this.page.evaluate(() => window.scrollY);
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
