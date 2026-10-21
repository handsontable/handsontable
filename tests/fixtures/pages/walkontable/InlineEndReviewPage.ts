import { expect, type Locator } from '@playwright/test';
import { InlineEndOverlayPage } from './InlineEndOverlayPage';

type WalkontableHandle = {
  hot: {
    view: {
      _wt: {
        wtOverlays: {
          inlineEndOverlay: {
            getOverlayOffset(): number,
          },
        },
      },
    },
    updateSettings(settings: object): void,
    scrollViewportTo(options: object): boolean,
    refreshDimensions(): void,
  },
};

/**
 * Extra reads for the review specs of the `fixedColumnsEnd` overlays. It builds on the existing page object and
 * the existing fixture (`demo/walkontable/inline-end-overlay.html`), which it uses read-only.
 */
export class InlineEndReviewPage extends InlineEndOverlayPage {
  /** The root element of each clone, by its class name. */
  clone(name: 'inline_start' | 'inline_end' | 'top_inline_end_corner' | 'bottom_inline_end_corner'): Locator {
    return this.grid.locator(`.ht_clone_${name}`);
  }

  /**
   * The physical sides a clone root is positioned from: which of `left` / `right` carry a value.
   *
   * @param {Locator} clone The clone's root element.
   */
  async insetSides(clone: Locator): Promise<{ left: string, right: string }> {
    return clone.evaluate(element => ({
      left: (element as HTMLElement).style.left,
      right: (element as HTMLElement).style.right,
    }));
  }

  /**
   * How many selection-edge elements of the area layer are drawn on the start side of the end band's first
   * column. Hidden elements and elements of a different shape are not counted. A visible copy in each
   * overlay that renders the column stacks into one thick line, so the number says how many are drawn.
   * An edge counts when it is a vertical bar, within a pixel of the freeze line, and overlaps `rows`.
   *
   * @param {{ top: number, bottom: number }} rows The vertical span the selection occupies (viewport coordinates).
   */
  async visibleStartEdgesAtSeam(rows: { top: number, bottom: number }): Promise<string[]> {
    return this.page.evaluate((span) => {
      const grid = document.querySelector('[data-testid="grid"]') as HTMLElement;
      const end = grid.querySelector('.ht_clone_inline_end') as HTMLElement;
      const rtl = getComputedStyle(end).direction === 'rtl';
      const endRect = end.getBoundingClientRect();
      // The end band's inline-start edge: its left edge in LTR, its right edge in RTL.
      const seam = rtl ? endRect.right : endRect.left;
      const found: string[] = [];

      grid.querySelectorAll<HTMLElement>('.wtBorder.area').forEach((edge) => {
        const rect = edge.getBoundingClientRect();
        const style = getComputedStyle(edge);

        if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || rect.height === 0) {
          return;
        }

        const isVerticalBar = rect.height > rect.width && rect.width <= 3;
        const overlapsRows = rect.top < span.bottom && rect.bottom > span.top;
        const center = (rect.left + rect.right) / 2;

        if (isVerticalBar && overlapsRows && Math.abs(center - seam) <= 1.5) {
          const clone = edge.closest('[class*="ht_clone_"], .ht_master');
          const name = (clone?.className ?? '').split(/\s+/)
            .find(token => /^ht_(clone_(inline|top|bottom)|master)/.test(token) && !/_left/.test(token));

          found.push(`${name}@${Math.round(center)}`);
        }
      });

      return found;
    }, rows);
  }

  /** The vertical span of a locator in viewport coordinates. */
  async verticalSpan(locator: Locator): Promise<{ top: number, bottom: number }> {
    const { top, bottom } = await this.box(locator);

    return { top, bottom };
  }

  /** The offset the end overlay reports for a window-scrolled grid. */
  async endOverlayOffset(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as WalkontableHandle).hot.view._wt.wtOverlays
      .inlineEndOverlay.getOverlayOffset());
  }

  /**
   * How far the end clone sits from its natural resting place at the table's inline end, from the DOM alone.
   * It is the number `getOverlayOffset()` has to report while the window scrolls the columns.
   */
  async endCloneDisplacement(): Promise<number> {
    return this.page.evaluate(() => {
      const hider = document.querySelector('[data-testid="grid"] .ht_master .wtHider') as HTMLElement;
      const clone = document.querySelector('[data-testid="grid"] .ht_clone_inline_end') as HTMLElement;
      const rtl = getComputedStyle(clone).direction === 'rtl';
      const hiderRect = hider.getBoundingClientRect();
      const cloneRect = clone.getBoundingClientRect();

      return Math.round(Math.abs((rtl ? cloneRect.left : cloneRect.right) - (rtl ? hiderRect.left : hiderRect.right)));
    });
  }

  /** The largest horizontal scroll offset of the page (magnitude). */
  async maxWindowScroll(): Promise<number> {
    return this.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  }

  /**
   * Scroll the page sideways to an absolute magnitude (the layout direction is applied) and wait until the
   * grid has drawn for it.
   *
   * @param {number} magnitude How far to scroll.
   */
  async scrollWindowTo(magnitude: number): Promise<void> {
    await this.page.evaluate((target) => {
      window.scrollTo(document.documentElement.dir === 'rtl' ? -target : target, 0);
    }, magnitude);
    await expect.poll(() => this.page.evaluate(() => Math.abs(Math.round(window.scrollX)))).toBe(magnitude);
    await this.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  }

  /** Give the page a margin on each side, so the grid does not sit on the edges of the page. */
  async insetPage(start: number, end: number): Promise<void> {
    await this.page.addStyleTag({
      content: `body { margin-inline-start: ${start}px !important; margin-inline-end: ${end}px !important; }`,
    });
    await this.page.evaluate(() => (window as unknown as WalkontableHandle).hot.refreshDimensions());
  }

  /**
   * Make one column wider than the rest.
   *
   * @param {number} col The column.
   * @param {number} width Its width in pixels.
   * @param {number} base The width of every other column.
   */
  async widenColumn(col: number, width: number, base = 60): Promise<void> {
    await this.page.evaluate((target) => {
      (window as unknown as WalkontableHandle).hot.updateSettings({
        colWidths: (index: number) => (index === target.col ? target.width : target.base),
      });
    }, { col, width, base });
  }

  /** Ask the engine to bring a column into view the way the keyboard and API navigation do. */
  async scrollViewportToColumn(row: number, col: number): Promise<void> {
    await this.page.evaluate((target) => {
      (window as unknown as WalkontableHandle).hot.scrollViewportTo(target);
    }, { row, col });
  }
}
