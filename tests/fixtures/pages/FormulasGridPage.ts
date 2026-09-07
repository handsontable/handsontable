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
  readonly holder: Locator;
  readonly areaCorner: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.holder = this.grid.locator('.ht_master .wtHolder');
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
   * Both endpoints are first wheel-scrolled into the holder's pressable area,
   * the way a user brings an off-screen cell into reach. Aiming at a clipped
   * cell's box center instead would press the header clones or the page body,
   * or — mid-drag — mean "extend the selection past the edge", where
   * drag-to-scroll fires and the selection overshoots the intended range by a
   * row (this is exactly how the horizon legs selected 1,2→3,4 instead of
   * 1,2→2,4). The achieved range is asserted afterwards so any drift fails
   * loudly here, not as a confusing corner/fill mismatch later.
   */
  async selectRange(fromRow: number, fromCol: number, toRow: number, toCol: number): Promise<void> {
    // `to` first, `from` second: the drag starts on `from`, so it must be in
    // view at mousedown. A range taller than the viewport surfaces here as
    // the `from` wheel pushing `to` back out — the assertion below reports it.
    await this.#wheelIntoView(this.cell(toRow, toCol), `cell ${toRow},${toCol}`);
    await this.#wheelIntoView(this.cell(fromRow, fromCol), `cell ${fromRow},${fromCol}`);

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
    // On tall-row themes a freshly selected range can end past the fold, which
    // leaves its fill handle overflow-clipped below the holder. The corner's
    // box ignores clipping (toBeVisible() passes for a fully clipped element),
    // so grabbing it blind would silently press the page body and never arm
    // the grid's drag-to-scroll. Mirror what a user does: wheel it into reach.
    await this.#wheelIntoView(this.areaCorner, 'area fill handle');

    // Read the boxes AFTER the wheel loop: when the holder is already at a
    // scroll limit the browser hands the wheel to the page, so the grid itself
    // can move — boxes captured before the loop would aim the drag at stale
    // coordinates (inside the grid, or far below the 20px the comment assumes).
    const gridBox = await this.grid.boundingBox();
    const handle = await this.areaCorner.boundingBox();

    if (!gridBox || !handle) {
      throw new Error('the grid or the area fill handle is not rendered');
    }

    const startX = handle.x + handle.width / 2;
    const belowGridY = gridBox.y + gridBox.height + 20;

    await this.page.mouse.move(startX, handle.y + handle.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(startX, belowGridY, { steps: 8 });

    // Auto-scroll is TIMER-driven: DragToScroll's ScrollTimer advances one row
    // per self-rescheduled tick, and its log ramp (min 20ms, max 500ms,
    // rampDistance 120, logScale 200) gives ~180ms per tick for a pointer
    // 20px past the edge — so the wait must be bounded by TIME, never by an
    // iteration count: a fixed number of pumped moves is a hidden wall-clock
    // budget that shrinks with every Playwright/CDP speedup and starves the
    // tallest theme (horizon needs the most ticks) of scroll time. The 8s
    // budget is ~40 ticks of headroom and keeps goto + selectRange + all
    // polls inside the 20s test timeout, so an exhausted wait still fails
    // HERE with its real cause instead of a locationless "Test timeout".
    // Each probe jitters the pointer 1px so the plugin keeps seeing mousemove
    // events, and checks the holder's pressable area (Playwright's
    // isVisible() counts overflow-clipped cells as visible, so intersect
    // bounding boxes instead).
    let jitter = 0;

    await expect
      .poll(async() => {
        jitter = 1 - jitter;
        await this.page.mouse.move(startX, belowGridY + jitter);

        return this.cellInHolderView(row, col);
      }, {
        message: `auto-scroll never brought cell ${row},${col} into the holder view`,
        timeout: 8000,
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
   * Whether a cell's box lies fully inside the holder's pressable area — not
   * merely rendered-but-clipped past an overflow edge, and not under the
   * sticky column-header clone that paints over the holder's top strip.
   */
  async cellInHolderView(row: number, col: number): Promise<boolean> {
    // count() before boundingBox(): boundingBox() waits for 'attached' first,
    // so a cell the renderer never produced (virtualized away) would stall
    // the poll until the test timeout with a wrong-cause failure.
    if (await this.cell(row, col).count() === 0) {
      return false;
    }

    const cellBox = await this.cell(row, col).boundingBox();
    const inner = await this.#pressableBounds();

    return Boolean(cellBox &&
      cellBox.y >= inner.top - 1 &&
      cellBox.y + cellBox.height <= inner.bottom + 1);
  }

  /** The grid's data, read through the instance the fixture exposes. */
  async data(): Promise<(string | number | null)[][]> {
    return this.page.evaluate(() => (window as any).hot.getData());
  }

  /** The grid's raw source data (formulas unevaluated). */
  async sourceData(): Promise<(string | number | null)[][]> {
    return this.page.evaluate(() => (window as any).hot.getSourceData());
  }

  /**
   * The vertical bounds of the holder area where content is actually
   * pressable: the holder box minus the sticky column-header band — the
   * `ht_clone_top` overlay paints over the holder's top strip, so a cell
   * scrolled under it still reports a bounding box there, but a click at
   * those coordinates presses the header clone instead.
   */
  async #pressableBounds(): Promise<{ top: number; bottom: number }> {
    const holderBox = await this.holder.boundingBox();

    if (!holderBox) {
      throw new Error('the holder is not rendered');
    }

    const headerClone = this.grid.locator('.ht_clone_top');
    const headerBox = await headerClone.count() > 0 ? await headerClone.boundingBox() : null;

    return {
      top: holderBox.y + (headerBox ? headerBox.height : 0),
      bottom: holderBox.y + holderBox.height,
    };
  }

  /**
   * Wheel-scrolls the holder — the way a user reaches off-screen content —
   * until `target` lies fully inside the pressable holder area. The wheel
   * step is the EXACT remaining distance (plus a 2px margin): a fixed step
   * would turn the poll budget into a hidden reach cap, and a fixed MINIMUM
   * over-corrects a few-px overflow, which ping-pongs when two nearby targets
   * need opposite nudges (the selectRange `to`/`from` pair). `count()` is
   * checked before `boundingBox()`: the target may be torn down and rebuilt
   * on the re-render each wheel triggers, and `boundingBox()` waits for
   * `attached`, so a probe landing mid-render would stall past the poll
   * budget and surface as a generic timeout instead of the message below.
   */
  async #wheelIntoView(target: Locator, what: string): Promise<void> {
    const holderBox = await this.holder.boundingBox();

    if (!holderBox) {
      throw new Error('the holder is not rendered');
    }

    await this.page.mouse.move(holderBox.x + holderBox.width / 2, holderBox.y + holderBox.height / 2);

    await expect
      .poll(async() => {
        if (await target.count() === 0) {
          return false;
        }

        const box = await target.boundingBox();

        if (!box) {
          return false;
        }

        const inner = await this.#pressableBounds();

        if (box.y + box.height > inner.bottom + 1) {
          await this.page.mouse.wheel(0, (box.y + box.height) - inner.bottom + 2);

          return false;
        }
        if (box.y < inner.top - 1) {
          await this.page.mouse.wheel(0, -(inner.top - box.y + 2));

          return false;
        }

        return true;
      }, {
        message: `the ${what} never scrolled into the holder view`,
        timeout: 2000,
      })
      .toBe(true);
  }
}
