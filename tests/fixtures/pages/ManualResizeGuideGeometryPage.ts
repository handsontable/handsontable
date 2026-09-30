import { type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { ManualResizePage } from './ManualResizePage';

/**
 * A layout box, as `getBoundingClientRect()` reports it, in CSS pixels of the viewport.
 */
export type Box = {
  top: number,
  bottom: number,
  left: number,
  right: number,
  width: number,
  height: number,
};

/**
 * Every box a geometry assertion about the row resize handle or guide compares, read in ONE
 * `evaluate` so they describe the same frame. `handle` and `guide` are `null` while the plugin has
 * not attached them.
 */
export type ResizeGeometry = {
  header: Box,
  handle: Box | null,
  guide: Box | null,
  table: Box,
};

/**
 * Which overlay a row header is drawn in. The plugin resolves the header's position against each
 * one separately (`ROW_RESIZE_AXIS.getHeaderPosition`), so a spec addresses the header through the
 * overlay that paints it — which is also the copy the pointer reaches.
 */
export type RowHeaderOverlay = 'top-start-corner' | 'inline-start' | 'bottom-start-corner';

const OVERLAY_SELECTORS: Record<RowHeaderOverlay, string> = {
  'top-start-corner': '.ht_clone_top_inline_start_corner',
  'inline-start': '.ht_clone_inline_start',
  'bottom-start-corner': '.ht_clone_bottom_inline_start_corner',
};

/**
 * Page Object for the manual resize guide geometry fixture.
 *
 * The locators and the reveal gestures come from `ManualResizePage`. What this fixture adds is a
 * grid with a row header in each of the three overlays the plugin positions a handle against, and
 * a one-round-trip read of every box a geometry assertion needs.
 */
export class ManualResizeGuideGeometryPage extends ManualResizePage {
  /**
   * The row header cell drawn by a given overlay.
   *
   * `row` counts from the top of that overlay's body: row 0 of the top-start corner is the first
   * frozen row, row 0 of the bottom-start corner is the first row frozen at the bottom, and row `n`
   * of the inline-start overlay is visual row `n` while the grid sits at its scroll start.
   *
   * @param {RowHeaderOverlay} overlay The overlay that paints the header.
   * @param {number} row The row index inside that overlay's body.
   * @returns {Locator}
   */
  rowHeaderIn(overlay: RowHeaderOverlay, row: number): Locator {
    return this.grid.locator(`${OVERLAY_SELECTORS[overlay]} tbody tr`).nth(row).locator('th');
  }

  /**
   * Hovers a row header cell, which is what makes the row resize handle appear.
   *
   * The base class hovers through the inline-start overlay; a frozen row's header there is covered
   * by its corner overlay, and Playwright refuses to hover an element another one paints over. So
   * the header is addressed through the overlay that paints it. The handle is asserted ATTACHED,
   * not visible: it is `opacity: 0` until the pointer is over it, and Playwright reports a box at
   * opacity 0 as visible anyway.
   *
   * @param {Locator} header The header cell to hover.
   */
  async hoverRowHeaderCell(header: Locator): Promise<void> {
    await this.parkPointer();
    await header.hover();
    await expect(this.rowHandle).toHaveCount(1);
  }

  /**
   * Moves the pointer onto the center of the row resize handle, without pressing, and waits until
   * the handle shows itself — `:hover` is what takes it from `opacity: 0` to 1, and only a pointer
   * really over the handle triggers it. That is the state a user sees before pressing.
   */
  async moveOntoRowHandle(): Promise<void> {
    const box = await this.rowHandle.boundingBox();

    if (!box) {
      throw new Error('The row resize handle has no layout box.');
    }

    await this.page.mouse.move(box.x + (box.width / 2), box.y + (box.height / 2));
    await expect(this.rowHandle).toHaveCSS('opacity', '1');
  }

  /**
   * Presses the pointer where it rests (on the handle, after `moveOntoRowHandle()`), which is what
   * attaches and shows the guide.
   */
  async pressRowHandle(): Promise<void> {
    await this.page.mouse.down();
    await expect(this.rowGuide).toHaveClass(/active/);
  }

  /**
   * Moves the pointer down by a delta while the button is held, in two steps like the shared
   * gesture does (a single jump can be swallowed as a click).
   *
   * @param {number} deltaY How far to move, in CSS pixels. Positive is downward.
   */
  async dragPointerBy(deltaY: number): Promise<void> {
    const box = await this.rowHandle.boundingBox();

    if (!box) {
      throw new Error('The row resize handle has no layout box.');
    }

    const x = box.x + (box.width / 2);
    const y = box.y + (box.height / 2);

    await this.page.mouse.move(x, y + (deltaY / 2));
    await this.page.mouse.move(x, y + deltaY);
  }

  /**
   * Releases the pointer, ending whichever drag is open.
   */
  async releasePointer(): Promise<void> {
    await this.page.mouse.up();
  }

  /**
   * The boxes of a row header, the handle, the guide and the master table, read in one round trip.
   *
   * One `evaluate` rather than four `boundingBox()` calls: each of those resolves its node in one
   * round trip and measures it in another, and a re-render between the two hands back another row's
   * box (tests/AGENTS.md, Determinism). Every value a comparison needs comes out of the same call.
   *
   * @param {RowHeaderOverlay} overlay The overlay that paints the header.
   * @param {number} row The row index inside that overlay's body.
   * @returns {Promise<ResizeGeometry>}
   */
  async geometry(overlay: RowHeaderOverlay, row: number): Promise<ResizeGeometry> {
    return this.page.evaluate(([overlaySelector, rowIndex]) => {
      const grid = document.querySelector('[data-testid="grid"]') as HTMLElement;
      const box = (element: Element | null): Box | null => {
        if (!element) {
          return null;
        }

        const rect = element.getBoundingClientRect();

        return {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height,
        };
      };
      const headerRow = grid.querySelectorAll(`${overlaySelector} tbody tr`)[rowIndex as number];
      const header = box(headerRow?.querySelector('th') ?? null);
      const table = box(grid.querySelector('.ht_master table.htCore'));

      if (!header || !table) {
        throw new Error(`No row header at index ${rowIndex} in ${overlaySelector}, or no master table.`);
      }

      return {
        header,
        handle: box(grid.querySelector('.manualRowResizer')),
        guide: box(grid.querySelector('.manualRowResizerGuide')),
        table,
      };
    }, [OVERLAY_SELECTORS[overlay], row] as const);
  }

  /**
   * The rendered height of a visual row, from the master table.
   *
   * @param {number} row The visual row index.
   * @returns {Promise<number>}
   */
  async renderedRowHeight(row: number): Promise<number> {
    return this.page.evaluate(visualRow => (window as unknown as {
      renderedRowHeight: (r: number) => number
    }).renderedRowHeight(visualRow), row);
  }

  /**
   * How many rows the fixture's grid holds.
   *
   * @returns {Promise<number>}
   */
  async rowCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { htRowCount: number }).htRowCount);
  }

  /**
   * Navigate and wait for the grid to have rendered all three overlays a header can live in — a
   * real DOM condition, never a sleep.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/manual-resize-guide-geometry.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    await awaitBundle(this.page);

    await expect(this.rowHeaderIn('top-start-corner', 0)).toBeVisible();
    await expect(this.rowHeaderIn('inline-start', 2)).toBeVisible();
    await expect(this.rowHeaderIn('bottom-start-corner', 0)).toBeVisible();
  }
}
