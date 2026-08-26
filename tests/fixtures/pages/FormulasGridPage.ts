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

  /**
   * Select a rectangular range with a real mouse drag (down → move → up).
   *
   * Both drag points are clamped into the holder's VISIBLE area: a cell's
   * bounding box ignores overflow clipping, so on tall-row themes the target
   * cell's center can lie past the holder's bottom edge — and a real mouse
   * parked there means "extend the selection past the edge": drag-to-scroll
   * kicks in and the selection overshoots the intended range by a row (this
   * is exactly how the horizon legs selected 1,2→3,4 instead of 1,2→2,4).
   * The achieved range is asserted afterwards so an overshoot fails loudly
   * here, not as a confusing corner/fill mismatch later.
   */
  async selectRange(fromRow: number, fromCol: number, toRow: number, toCol: number): Promise<void> {
    const from = await this.cell(fromRow, fromCol).boundingBox();
    const to = await this.cell(toRow, toCol).boundingBox();
    const holder = await this.grid.locator('.ht_master .wtHolder').boundingBox();

    if (!from || !to || !holder) {
      throw new Error('range endpoints or the holder are not rendered');
    }

    const clampX = (x: number) => Math.min(Math.max(x, holder.x + 2), holder.x + holder.width - 2);
    const clampY = (y: number) => Math.min(Math.max(y, holder.y + 2), holder.y + holder.height - 2);

    await this.page.mouse.move(clampX(from.x + from.width / 2), clampY(from.y + from.height / 2));
    await this.page.mouse.down();
    await this.page.mouse.move(clampX(to.x + to.width / 2), clampY(to.y + to.height / 2), { steps: 5 });
    await this.page.mouse.up();
    await expect(this.areaCorner).toBeVisible();

    const achieved = await this.page.evaluate(() => {
      const range = (window as any).hot.getSelectedRangeLast();

      return {
        fromRow: Math.min(range.from.row, range.to.row),
        fromCol: Math.min(range.from.col, range.to.col),
        toRow: Math.max(range.from.row, range.to.row),
        toCol: Math.max(range.from.col, range.to.col),
      };
    });

    expect(achieved, 'the mouse drag selected a different range than intended').toEqual({
      fromRow, fromCol, toRow, toCol,
    });
  }

  /**
   * Drag the range fill handle down to a target cell that starts BELOW the
   * grid's inner viewport: grab the handle, hold the pointer past the grid's
   * bottom edge until the grid's auto-scroll brings the target row into view,
   * then finish the gesture precisely on the target cell. Bounded by time and
   * condition-driven — no fixed sleeps.
   */
  async dragAreaFillHandleToCell(row: number, col: number): Promise<void> {
    const gridBox = await this.grid.boundingBox();
    const holderBox = await this.grid.locator('.ht_master .wtHolder').boundingBox();

    if (!gridBox || !holderBox) {
      throw new Error('the grid or the holder is not rendered');
    }

    // On tall-row themes a freshly selected range can end past the fold, which
    // leaves its fill handle overflow-clipped below the holder. The corner's
    // box ignores clipping (toBeVisible() passes for a fully clipped element),
    // so grabbing it blind would silently press the page body and never arm
    // the grid's drag-to-scroll. Mirror what a user does: wheel-scroll the
    // holder until the corner actually sits inside its visible area.
    await this.page.mouse.move(holderBox.x + holderBox.width / 2, holderBox.y + holderBox.height / 2);
    await expect
      .poll(async() => {
        const corner = await this.areaCorner.boundingBox();

        if (!corner) {
          return false;
        }
        if (corner.y + corner.height > holderBox.y + holderBox.height + 1) {
          await this.page.mouse.wheel(0, 40);

          return false;
        }
        if (corner.y < holderBox.y - 1) {
          await this.page.mouse.wheel(0, -40);

          return false;
        }

        return true;
      }, {
        message: 'the area fill handle never scrolled into the holder view',
        timeout: 5000,
      })
      .toBe(true);

    const handle = await this.areaCorner.boundingBox();

    if (!handle) {
      throw new Error('the area fill handle is not rendered');
    }

    const startX = handle.x + handle.width / 2;
    const belowGridY = gridBox.y + gridBox.height + 20;

    await this.page.mouse.move(startX, handle.y + handle.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(startX, belowGridY, { steps: 8 });

    // Auto-scroll is TIMER-driven (DragToScroll's ScrollTimer advances one row
    // per self-rescheduled tick; at 20px past the edge the tick interval is
    // near its 500ms maximum), so the wait must be bounded by TIME, never by
    // an iteration count: a fixed number of pumped moves is a hidden wall-clock
    // budget that shrinks with every Playwright/CDP speedup and starves the
    // tallest theme (horizon needs the most ticks) of scroll time. Each probe
    // still jitters the pointer 1px so the plugin keeps seeing mousemove
    // events, and checks the holder's VISIBLE area (Playwright's isVisible()
    // counts overflow-clipped cells as visible, so intersect bounding boxes
    // instead). An exhausted wait must fail HERE with its real cause — not
    // later, as a confusing data mismatch after the gesture lands on a
    // clipped coordinate.
    let jitter = 0;

    await expect
      .poll(async() => {
        jitter = 1 - jitter;
        await this.page.mouse.move(startX, belowGridY + jitter);

        return this.cellInHolderView(row, col);
      }, {
        message: `auto-scroll never brought cell ${row},${col} into the holder view`,
        timeout: 15000,
      })
      .toBe(true);

    const target = await this.cell(row, col).boundingBox();

    if (!target) {
      throw new Error('the fill target cell never scrolled into view');
    }

    await this.page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 4 });
    await this.page.mouse.up();
  }

  /**
   * Whether a cell's box lies fully inside the master holder's visible area
   * (not merely rendered-but-clipped past either overflow edge).
   */
  async cellInHolderView(row: number, col: number): Promise<boolean> {
    // boundingBox() first waits for 'attached' — a cell the renderer never
    // produced (virtualized away) would stall the pump loop until the test
    // timeout with a wrong-cause failure. Bail out fast instead.
    if (await this.cell(row, col).count() === 0) {
      return false;
    }

    const cellBox = await this.cell(row, col).boundingBox();
    const holderBox = await this.grid.locator('.ht_master .wtHolder').boundingBox();

    return Boolean(cellBox && holderBox &&
      cellBox.y >= holderBox.y - 1 &&
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
