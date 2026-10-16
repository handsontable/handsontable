import { expect } from '@playwright/test';
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
   * Moves visual row 2 so that it starts at index 5.
   */
  async moveThirdRowBelowFifth(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as {
      moveThirdRowBelowFifth: () => void
    }).moveThirdRowBelowFifth());
    await expect(this.rowHeader(3)).toBeVisible();
  }

  /**
   * Moves visual column 2 so that it starts at index 5.
   */
  async moveThirdColumnBelowFifth(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as {
      moveThirdColumnBelowFifth: () => void
    }).moveThirdColumnBelowFifth());
    await expect(this.columnHeader(3)).toBeVisible();
  }

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
   * Undoes the last recorded action through the keyboard shortcut.
   */
  async undoWithKeyboard(): Promise<void> {
    await this.page.keyboard.press('ControlOrMeta+z');
  }

  /**
   * Navigate and wait for the grid to have rendered.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/manual-resize-undo.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    await awaitBundle(this.page);

    await expect(this.grid.locator('.ht_clone_top')).toBeVisible();
    await expect(this.grid.locator('.ht_clone_inline_start')).toBeVisible();
    await expect(this.grid.locator('.ht_clone_inline_start tbody tr')).toHaveCount(8);
  }
}
