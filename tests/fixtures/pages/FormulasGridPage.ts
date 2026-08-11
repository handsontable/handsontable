import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the HyperFormula-backed fill-handle fixture. Encapsulates
 * real-mouse range selection and dragging the `.area.corner` fill handle —
 * including past the viewport edge (which triggers the grid's auto-scroll) —
 * the interaction the legacy simulated-event helpers could never produce
 * (DEV-99).
 */
export class FormulasGridPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly areaCorner: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    // The fill handle of a RANGE selection (single-cell selections expose
    // `.current.corner` instead).
    this.areaCorner = page.locator('.ht_master .wtBorder.area.corner');
  }

  /**
   * Navigate and wait for the grid AND the formulas engine to render (the
   * formula cell C3 shows its computed value, not the raw expression).
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/formulas-grid.html?theme=${this.theme}&bundle=${this.bundle}`);
    // Source dates are ISO (1900-02-28); the default en-US locale renders
    // them as 02/28/1900. The formula cell C3 (`=C2`) showing the same
    // rendered date proves both the grid and the engine are up.
    await expect(this.cell(1, 2)).toHaveText('02/28/1900');
    await expect(this.cell(2, 2)).toHaveText('02/28/1900');
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** Select a rectangular range with a real mouse drag (down → move → up). */
  async selectRange(fromRow: number, fromCol: number, toRow: number, toCol: number): Promise<void> {
    const from = await this.cell(fromRow, fromCol).boundingBox();
    const to = await this.cell(toRow, toCol).boundingBox();

    if (!from || !to) {
      throw new Error('range endpoints are not rendered');
    }

    await this.page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 5 });
    await this.page.mouse.up();
    await expect(this.areaCorner).toBeVisible();
  }

  /**
   * Drag the range fill handle down to a target cell that starts BELOW the
   * grid's inner viewport: grab the handle, hold the pointer past the grid's
   * bottom edge while pumping mousemove events (the grid auto-scrolls only in
   * response to moves) until the target row scrolls into view, then finish
   * the gesture precisely on the target cell. Bounded, condition-driven — no
   * fixed sleeps.
   */
  async dragAreaFillHandleToCell(row: number, col: number): Promise<void> {
    const handle = await this.areaCorner.boundingBox();
    const gridBox = await this.grid.boundingBox();

    if (!handle || !gridBox) {
      throw new Error('the area fill handle or the grid is not rendered');
    }

    const startX = handle.x + handle.width / 2;
    const belowGridY = gridBox.y + gridBox.height + 20;

    await this.page.mouse.move(startX, handle.y + handle.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(startX, belowGridY, { steps: 8 });

    // Pump 1px jitter moves until auto-scroll brings the target row into the
    // holder's VISIBLE area (Playwright's isVisible() counts overflow-clipped
    // cells as visible, so intersect bounding boxes instead).
    for (let i = 0; i < 200 && !(await this.cellInHolderView(row, col)); i++) {
      await this.page.mouse.move(startX, belowGridY + (i % 2));
    }

    // boundingBox() reports overflow-clipped cells too, so an exhausted pump
    // must fail HERE with its real cause — not later, as a confusing data
    // mismatch after the gesture lands on a clipped coordinate.
    if (!(await this.cellInHolderView(row, col))) {
      throw new Error(`auto-scroll never brought cell ${row},${col} into the holder view`);
    }

    const target = await this.cell(row, col).boundingBox();

    if (!target) {
      throw new Error('the fill target cell never scrolled into view');
    }

    await this.page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 4 });
    await this.page.mouse.up();
  }

  /**
   * Whether a cell's box lies fully inside the master holder's visible area
   * (not merely rendered-but-clipped below its overflow edge).
   */
  async cellInHolderView(row: number, col: number): Promise<boolean> {
    const cellBox = await this.cell(row, col).boundingBox();
    const holderBox = await this.grid.locator('.ht_master .wtHolder').boundingBox();

    return Boolean(cellBox && holderBox &&
      cellBox.y + cellBox.height <= holderBox.y + holderBox.height + 1);
  }

  /** The grid's data, read through the instance the fixture exposes. */
  async data(): Promise<(string | number | null)[][]> {
    return this.page.evaluate(() => (window as any).hot.getData());
  }

  /** The grid's raw source data (formulas unevaluated). */
  async sourceData(): Promise<(string | number | null)[][]> {
    return this.page.evaluate(() => (window as any).hot.getSourceData());
  }
}
