import { type Page, type Locator, expect } from '@playwright/test';

/**
 * The overlay a cell is looked up in. Frozen cells are rendered in a clone that sits beside the
 * master table in the DOM, so every lookup names the overlay it means — an unscoped `data-testid`
 * match would be ambiguous for any frozen cell.
 */
export type OverlayName = 'master' | 'inlineStart' | 'top' | 'corner' | 'bottom' | 'bottomCorner';

const OVERLAY_SELECTORS: Record<OverlayName, string> = {
  master: '.ht_master',
  inlineStart: '.ht_clone_inline_start',
  top: '.ht_clone_top',
  corner: '.ht_clone_top_inline_start_corner',
  bottom: '.ht_clone_bottom',
  bottomCorner: '.ht_clone_bottom_inline_start_corner',
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
   * Locates a column header inside one specific overlay. Headers live in every overlay that renders
   * them, so the lookup names the one it means.
   *
   * @param {OverlayName} overlay The overlay to look in.
   * @param {number} col Visual column index.
   * @returns {Locator}
   */
  columnHeader(overlay: OverlayName, col: number): Locator {
    return this.grid
      .locator(OVERLAY_SELECTORS[overlay])
      .locator(`thead th:nth-child(${col + 1})`);
  }

  /**
   * Fails loudly when a drag would run outside the grid's visible box. An element the grid's width
   * or height clips still reports a layout box, so a drag aimed at it would silently land on
   * whatever is really at those pixels and the test would assert against the wrong gesture.
   *
   * @param {string} label Describes the drag target, for the error message.
   * @param {number} startX Where the drag begins.
   * @param {number} endX Where the drag ends.
   * @param {number} y The drag's vertical position.
   */
  async #assertDragStaysInsideGrid(label: string, startX: number, endX: number, y: number): Promise<void> {
    const gridBox = await this.grid.boundingBox();

    if (!gridBox) {
      throw new Error('The grid has no layout box');
    }

    const withinX = Math.min(startX, endX) >= gridBox.x && Math.max(startX, endX) <= gridBox.x + gridBox.width;
    const withinY = y >= gridBox.y && y <= gridBox.y + gridBox.height;

    if (!withinX || !withinY) {
      throw new Error(
        `The drag across ${label} leaves the grid's visible box `
        + `(x ${Math.min(startX, endX)}–${Math.max(startX, endX)}, y ${y} vs grid `
        + `x ${gridBox.x}–${gridBox.x + gridBox.width}, y ${gridBox.y}–${gridBox.y + gridBox.height}). `
        + 'Pick a target the grid actually shows.');
    }
  }

  /**
   * Drags the mouse horizontally across one element's text, the way a user sweeps out a text
   * fragment. The drag stays well inside the element so it can never reach a neighbour.
   *
   * @param {Locator} target The element to sweep across.
   * @param {string} label Describes the target, for the guard's error message.
   */
  async dragAcrossText(target: Locator, label: string): Promise<void> {
    const box = await target.boundingBox();

    if (!box) {
      throw new Error(`${label} has no layout box`);
    }

    const y = box.y + (box.height / 2);
    const startX = box.x + 10;
    const endX = box.x + (box.width * 0.75);

    await this.#assertDragStaysInsideGrid(label, startX, endX, y);

    await this.page.mouse.move(startX, y);
    await this.page.mouse.down();
    // Several intermediate moves: one jump to the end can be treated as a click-with-no-drag.
    await this.page.mouse.move(startX + ((endX - startX) / 3), y, { steps: 5 });
    await this.page.mouse.move(startX + (((endX - startX) * 2) / 3), y, { steps: 5 });
    await this.page.mouse.move(endX, y, { steps: 5 });
    await this.page.mouse.up();
  }

  /**
   * Drags the mouse across a cell's text.
   *
   * @param {OverlayName} overlay The overlay holding the cell.
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   */
  async dragAcrossTextIn(overlay: OverlayName, row: number, col: number): Promise<void> {
    await this.dragAcrossText(
      this.cell(overlay, row, col), `cell ${row},${col} in the ${overlay} overlay`);
  }

  /**
   * Drags the mouse across a column header's text.
   *
   * @param {OverlayName} overlay The overlay holding the header.
   * @param {number} col Visual column index.
   */
  async dragAcrossColumnHeaderIn(overlay: OverlayName, col: number): Promise<void> {
    await this.dragAcrossText(
      this.columnHeader(overlay, col), `column header ${col} in the ${overlay} overlay`);
  }

  /**
   * Drags the mouse from one cell to another in the same row and overlay, sweeping across the cell
   * boundary between them. The pointer passes over the selection border that sits between the cells,
   * which is the part a single-cell drag never exercises.
   *
   * @param {OverlayName} overlay The overlay holding both cells.
   * @param {number} row Visual row index.
   * @param {number} fromCol Visual column index the drag starts in.
   * @param {number} toCol Visual column index the drag ends in.
   */
  async dragAcrossCells(overlay: OverlayName, row: number, fromCol: number, toCol: number): Promise<void> {
    const from = await this.cell(overlay, row, fromCol).boundingBox();
    const to = await this.cell(overlay, row, toCol).boundingBox();

    if (!from || !to) {
      throw new Error(`Cells ${fromCol}..${toCol} in row ${row} of the ${overlay} overlay have no layout box`);
    }

    const y = from.y + (from.height / 2);
    const startX = from.x + 15;
    const endX = to.x + to.width - 15;

    await this.#assertDragStaysInsideGrid(
      `cells ${fromCol}..${toCol} in row ${row} of the ${overlay} overlay`, startX, endX, y);

    await this.page.mouse.move(startX, y);
    await this.page.mouse.down();

    // Small steps, with a hit test after each one. The hit test is not an assertion — it is what
    // paces the drag. Playwright's synthetic moves are fast enough that the browser coalesces them,
    // and without the pause between them the selection border between two cells never becomes a
    // move's target, so the gesture stops covering the case it exists for. Its return value is
    // deliberately unused: it samples only the step positions, while the border is hit at an
    // intermediate one, so it cannot prove the crossing. The selected text does that instead.
    for (let step = 1; step <= 20; step += 1) {
      const x = startX + (((endX - startX) * step) / 20);

      await this.page.mouse.move(x, y, { steps: 2 });
      await this.page.evaluate(([px, py]) => window.elementUnder(px, py), [x, y]);
    }

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
