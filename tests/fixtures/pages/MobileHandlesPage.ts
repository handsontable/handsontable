import { type Page, type Locator, type CDPSession, expect } from '@playwright/test';

/**
 * Page Object for the mobile selection handles fixture (DEV-2165).
 *
 * The spec using this page object must run with touch + mobile user agent
 * emulation (`test.use({ hasTouch: true, ... })`) — Handsontable decides
 * whether to create the selection handles from `isMobileOrIpadOS()` at grid
 * construction time. iPadOS 13+ needs a Macintosh Safari UA plus an init
 * script that sets `navigator.platform` to `MacIntel` and `maxTouchPoints`
 * to 5 before the grid script loads (see `e2e/ipad-selection-handles.spec.ts`).
 */
export class MobileHandlesPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  #cdp: CDPSession | null = null;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture and wait for the grid to render. Frozen panes are off by default, and
   * headers are on, which is the configuration most grids run with.
   */
  async goto({ direction = 'ltr', frozen = false, frozenBottom = false, headers = true, rows = 'short' }: {
    direction?: 'ltr' | 'rtl';
    frozen?: boolean;
    frozenBottom?: boolean;
    headers?: boolean;
    rows?: 'short' | 'tall';
  } = {}): Promise<void> {
    const query = new URLSearchParams({
      theme: this.theme,
      bundle: this.bundle,
      direction,
      frozen: frozen ? '1' : '0',
      frozenBottom: frozenBottom ? '2' : '0',
      headers: headers ? 'on' : 'off',
      rows,
    });

    await this.page.goto(`/tests/fixtures/demo/mobile-handles.html?${query}`);
    await expect(this.cell(1, 1)).toBeVisible();
  }

  /**
   * A single data cell, by visual row/column, via its stable test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Tap a cell to select it with a touch gesture.
   */
  async tapCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).tap();
  }

  /**
   * Extends the current selection while preserving its top-left corner.
   */
  async selectRange(fromRow: number, fromCol: number, toRow: number, toCol: number): Promise<void> {
    await this.page.evaluate(
      range => window.hot.selectCell(range.fromRow, range.fromCol, range.toRow, range.toCol),
      { fromRow, fromCol, toRow, toCol }
    );
  }

  /**
   * The top-left mobile selection handle of the focus selection, scoped to
   * the master overlay.
   */
  topHandle(): Locator {
    return this.page.locator('.ht_master .htBorders .topSelectionHandle:visible').first();
  }

  /**
   * The bottom-right mobile selection handle of the focus selection, scoped
   * to the master overlay.
   */
  bottomHandle(): Locator {
    return this.page.locator('.ht_master .htBorders .bottomSelectionHandle:visible').first();
  }

  /**
   * The fill-handle square on the selection's bottom-end corner. On mobile and
   * iPadOS this element exists but stays hidden; on desktop it is the visible
   * autocomplete handle.
   */
  fillHandle(): Locator {
    return this.page.locator('.ht_master .htBorders .wtBorder.corner').first();
  }

  /**
   * The hit area of the bottom-right mobile selection handle — the element a
   * finger grabs. It is larger than the painted handle.
   */
  bottomHitArea(): Locator {
    return this.page.locator('.ht_master .htBorders .bottomSelectionHandle-HitArea:visible').first();
  }

  /**
   * Assert both mobile selection handles are attached and visible with a
   * non-zero rendered size.
   */
  async expectHandlesVisible(): Promise<void> {
    await expect(this.topHandle()).toBeVisible();
    await expect(this.bottomHandle()).toBeVisible();

    for (const handle of [this.topHandle(), this.bottomHandle()]) {
      const box = await handle.boundingBox();

      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(0);
      expect(box!.height).toBeGreaterThan(0);
    }
  }

  /**
   * Returns whether the top handle owns the pixels at the center of its visible marker.
   */
  async isTopHandleHitAreaAtHandleCenter(): Promise<boolean> {
    return this.topHandle().evaluate((handle) => {
      const { left, top, width, height } = handle.getBoundingClientRect();
      const element = document.elementFromPoint(left + (width / 2), top + (height / 2));

      return element?.closest('.topSelectionHandle-HitArea') !== null;
    });
  }

  /**
   * Returns whether the bottom handle owns the pixels at the center of its visible marker.
   */
  async isBottomHandleHitAreaAtHandleCenter(): Promise<boolean> {
    return this.bottomHandle().evaluate((handle) => {
      const { left, top, width, height } = handle.getBoundingClientRect();
      const element = document.elementFromPoint(left + (width / 2), top + (height / 2));

      return element?.closest('.bottomSelectionHandle-HitArea') !== null;
    });
  }

  /**
   * Returns whether the top handle hangs off the cell's outer corner (LTR), which is where it
   * belongs whenever no overlay clone renders over that corner. The corner placement leaves the
   * handle touching the cell edge, while the clone placement moves it a full handle inside, so
   * half a handle separates the two.
   */
  async isTopHandleOnCellOuterCorner(row: number, col: number): Promise<boolean> {
    const handleBox = await this.topHandle().boundingBox();
    const cellBox = await this.cell(row, col).boundingBox();

    if (!handleBox || !cellBox) {
      return false;
    }

    return handleBox.y + handleBox.height <= cellBox.y + (handleBox.height / 2)
      && handleBox.x + handleBox.width <= cellBox.x + (handleBox.width / 2);
  }

  /**
   * Asserts the fill-handle square is not shown. On iPadOS the desktop
   * autocomplete corner used to appear instead of the mobile range handles.
   */
  async expectFillHandleHidden(): Promise<void> {
    await expect(this.fillHandle()).toBeHidden();
  }

  /**
   * Whether MultipleSelectionHandles turned on at construction time.
   */
  async isHandlesPluginEnabled(): Promise<boolean> {
    return this.page.evaluate(() => window.hot.getPlugin('multipleSelectionHandles').enabled);
  }

  /**
   * Whether the active cell editor is currently open (the engine's own state, not DOM visibility —
   * the `.handsontableInput` textarea is always rendered, off-screen when closed).
   */
  async isEditorOpen(): Promise<boolean> {
    return this.page.evaluate(() => window.hot.getActiveEditor()?.isOpened() ?? false);
  }

  async expectEditorOpen(): Promise<void> {
    await expect.poll(() => this.isEditorOpen()).toBe(true);
  }

  async expectEditorClosed(): Promise<void> {
    await expect.poll(() => this.isEditorOpen()).toBe(false);
  }

  /**
   * The `moveCells` edge-band overlays. iPad keeps these when the option is on
   * (`!isMobileBrowser()`); phones do not (`isMobileOrIpadOS()` must not gate them).
   */
  moveZones(): Locator {
    return this.page.locator('.ht_master .htBorders .wtMoveZone');
  }

  /**
   * Turns `moveCells` on after construction so the iPad handle fixture can also
   * assert the drag band still appears (DEV-1081 gate split).
   */
  async enableMoveCells(): Promise<void> {
    await this.page.evaluate(() => {
      window.hot.updateSettings({ moveCells: true });
    });
  }

  /**
   * Turns the fill handle off so a frozen-row overlay-size assertion can pin the
   * `isMobileOrIpadOS()` corner-reserve branch without `cornerVisible` also being true.
   */
  async disableFillHandle(): Promise<void> {
    await this.page.evaluate(() => {
      window.hot.updateSettings({ fillHandle: false });
    });
  }

  /**
   * How many extra pixels the top overlay's holder is taller than its parent. On iPad this is
   * half the autofill-corner size whenever the selection's bottom-end sits inside `fixedRowsTop`.
   */
  async topOverlayHolderOverhang(): Promise<number> {
    return this.page.evaluate(() => {
      const holder = document.querySelector('.ht_clone_top .wtHolder');
      const parent = holder?.parentElement;

      if (!(holder instanceof HTMLElement) || !(parent instanceof HTMLElement)) {
        return Number.NaN;
      }

      return parseFloat(holder.style.height) - parseFloat(parent.style.height);
    });
  }

  /**
   * Half of `--ht-cell-autofill-size`, which is the strip `TopOverlay` adds when it reserves
   * the selection-corner offset.
   */
  async autofillCornerHalfHeight(): Promise<number> {
    return this.page.evaluate(() => {
      const themeRoot = document.querySelector('[data-testid="grid"]');
      const size = getComputedStyle(themeRoot as Element).getPropertyValue('--ht-cell-autofill-size');

      return parseInt(size, 10) / 2;
    });
  }

  /**
   * The grid's root wrapper carrying the `ht__moving` drag-state class.
   */
  movingRoot(): Locator {
    return this.page.locator('.handsontable.ht__moving');
  }

  /**
   * Presses the midpoint of the top `moveCells` band with the mouse. That point sits on the
   * selection edge, away from the round range handles that hang off the corners.
   */
  async pressTopMoveBandMidpoint(): Promise<void> {
    const box = await this.moveZones().first().boundingBox();

    expect(box, 'the top move band must be laid out').not.toBeNull();

    await this.page.mouse.move(box!.x + (box!.width / 2), box!.y + (box!.height / 2));
    await this.page.mouse.down();
  }

  /**
   * Drags the painted bottom range handle with the mouse. The plugin listens for `touchstart`
   * only, so a trackpad drag from this point must not extend the selection.
   */
  async mouseDragBottomHandleBy(deltaX: number, deltaY: number): Promise<void> {
    const box = await this.bottomHandle().boundingBox();

    expect(box, 'the bottom range handle must be laid out').not.toBeNull();

    const startX = box!.x + (box!.width / 2);
    const startY = box!.y + (box!.height / 2);

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + deltaX, startY + deltaY);
    await this.page.mouse.up();
  }

  /**
   * The current selection as `[fromRow, fromCol, toRow, toCol]`.
   */
  async selectedLast(): Promise<number[]> {
    return this.page.evaluate(() => window.hot.getSelectedLast());
  }

  /**
   * Drags the bottom range handle onto another cell with a trusted touch
   * gesture. Playwright's `touchscreen` only taps, so this goes through CDP.
   */
  async dragBottomHandleToCell(row: number, col: number): Promise<void> {
    if (!this.#cdp) {
      this.#cdp = await this.page.context().newCDPSession(this.page);
    }

    const startBox = await this.bottomHitArea().boundingBox();
    const targetBox = await this.cell(row, col).boundingBox();

    expect(startBox, 'the bottom handle hit area must be laid out').not.toBeNull();
    expect(targetBox, 'the target cell must be laid out').not.toBeNull();

    const start = {
      x: startBox!.x + (startBox!.width / 2),
      y: startBox!.y + (startBox!.height / 2),
    };
    const target = {
      x: targetBox!.x + (targetBox!.width / 2),
      y: targetBox!.y + (targetBox!.height / 2),
    };

    await this.#dispatchTouch('touchStart', start);

    for (let step = 1; step <= 12; step++) {
      await this.#dispatchTouch('touchMove', {
        x: start.x + ((target.x - start.x) * step) / 12,
        y: start.y + ((target.y - start.y) * step) / 12,
      });
    }

    await this.#dispatchTouch('touchEnd');
  }

  /**
   * Dispatches one touch event carrying a single touch point.
   */
  async #dispatchTouch(
    type: 'touchStart' | 'touchMove' | 'touchEnd',
    point?: { x: number, y: number },
  ): Promise<void> {
    await this.#cdp!.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: point ? [{ x: point.x, y: point.y, radiusX: 12, radiusY: 12, force: 1, id: 1 }] : [],
    });
  }
}
