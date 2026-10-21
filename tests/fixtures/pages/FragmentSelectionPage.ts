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
   * Locates a row header inside one specific overlay.
   *
   * @param {OverlayName} overlay The overlay to look in.
   * @param {number} row Position among the rendered rows. It matches the visual row index only while
   * the grid has not scrolled vertically.
   * @returns {Locator}
   */
  rowHeader(overlay: OverlayName, row: number): Locator {
    return this.grid
      .locator(OVERLAY_SELECTORS[overlay])
      .locator(`tbody tr:nth-child(${row + 1}) > th`);
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
        `The pointer path over ${label} leaves the grid's visible box `
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
  async dragAcrossCells(overlay: OverlayName, row: number, fromCol: number, toCol: number): Promise<number> {
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

    await this.page.evaluate(() => window.resetBorderMoveCount());
    await this.page.mouse.move(startX, y);
    await this.page.mouse.down();

    // Small steps, with a hit test after each one. The hit test is not an assertion — it is what
    // paces the drag. Playwright's synthetic moves are fast enough that the browser merges them, and
    // without the pause between them the selection border between two cells never becomes a move's
    // target, so the gesture stops covering the case it exists for.
    for (let step = 1; step <= 20; step += 1) {
      const x = startX + (((endX - startX) * step) / 20);

      await this.page.mouse.move(x, y, { steps: 2 });
      await this.page.evaluate(([px, py]) => window.elementUnder(px, py), [x, y]);
    }

    await this.page.mouse.up();

    // How many mouse moves actually landed on a selection border. Taken from the real event targets
    // rather than the hit tests above, which sample only the step positions and miss a border
    // crossed between two of them. A caller asserts this is above zero, so a drag that stops
    // reaching the border fails loudly instead of passing while covering nothing.
    return this.page.evaluate(() => window.getBorderMoveCount());
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
   * Fails loudly unless a press at a point lands on the given master-table cell. A box-derived point
   * can sit under a header clone or past the fold, and a press there starts a different gesture.
   *
   * @param {string} label Describes the cell, for the error message.
   * @param {number} x The press's horizontal position.
   * @param {number} y The press's vertical position.
   * @param {string} testId The `data-testid` the cell carries.
   */
  async #assertPressLandsOnCell(label: string, x: number, y: number, testId: string): Promise<void> {
    const hit = await this.page.evaluate(([px, py]) => {
      const td = document.elementFromPoint(px, py)?.closest('td');

      return td?.closest('.ht_master') ? td.getAttribute('data-testid') : null;
    }, [x, y]);

    if (hit !== testId) {
      throw new Error(`A press at (${x}, ${y}) lands on ${hit ?? 'no master cell'}, not on ${label}.`);
    }
  }

  /**
   * Drags from a master-table cell's text out past the grid's right edge and releases the button off
   * the grid, so the `mouseup` lands on the page instead of on the grid.
   *
   * It leaves through the right edge because the top and left edges cross a header, which cancels the
   * selection before the release. The fixture is left-to-right.
   *
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   * @returns {Promise<boolean>} Whether the `mouseup` landed off the grid.
   */
  async dragFromCellOutOfGrid(row: number, col: number): Promise<boolean> {
    const label = `cell ${row},${col} in the master overlay`;
    const box = await this.cell('master', row, col).boundingBox();
    const gridBox = await this.grid.boundingBox();
    const viewport = this.page.viewportSize();

    if (!box || !gridBox || !viewport) {
      throw new Error(`${label}, the grid, or the viewport has no size`);
    }

    const y = box.y + (box.height / 2);
    const startX = box.x + 15;
    const endX = gridBox.x + gridBox.width + 60;

    await this.#assertPressLandsOnCell(label, startX, y, `cell-${row}-${col}`);

    if (endX >= viewport.width) {
      throw new Error(`The release point (x ${endX}) is outside the ${viewport.width}px viewport`);
    }

    await this.page.evaluate(() => window.resetLastMouseUp());
    await this.page.mouse.move(startX, y);
    await this.page.mouse.down();

    for (let step = 1; step <= 20; step += 1) {
      await this.page.mouse.move(startX + (((endX - startX) * step) / 20), y, { steps: 2 });
    }

    await this.page.mouse.up();

    return (await this.page.evaluate(() => window.wasLastMouseUpOffGrid())) === true;
  }

  /**
   * Returns the master table's scroll position.
   *
   * @returns {Promise<{left: number, top: number}>}
   */
  scrollPosition(): Promise<{ left: number, top: number }> {
    return this.grid.evaluate((grid) => {
      const holder = grid.querySelector('.ht_master .wtHolder')!;

      return { left: holder.scrollLeft, top: holder.scrollTop };
    });
  }

  /**
   * Hovers a row header with no button held.
   *
   * @param {number} row Position among the rendered rows.
   * @returns {Promise<number>} How many mouse moves landed on a header.
   */
  async hoverRowHeader(row: number): Promise<number> {
    const box = await this.rowHeader('inlineStart', row).boundingBox();

    if (!box) {
      throw new Error(`The header of row ${row} has no layout box`);
    }

    return this.#hoverAt(`the header of row ${row}`, box.x + (box.width / 2), box.y + (box.height / 2));
  }

  /**
   * Hovers the column header row at the grid's horizontal center, with no button held.
   *
   * @returns {Promise<number>} How many mouse moves landed on a header.
   */
  async hoverColumnHeader(): Promise<number> {
    const headerRow = await this.grid.locator(OVERLAY_SELECTORS.top).locator('thead tr').first().boundingBox();
    const gridBox = await this.grid.boundingBox();

    if (!headerRow || !gridBox) {
      throw new Error('The column header row or the grid has no layout box');
    }

    return this.#hoverAt(
      'the column header row', gridBox.x + (gridBox.width / 2), headerRow.y + (headerRow.height / 2));
  }

  /**
   * Moves the pointer to a point inside the grid with no button held.
   *
   * @param {string} label Describes the target, for the guard's error message.
   * @param {number} x Where the pointer ends, horizontally.
   * @param {number} y Where the pointer ends, vertically.
   * @returns {Promise<number>} How many mouse moves landed on a header.
   */
  async #hoverAt(label: string, x: number, y: number): Promise<number> {
    await this.#assertDragStaysInsideGrid(label, x, x, y);
    await this.page.evaluate(() => window.resetHeaderMoveCount());
    await this.page.mouse.move(x, y, { steps: 20 });

    return this.page.evaluate(() => window.getHeaderMoveCount());
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
