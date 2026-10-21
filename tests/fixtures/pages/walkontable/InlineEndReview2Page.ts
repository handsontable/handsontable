import { type Locator } from '@playwright/test';
import { InlineEndReviewPage } from './InlineEndReviewPage';

type HotHandle = {
  hot: {
    updateSettings(settings: object): void,
    refreshDimensions(): void,
    render(): void,
  },
};

/**
 * Names of the clones whose geometry the second review round reads.
 */
export type CloneName = 'inline_end' | 'top_inline_end_corner' | 'bottom_inline_end_corner' | 'top' | 'bottom';

/**
 * One column header or one body cell and the `aria-colindex` it carries.
 */
export interface AriaIndexEntry {
  /** The column the element belongs to (0-based, visual). */
  col: number;
  /** The `aria-colindex` attribute, as a number. */
  ariaColIndex: number;
  /** The clone (or the master) the element lives in. */
  table: string;
}

/**
 * Extra reads for the second review round of the `fixedColumnsEnd` overlays. It builds on the first round's
 * page object and on the existing fixture (`demo/walkontable/inline-end-overlay.html`), used read-only.
 */
export class InlineEndReview2Page extends InlineEndReviewPage {
  /** Wait for two animation frames, so a draw that was scheduled has reached the DOM. */
  async settleFrames(): Promise<void> {
    await this.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  }

  /**
   * Turn the window-scrolled fixture into a grid narrower than the page, whose columns the holder scrolls
   * while the window keeps the vertical axis: `preventOverflow: 'vertical'` over a root with a CSS size.
   * Load the fixture with `windowScroll` first.
   *
   * @param {number} width The grid's width in pixels.
   * @param {number} height The grid's height in pixels.
   */
  async narrowTheGridAndPreventVerticalOverflow(width: number, height: number): Promise<void> {
    await this.page.evaluate((size) => {
      const grid = document.querySelector('[data-testid="grid"]') as HTMLElement;

      grid.style.width = `${size.width}px`;
      grid.style.height = `${size.height}px`;
    }, { width, height });
    await this.updateSettings({ preventOverflow: 'vertical' });
    await this.page.evaluate(() => (window as unknown as HotHandle).hot.refreshDimensions());
    await this.settleFrames();
  }

  /** The grid's root element box, in viewport coordinates. */
  async gridBox() {
    return this.box(this.grid);
  }

  /**
   * The horizontal extent (left and right edge, viewport coordinates) of one clone.
   *
   * @param {CloneName} name The clone.
   */
  async horizontalExtent(name: CloneName): Promise<{ left: number, right: number }> {
    const { left, right } = await this.box(this.clone(name));

    return { left, right };
  }

  /**
   * The box of one clone, in viewport coordinates.
   *
   * @param {CloneName} name The clone.
   */
  async boxOf(name: CloneName) {
    return this.box(this.clone(name));
  }

  /**
   * Every column header of the leaf header row, and every body cell, with its `aria-colindex`, across the
   * master and all the clones. The header's column is read from its letters (A is column 0).
   */
  async ariaColumnIndexes(): Promise<{ headers: AriaIndexEntry[], cells: AriaIndexEntry[] }> {
    return this.grid.evaluate((grid) => {
      const letters = /^[A-Z]{1,2}$/;
      const toColumn = (label: string) => label.split('').reduce((sum, ch) => sum * 26 + ch.charCodeAt(0) - 64, 0) - 1;
      const headers: AriaIndexEntry[] = [];
      const cells: AriaIndexEntry[] = [];

      grid.querySelectorAll<HTMLElement>('.ht_master, [class*="ht_clone_"]').forEach((root) => {
        const table = root.className.split(/\s+/)
          .find(token => /^ht_(clone_(inline|top|bottom)|master)/.test(token) && !/_left/.test(token)) ?? 'unknown';

        root.querySelectorAll<HTMLElement>('thead th').forEach((th) => {
          const label = (th.textContent ?? '').trim();

          if (letters.test(label)) {
            headers.push({ col: toColumn(label), ariaColIndex: Number(th.getAttribute('aria-colindex')), table });
          }
        });
        root.querySelectorAll<HTMLElement>('tbody td[data-testid]').forEach((td) => {
          const col = Number(td.getAttribute('data-testid')?.split('-')[2]);

          cells.push({ col, ariaColIndex: Number(td.getAttribute('aria-colindex')), table });
        });
      });

      return { headers, cells };
    });
  }

  /**
   * The boxes of the fill handle (the "corner" of the selection border) that is displayed in the end clone,
   * together with the box of that clone's holder, which clips it. Viewport coordinates.
   */
  async endCloneFillHandle(): Promise<{ handle: { left: number, right: number }, holder: { left: number, right: number } } | null> {
    return this.endOverlay.evaluate((root) => {
      const handle = [...root.querySelectorAll<HTMLElement>('.wtBorder.corner')]
        .find(element => element.style.display === 'block');
      const holder = root.querySelector<HTMLElement>('.wtHolder');

      if (!handle || !holder) {
        return null;
      }

      const handleRect = handle.getBoundingClientRect();
      const holderRect = holder.getBoundingClientRect();

      return {
        handle: { left: handleRect.left, right: handleRect.right },
        holder: { left: holderRect.left, right: holderRect.right },
      };
    });
  }

  /**
   * Give the column headers a content-driven height: a header that wraps. Each entry maps a column to the
   * number of letters its header holds, which wrap inside the column and so set the header row height.
   *
   * @param {Record<number, number>} letters Column index to number of letters.
   */
  async setWrappingColumnHeaders(letters: Record<number, number>): Promise<void> {
    await this.page.evaluate((lengths) => {
      (window as unknown as HotHandle).hot.updateSettings({
        colHeaders: (col: number) => `<div style="white-space:normal;word-break:break-all">${
          'W'.repeat(lengths[col] ?? 1)}</div>`,
      });
    }, letters);
    await this.settleFrames();
  }

  /** Re-render the grid in full, the way `hot.render()` does. */
  async renderAgain(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as HotHandle).hot.render());
    await this.settleFrames();
  }

  /**
   * The height of the first column header row in every table that renders one, keyed by table.
   */
  async headerRowHeights(): Promise<Record<string, number>> {
    return this.grid.evaluate((grid) => {
      const heights: Record<string, number> = {};

      grid.querySelectorAll<HTMLElement>('.ht_master, [class*="ht_clone_"]').forEach((root) => {
        const table = root.className.split(/\s+/)
          .find(token => /^ht_(clone_(inline|top|bottom)|master)/.test(token) && !/_left/.test(token));
        const row = root.querySelector('thead tr');

        if (table && row) {
          heights[table] = Math.round(row.getBoundingClientRect().height * 10) / 10;
        }
      });

      return heights;
    });
  }

  /** A clone root, for the names this round reads. */
  clone(name: CloneName | 'inline_start'): Locator {
    return this.grid.locator(`.ht_clone_${name}`);
  }
}
