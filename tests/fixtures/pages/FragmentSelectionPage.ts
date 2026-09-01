import { type Page, type Locator, expect } from '@playwright/test';

/**
 * The overlay a cell is looked up in. Frozen cells are rendered in a clone that sits beside the
 * master table in the DOM, so every lookup names the overlay it means — an unscoped `data-testid`
 * match would be ambiguous for any frozen cell.
 */
export type OverlayName = 'master' | 'inlineStart' | 'top' | 'corner';

const OVERLAY_SELECTORS: Record<OverlayName, string> = {
  master: '.ht_master',
  inlineStart: '.ht_clone_inline_start',
  top: '.ht_clone_top',
  corner: '.ht_clone_top_inline_start_corner',
};

/**
 * Page Object for the `fragmentSelection` fixture
 * (tests/fixtures/demo/fragment-selection.html).
 *
 * Tests express intent (`dragAcrossTextIn`, `selectedText`); the overlay selectors and the mouse
 * mechanics live here.
 */
export class FragmentSelectionPage {
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
   * Any stamped cell in the master table. Which columns the master renders depends on the frozen
   * settings — with frozen columns it skips the frozen ones entirely — so a fixed row/column pair
   * would not survive every override. This waits for the table to be populated without naming a
   * cell.
   *
   * @returns {Locator}
   */
  #anyMasterCell(): Locator {
    return this.grid.locator('.ht_master [data-testid^="cell-"]').first();
  }

  /**
   * Navigates to the fixture and waits for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/fragment-selection.html?theme=${this.theme}&bundle=${this.bundle}`);
    await expect(this.#anyMasterCell()).toBeVisible();
  }

  /**
   * Rebuilds the grid with the given setting overrides — a fresh instance per test.
   *
   * @param {object} overrides Handsontable settings merged over the fixture defaults.
   */
  async initGrid(overrides: Record<string, unknown> = {}): Promise<void> {
    await this.page.evaluate(settings => window.initFragmentSelectionGrid(settings), overrides);
    await expect(this.#anyMasterCell()).toBeVisible();
  }

  /**
   * Locates a cell inside one specific overlay.
   *
   * @param {OverlayName} overlay The overlay to look in.
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   * @returns {Locator}
   */
  cell(overlay: OverlayName, row: number, col: number): Locator {
    return this.grid.locator(OVERLAY_SELECTORS[overlay]).getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Fails loudly when a drag would run outside the grid's visible box. A cell that the grid's width
   * clips still reports a layout box, so a drag aimed at it would silently land on whatever is
   * really at those pixels and the test would assert against the wrong gesture.
   *
   * @param {OverlayName} overlay The overlay holding the cell, for the error message.
   * @param {number} row Visual row index, for the error message.
   * @param {number} col Visual column index, for the error message.
   * @param {number} startX Where the drag begins.
   * @param {number} endX Where the drag ends.
   * @param {number} y The drag's vertical position.
   */
  async #assertDragStaysInsideGrid(
    overlay: OverlayName, row: number, col: number, startX: number, endX: number, y: number,
  ): Promise<void> {
    const gridBox = await this.grid.boundingBox();

    if (!gridBox) {
      throw new Error('The grid has no layout box');
    }

    const withinX = Math.min(startX, endX) >= gridBox.x && Math.max(startX, endX) <= gridBox.x + gridBox.width;
    const withinY = y >= gridBox.y && y <= gridBox.y + gridBox.height;

    if (!withinX || !withinY) {
      throw new Error(
        `The drag across cell ${row},${col} in the ${overlay} overlay leaves the grid's visible box `
        + `(x ${Math.min(startX, endX)}–${Math.max(startX, endX)}, y ${y} vs grid `
        + `x ${gridBox.x}–${gridBox.x + gridBox.width}, y ${gridBox.y}–${gridBox.y + gridBox.height}). `
        + 'Pick a cell the grid actually shows.');
    }
  }

  /**
   * Drags the mouse horizontally across a cell's text, the way a user sweeps out a text fragment.
   * The drag stays well inside the cell so it can never reach a neighbouring one.
   *
   * @param {OverlayName} overlay The overlay holding the cell.
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   */
  async dragAcrossTextIn(overlay: OverlayName, row: number, col: number): Promise<void> {
    const box = await this.cell(overlay, row, col).boundingBox();

    if (!box) {
      throw new Error(`Cell ${row},${col} in the ${overlay} overlay has no layout box`);
    }

    const y = box.y + (box.height / 2);
    const startX = box.x + 10;
    const endX = box.x + (box.width * 0.75);

    await this.#assertDragStaysInsideGrid(overlay, row, col, startX, endX, y);

    await this.page.mouse.move(startX, y);
    await this.page.mouse.down();
    // Several intermediate moves: one jump to the end can be treated as a click-with-no-drag.
    await this.page.mouse.move(startX + ((endX - startX) / 3), y, { steps: 5 });
    await this.page.mouse.move(startX + (((endX - startX) * 2) / 3), y, { steps: 5 });
    await this.page.mouse.move(endX, y, { steps: 5 });
    await this.page.mouse.up();
  }

  /**
   * Drags from a cell in one overlay to a cell in another, crossing the seam between them.
   *
   * @param {object} from The cell the drag starts in.
   * @param {object} to The cell the drag ends in.
   */
  async dragBetweenOverlays(
    from: { overlay: OverlayName, row: number, col: number },
    to: { overlay: OverlayName, row: number, col: number },
  ): Promise<void> {
    const fromBox = await this.cell(from.overlay, from.row, from.col).boundingBox();
    const toBox = await this.cell(to.overlay, to.row, to.col).boundingBox();

    if (!fromBox || !toBox) {
      throw new Error('One of the cells to drag between has no layout box');
    }

    const startX = fromBox.x + (fromBox.width * 0.9);
    const startY = fromBox.y + (fromBox.height / 2);
    const endX = toBox.x + (toBox.width / 2);
    const endY = toBox.y + (toBox.height / 2);

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + ((endX - startX) / 3), startY + ((endY - startY) / 3), { steps: 5 });
    await this.page.mouse.move(startX + (((endX - startX) * 2) / 3), startY + (((endY - startY) * 2) / 3), { steps: 5 });
    await this.page.mouse.move(endX, endY, { steps: 5 });
    await this.page.mouse.up();
  }

  /**
   * Returns the text the browser reports as selected.
   *
   * @returns {Promise<string>}
   */
  selectedText(): Promise<string> {
    return this.page.evaluate(() => window.readTextSelection());
  }

  /**
   * Drops any existing text selection.
   */
  async clearTextSelection(): Promise<void> {
    await this.page.evaluate(() => window.clearTextSelection());
  }

  /**
   * Returns the full text of a cell, so a test can compare a selection against the cell it came
   * from rather than against a hardcoded string.
   *
   * @param {OverlayName} overlay The overlay holding the cell.
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   * @returns {Promise<string>}
   */
  async cellText(overlay: OverlayName, row: number, col: number): Promise<string> {
    return (await this.cell(overlay, row, col).innerText()).trim();
  }
}
