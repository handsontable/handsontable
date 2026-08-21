import { type Page, type Locator, type CDPSession, expect } from '@playwright/test';

/**
 * One point of a touch gesture, in viewport coordinates.
 */
interface TouchPoint {
  x: number;
  y: number;
}

/**
 * Page Object for the mobile drag-to-scroll fixture (issue #11658).
 *
 * The spec using this page object must run with touch + mobile user agent emulation
 * (`test.use({ ...devices['iPhone 13'], browserName: 'chromium' })`): Handsontable creates the
 * mobile selection handles only when it detects a mobile browser at grid construction time, and the
 * gestures below go through the Chrome DevTools Protocol.
 *
 * Playwright's own `page.touchscreen` can only tap - it has no drag - so a touch drag has to be
 * driven with `Input.dispatchTouchEvent`. Nothing else in this suite produces trusted `touchmove`
 * events, and this bug reproduces only with them.
 *
 * No gesture here waits on a clock. The auto-scroller's timer reschedules itself, so one `touchmove`
 * past the edge is enough to start it and it keeps going while the finger stays down - the spec then
 * polls the scroll offset for progress instead of holding for a fixed time.
 */
export class DragToScrollPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;

  #cdp: CDPSession | null = null;

  /**
   * Whether a finger is currently down. Tracked so lifting twice is harmless, which lets a test end
   * its own drag and still be cleaned up afterwards.
   */
  #isTouchDown = false;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/mobile-drag-to-scroll.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await expect(this.cell(0, 0)).toBeVisible();

    this.#cdp = await this.page.context().newCDPSession(this.page);
  }

  /**
   * A single data cell, by visual row/column, via its stable test id.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Tap a cell to select it with a touch gesture. Selecting is what renders the handles.
   */
  async tapCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).tap();
    await expect(this.bottomHandle()).toBeVisible();
  }

  /**
   * The hit area of the bottom-right mobile selection handle - the element a finger grabs. It is
   * larger than the handle that is actually painted.
   */
  bottomHandle(): Locator {
    return this.page.locator('.ht_master .htBorders .bottomSelectionHandle-HitArea').first();
  }

  /**
   * The grid's scrollable holder - the element whose scroll offsets the auto-scroller moves.
   */
  holder(): Locator {
    return this.grid.locator('.ht_master .wtHolder');
  }

  /**
   * The holder's current scroll offsets.
   */
  async scrollOffsets(): Promise<{ top: number, left: number }> {
    return this.holder().evaluate(el => ({ top: el.scrollTop, left: el.scrollLeft }));
  }

  /**
   * The bottom-right corner of the active selection, as `[row, col]`.
   */
  async selectionEnd(): Promise<[number, number]> {
    return this.page.evaluate(() => {
      const corner = window.hot.getSelectedRangeLast().getBottomEndCorner();

      return [corner.row ?? -1, corner.col ?? -1] as [number, number];
    });
  }

  /**
   * Drags the bottom selection handle past one edge of the grid and leaves the finger there.
   *
   * @param {string} edge Which edge to drag past.
   */
  async dragHandlePastEdge(edge: 'bottom' | 'right'): Promise<void> {
    const start = await this.#centreOf(this.bottomHandle());
    const box = (await this.holder().boundingBox())!;

    await this.#dragFrom(start, edge === 'bottom'
      ? { x: start.x, y: box.y + box.height + 20 }
      : { x: box.x + box.width + 20, y: start.y });
  }

  /**
   * Drags the bottom selection handle to a cell that is already on screen, leaving the finger there.
   */
  async dragHandleToCell(row: number, col: number): Promise<void> {
    const start = await this.#centreOf(this.bottomHandle());

    await this.#dragFrom(start, await this.#centreOf(this.cell(row, col)));
  }

  /**
   * Lifts the finger, ending the drag. A no-op when no finger is down.
   */
  async endDrag(): Promise<void> {
    if (!this.#isTouchDown) {
      return;
    }

    this.#isTouchDown = false;

    await this.#dispatchTouch('touchEnd');
  }

  /**
   * The centre of a locator's bounding box, in viewport coordinates.
   */
  async #centreOf(locator: Locator): Promise<TouchPoint> {
    const box = await locator.boundingBox();

    expect(box, 'the element must be laid out before it can be touched').not.toBeNull();

    return { x: box!.x + (box!.width / 2), y: box!.y + (box!.height / 2) };
  }

  /**
   * Presses at `start` and moves to `target` in steps, leaving the finger down.
   */
  async #dragFrom(start: TouchPoint, target: TouchPoint): Promise<void> {
    await this.#dispatchTouch('touchStart', start);
    this.#isTouchDown = true;

    for (let step = 1; step <= 12; step++) {
      await this.#dispatchTouch('touchMove', {
        x: start.x + ((target.x - start.x) * step) / 12,
        y: start.y + ((target.y - start.y) * step) / 12,
      });
    }
  }

  /**
   * Dispatches one touch event carrying a single touch point.
   */
  async #dispatchTouch(type: 'touchStart' | 'touchMove' | 'touchEnd', point?: TouchPoint): Promise<void> {
    await this.#cdp!.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: point ? [{ x: point.x, y: point.y, radiusX: 12, radiusY: 12, force: 1, id: 1 }] : [],
    });
  }
}
