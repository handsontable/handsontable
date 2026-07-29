import { type Page, type Locator, expect } from '@playwright/test';
import type {} from './windowTypes';

/**
 * Page Object for the selection features fixture
 * (tests/fixtures/demo/selection-features.html).
 *
 * The fixture runs a grid with `selectionHandles` and `moveCells` enabled.
 * Tests express intent (`selectCells`, `hoverCell`, `visibleHandles`); the
 * selectors and the `window.hot` driving mechanics live here. Locators are
 * scoped to the master overlay — the frozen-pane clones duplicate the border
 * elements, so an unscoped match would be ambiguous.
 */
export class SelectionFeaturesPage {
  readonly page: Page;
  readonly theme: string;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main') {
    this.page = page;
    this.theme = theme;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture and wait for the grid to render (web-first wait on
   * a real DOM condition).
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/selection-features.html?theme=${this.theme}`);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Rebuild the grid with the default selection-feature settings merged with
   * the given overrides — a fresh instance per test, no cross-test state.
   */
  async initGrid(overrides: Record<string, unknown> = {}): Promise<void> {
    await this.page.evaluate(settings => window.initSelectionGrid(settings), overrides);
    await expect(this.grid.locator('.ht-wrapper')).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /** Select a cell range through the instance API. */
  async selectCells(fromRow: number, fromCol: number, toRow: number, toCol: number): Promise<void> {
    await this.page.evaluate(range => window.hot.selectCells([range]), [fromRow, fromCol, toRow, toCol]);
  }

  /** Clear the selection through the instance API. */
  async deselect(): Promise<void> {
    await this.page.evaluate(() => window.hot.deselectCell());
  }

  /** Destroy the grid instance. */
  async destroyGrid(): Promise<void> {
    await this.page.evaluate(() => window.hot.destroy());
  }

  /** Hover a cell with the real pointer (drives the handle-visibility logic). */
  async hoverCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).hover();
  }

  /** Hover a cell rendered by the top-left frozen overlay. */
  async hoverFrozenCornerCell(row: number, col: number): Promise<void> {
    await this.page.locator('.ht_clone_top_left_corner').getByTestId(`cell-${row}-${col}`).hover();
  }

  /**
   * The visible selection-adjust handle for an edge, scoped to the master
   * overlay. Every border instance (focus, area, fill) owns a full handle set,
   * so the non-visible duplicates are filtered out to keep the locator strict.
   */
  handle(edge: 'top' | 'bottom' | 'start' | 'end'): Locator {
    return this.page.locator(`.ht_master .wtSelectionHandle--${edge}:visible`);
  }

  /** The currently visible selection-adjust handles in the master overlay. */
  visibleHandles(): Locator {
    return this.page.locator('.ht_master .wtSelectionHandle:visible');
  }

  /** The currently visible move-zone bands in the master overlay. */
  visibleMoveZones(): Locator {
    return this.page.locator('.ht_master .wtMoveZone:visible');
  }

  /**
   * The grid's root wrapper carrying the `ht__moving` drag-state class. The
   * class lands on the wrapper Handsontable creates inside the container, not
   * on the container itself.
   */
  movingRoot(): Locator {
    return this.page.locator('.handsontable.ht__moving');
  }

  /** The document-level move preview ghost. */
  moveGhost(): Locator {
    return this.page.locator('.wtMoveGhost');
  }

  /** The union bounding box of a cell range — the selection's visual extent. */
  async rangeBox(
    fromRow: number, fromCol: number, toRow: number, toCol: number,
  ): Promise<{ left: number, right: number, top: number, bottom: number }> {
    const fromBox = await this.cell(fromRow, fromCol).boundingBox();
    const toBox = await this.cell(toRow, toCol).boundingBox();

    if (!fromBox || !toBox) {
      throw new Error('The range corner cells are not rendered.');
    }

    return {
      left: Math.min(fromBox.x, toBox.x),
      right: Math.max(fromBox.x + fromBox.width, toBox.x + toBox.width),
      top: Math.min(fromBox.y, toBox.y),
      bottom: Math.max(fromBox.y + fromBox.height, toBox.y + toBox.height),
    };
  }
}
