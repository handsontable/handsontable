import { expect, type Locator } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { ManualResizePage } from './ManualResizePage';

/**
 * Which edge a resize handle is measured against.
 */
export type ResizeAxisName = 'row' | 'column';

/**
 * The rendered size of a header and how far the resize handle's center sits from that header's
 * far edge. `gap` is `null` when the handle is not in the document. Both numbers come from one
 * read, because a second round trip can land on a node the renderer has since reused.
 */
export interface HandleEdgeMeasurement {
  size: number;
  gap: number | null;
}

/**
 * Page object for the resize-handle undo fixture.
 *
 * Reveal and drag come from `ManualResizePage`.
 */
export class ManualResizeUndoPage extends ManualResizePage {
  /**
   * Reads the header's rendered size and the signed distance from the resize handle's center to
   * the header's far edge. A handle centered on that edge reports about -1.
   *
   * @param {ResizeAxisName} axis Which header to measure.
   * @param {number} index The visual index.
   * @returns {Promise<HandleEdgeMeasurement>}
   */
  async measureHandleEdge(axis: ResizeAxisName, index: number): Promise<HandleEdgeMeasurement> {
    return this.page.evaluate(({ axisName, visualIndex }) => {
      const grid = document.querySelector('[data-testid="grid"]');
      const handleSelector = axisName === 'row' ? '.manualRowResizer' : '.manualColumnResizer';
      const handle = grid?.querySelector(handleSelector) ?? null;
      const header = axisName === 'row'
        ? grid?.querySelectorAll('.ht_clone_inline_start tbody tr')[visualIndex]?.querySelector('th')
        : grid?.querySelector('.ht_clone_top thead tr')?.querySelectorAll('th')[visualIndex + 1];

      if (!header) {
        throw new Error(`No ${axisName} header at visual index ${visualIndex}.`);
      }

      const headerBox = header.getBoundingClientRect();
      const size = axisName === 'row' ? headerBox.height : headerBox.width;

      if (!handle) {
        return { size, gap: null };
      }

      const handleBox = handle.getBoundingClientRect();
      const handleCenter = axisName === 'row'
        ? handleBox.top + (handleBox.height / 2)
        : handleBox.left + (handleBox.width / 2);
      const edge = axisName === 'row' ? headerBox.bottom : headerBox.right;

      return { size, gap: handleCenter - edge };
    }, { axisName: axis, visualIndex: index });
  }

  /**
   * Clicks the first data cell.
   */
  async clickFirstCell(): Promise<void> {
    await this.grid.locator('.ht_master tbody td').first().click();
  }

  /**
   * Drags a row handle, then releases to the left of the grid so the mouseup is outside it.
   * The release keeps the dragged Y, so the row stays at the dragged height.
   *
   * @param {number} row The visual row index.
   * @param {number} deltaY How far to drag, in CSS pixels.
   */
  async dragRowHandleReleaseOutside(row: number, deltaY: number): Promise<void> {
    await this.hoverRowHeader(row);
    await this.#dragHandleReleaseOutside(this.rowHandle, 0, deltaY, 'beside');
  }

  /**
   * Drags a column handle, then releases above the grid so the mouseup is outside it.
   * The release keeps the dragged X, so the column stays at the dragged width.
   *
   * @param {number} column The visual column index.
   * @param {number} deltaX How far to drag, in CSS pixels.
   */
  async dragColumnHandleReleaseOutside(column: number, deltaX: number): Promise<void> {
    await this.hoverColumnHeader(column);
    await this.#dragHandleReleaseOutside(this.columnHandle, deltaX, 0, 'above');
  }

  /**
   * Undoes the last recorded action through the keyboard shortcut.
   */
  async undoWithKeyboard(): Promise<void> {
    await this.page.keyboard.press('ControlOrMeta+z');
  }

  async redoWithKeyboard(): Promise<void> {
    await this.page.keyboard.press('ControlOrMeta+Shift+z');
  }

  /**
   * Drags a revealed handle, then releases outside the grid on the axis that does not change
   * the dragged size.
   *
   * @param {Locator} handle The resize handle to drag.
   * @param {number} deltaX How far to drag horizontally.
   * @param {number} deltaY How far to drag vertically.
   * @param {'above' | 'beside'} side Where to release, outside the grid.
   */
  async #dragHandleReleaseOutside(
    handle: Locator, deltaX: number, deltaY: number, side: 'above' | 'beside'
  ): Promise<void> {
    const box = await handle.boundingBox();

    if (!box) {
      throw new Error('The resize handle has no layout box.');
    }

    const startX = box.x + (box.width / 2);
    const startY = box.y + (box.height / 2);
    const endX = startX + deltaX;
    const endY = startY + deltaY;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + (deltaX / 2), startY + (deltaY / 2));
    await this.page.mouse.move(endX, endY);

    const gridBox = await this.grid.boundingBox();

    if (!gridBox) {
      throw new Error('The grid has no layout box.');
    }

    const releaseX = side === 'beside' ? Math.max(0, gridBox.x - 8) : endX;
    const releaseY = side === 'above' ? Math.max(0, gridBox.y - 8) : endY;

    await this.page.mouse.move(releaseX, releaseY);
    await this.page.mouse.up();
  }

  /**
   * Navigate and wait for the grid to have rendered. A constructor throw is rethrown here.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/manual-resize-undo.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    await awaitBundle(this.page);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError !== null) {
      throw new Error(`The grid failed to build: ${initError}`);
    }

    await expect(this.grid.locator('.ht_clone_top')).toBeVisible();
    await expect(this.grid.locator('.ht_clone_inline_start')).toBeVisible();
    await expect(this.grid.locator('.ht_clone_inline_start tbody tr')).toHaveCount(8);
  }
}
