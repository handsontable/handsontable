import { type Page, type Locator, expect } from '@playwright/test';

/**
 * One layout-shift entry as the fixture records it: the browser's score, whether recent input
 * excludes it from the page's CLS, and the elements the browser blamed for the move.
 */
export interface LayoutShiftRecord {
  value: number;
  hadRecentInput: boolean;
  startTime: number;
  sources: { tag: string, id: string, className: string }[];
}

/**
 * Page Object for the spreader layout-shift fixture. Drives the master viewport with REAL wheel
 * input (a scripted `scrollTop` assignment produces no scroll-driven draw the way the browser's
 * own scroll does) and reads back the `layout-shift` entries the fixture's `PerformanceObserver`
 * collected, so a spec can say which element the browser blamed and how much.
 */
export class SpreaderLayoutShiftPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly master: Locator;
  readonly topClone: Locator;
  readonly inlineStartClone: Locator;

  /** Whether the current page was opened right-to-left (`goto({ rtl: true })`). */
  rtl = false;

  /**
   * What the page reported while loading. A grid that never appears says nothing about why, so
   * `goto()` puts these into its failure instead of a bare "element not found".
   */
  readonly #pageProblems: string[] = [];

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.master = this.grid.locator('.ht_master');
    this.topClone = this.grid.locator('.ht_clone_top');
    this.inlineStartClone = this.grid.locator('.ht_clone_inline_start');

    page.on('pageerror', error => this.#pageProblems.push(`pageerror: ${error.message}`));
    page.on('requestfailed', request =>
      this.#pageProblems.push(`requestfailed: ${request.url()} (${request.failure()?.errorText ?? 'unknown'})`));
    page.on('console', message => {
      if (message.type() === 'error') {
        this.#pageProblems.push(`console.error: ${message.text()}`);
      }
    });
  }

  /**
   * Navigate and wait for the grid to render. `frozen` adds two frozen rows and columns, so the
   * overlay clones carry spreaders of their own; `rtl` renders the grid and the page right-to-left.
   */
  async goto({ frozen = false, rtl = false } = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    if (frozen) {
      params.set('frozen', '1');
    }

    if (rtl) {
      params.set('rtl', '1');
    }

    this.rtl = rtl;
    this.#pageProblems.length = 0;
    await this.page.goto(`/tests/fixtures/demo/walkontable/spreader-layout-shift.html?${params}`);

    try {
      await expect(this.master).toBeVisible();
      // "Rendered" means the master carries body cells. Not cell (0, 0): with frozen panes the
      // master's band starts past the frozen rows and columns, and that cell lives in a clone only.
      await expect(this.master.locator('tbody td').first()).toBeVisible();
    } catch (error) {
      const report = this.#pageProblems.length > 0 ? this.#pageProblems.join(' | ') : 'the page reported no errors';

      throw new Error(`the grid did not render (${report})\n${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /** Whether this browser reports `layout-shift` entries at all (Chromium does; others do not). */
  async layoutShiftsSupported(): Promise<boolean> {
    return this.page.evaluate(() => typeof PerformanceObserver !== 'undefined' &&
      PerformanceObserver.supportedEntryTypes.includes('layout-shift'));
  }

  /** The scrollable master holder. */
  holder(): Locator {
    return this.master.locator('.wtHolder');
  }

  /**
   * A data cell as the MASTER renders it. Every overlay clone renders its own copy with the same
   * test id, so the lookup is scoped to the master.
   */
  cell(row: number, col: number): Locator {
    return this.master.getByTestId(`cell-${row}-${col}`);
  }

  /** A data cell in a frozen column, as the inline-start clone renders it. */
  frozenColumnCell(row: number, col: number): Locator {
    return this.inlineStartClone.getByTestId(`cell-${row}-${col}`);
  }

  /** A data cell in a frozen row, as the top clone renders it. */
  frozenRowCell(row: number, col: number): Locator {
    return this.topClone.getByTestId(`cell-${row}-${col}`);
  }

  /** The column header cell of a column, as the top clone renders it. */
  async columnHeader(col: number): Promise<Locator> {
    const name = await this.page.evaluate(
      (c) => (window as unknown as { hot: { getColHeader(col: number): string } }).hot.getColHeader(c), col);

    return this.topClone.locator('thead th').filter({ has: this.page.getByText(name, { exact: true }) });
  }

  /** The row header cell of a row, as the inline-start clone renders it. */
  rowHeader(row: number): Locator {
    return this.inlineStartClone.locator('tbody th').filter({ has: this.page.getByText(String(row + 1), { exact: true }) });
  }

  /** The lowest row index the master actually renders. */
  async masterFirstRenderedRow(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { view: { _wt: { wtTable: { getFirstRenderedRow(): number } } } }
    }).hot.view._wt.wtTable.getFirstRenderedRow());
  }

  /** The lowest column index the master actually renders. */
  async masterFirstRenderedColumn(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { view: { _wt: { wtTable: { getFirstRenderedColumn(): number } } } }
    }).hot.view._wt.wtTable.getFirstRenderedColumn());
  }

  /** Forget every shift recorded so far, so the next read covers one gesture only. */
  async resetLayoutShifts(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { __layoutShifts: unknown[] }).__layoutShifts.length = 0;
    });
  }

  /**
   * The shifts recorded since the last reset that count towards the page's CLS. Entries within
   * 500ms of a press or keystroke are excluded by the browser (`hadRecentInput`), so the page object
   * never clicks the grid before a scroll.
   *
   * The observer delivers in batches and late, so this waits until the buffer has stopped growing
   * for a while before reading it - a read taken too early sees an empty buffer, which looks
   * exactly like a clean result.
   */
  async layoutShifts(): Promise<LayoutShiftRecord[]> {
    await this.page.evaluate(() => new Promise<void>((resolve) => {
      const buffer = (window as unknown as { __layoutShifts: unknown[] }).__layoutShifts;
      const quietFramesNeeded = 20;
      let lastLength = buffer.length;
      let quietFrames = 0;
      const tick = () => {
        if (buffer.length === lastLength) {
          quietFrames += 1;
        } else {
          quietFrames = 0;
          lastLength = buffer.length;
        }

        if (quietFrames >= quietFramesNeeded) {
          resolve();
        } else {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
    }));

    const entries = await this.page.evaluate(() => (window as unknown as {
      __layoutShifts: LayoutShiftRecord[]
    }).__layoutShifts);

    return entries.filter(entry => !entry.hadRecentInput);
  }

  /** The summed score of the shifts that blame an element carrying the class or the id. */
  async shiftValueBlamedOn(name: string): Promise<number> {
    const shifts = await this.layoutShifts();

    return shifts
      .filter(shift => shift.sources.some(source => source.id === name ||
        source.className.split(/\s+/).includes(name)))
      .reduce((sum, shift) => sum + shift.value, 0);
  }

  /** The summed score of every recorded shift. */
  async totalShiftValue(): Promise<number> {
    const shifts = await this.layoutShifts();

    return shifts.reduce((sum, shift) => sum + shift.value, 0);
  }

  /**
   * Put the pointer over the master viewport WITHOUT pressing: a press would mark every shift of
   * the next 500ms as input-driven and hide exactly what the spec measures.
   */
  async hoverMaster(): Promise<void> {
    const box = await this.holder().boundingBox();

    if (!box) {
      throw new Error('the master holder has no box to hover');
    }

    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  }

  /**
   * Scroll the master viewport with real wheel events, then wait until the engine has rendered a
   * band starting past the one it started on - a render-state probe, since the redraw is
   * rAF-batched and lands after the scroll position settles.
   *
   * `deltaX` is given as "away from the inline start": in RTL the wheel sign is flipped so the
   * same call scrolls the same columns into view.
   */
  async wheelScroll({ deltaX = 0, deltaY = 0, steps = 12 }): Promise<void> {
    const rowBefore = await this.masterFirstRenderedRow();
    const columnBefore = await this.masterFirstRenderedColumn();
    const physicalDeltaX = this.rtl ? -deltaX : deltaX;

    await this.hoverMaster();

    for (let i = 0; i < steps; i += 1) {
      await this.page.mouse.wheel(physicalDeltaX, deltaY);
    }

    if (deltaY > 0) {
      await expect.poll(() => this.masterFirstRenderedRow()).toBeGreaterThan(rowBefore);
    }

    if (deltaX > 0) {
      await expect.poll(() => this.masterFirstRenderedColumn()).toBeGreaterThan(columnBefore);
    }
  }

  /**
   * Move the control box by writing its `top` - a layout move the browser must report. This is the
   * positive control: a zero from the grid means nothing unless the observer is shown to see a
   * real shift on the same page.
   */
  async moveControlBox(): Promise<void> {
    await this.page.getByTestId('cls-control').evaluate((el) => {
      el.style.top = '200px';
    });
  }

  /** Select a cell by clicking it, and wait for the focus to land. */
  async selectCell(cell: Locator): Promise<void> {
    await cell.click();
    await expect(cell).toHaveClass(/\bcurrent\b/);
  }

  /**
   * Open the editor on a cell with a double-click, and wait until the editor reports itself open
   * ON THAT CELL - the holder element is reused and merely moved, so its visibility says nothing
   * about which cell it is placed over.
   */
  async openEditor(cell: Locator): Promise<Locator> {
    await cell.dblclick();

    await expect.poll(() => cell.evaluate((td) => {
      const editor = (window as unknown as {
        hot: { getActiveEditor(): { isOpened(): boolean, TD: HTMLElement } | undefined }
      }).hot.getActiveEditor();

      return Boolean(editor && editor.isOpened() && editor.TD === td);
    })).toBe(true);

    return this.grid.locator('.handsontableInputHolder').first();
  }

  /** Close an open editor without saving, and wait until it reports itself closed. */
  async closeEditor(): Promise<void> {
    await this.page.keyboard.press('Escape');

    await expect.poll(() => this.page.evaluate(() => {
      const editor = (window as unknown as {
        hot: { getActiveEditor(): { isOpened(): boolean } | undefined }
      }).hot.getActiveEditor();

      return Boolean(editor && editor.isOpened());
    })).toBe(false);
  }

  /** The master's fill handle - the small square at the selection's inline-end bottom corner. */
  fillHandle(): Locator {
    return this.master.locator('.wtBorder.corner').first();
  }

  /** The fill handle the inline-start clone draws for a selection in a frozen column. */
  frozenColumnFillHandle(): Locator {
    return this.inlineStartClone.locator('.wtBorder.corner').first();
  }

  /**
   * Hover a column header and wait for the column-resize handle to appear. The plugin places the
   * handle at the header's inline-end edge, relative to the root element.
   */
  async hoverColumnHeader(col: number): Promise<Locator> {
    const header = await this.columnHeader(col);

    await header.hover();

    const handle = this.grid.locator('.manualColumnResizer');

    await expect(handle).toBeVisible();

    return handle;
  }

  /**
   * Hover a row header and wait for the row-resize handle to appear. The plugin places the handle
   * at the header's bottom edge, relative to the root element.
   */
  async hoverRowHeader(row: number): Promise<Locator> {
    await this.rowHeader(row).hover();

    const handle = this.grid.locator('.manualRowResizer');

    await expect(handle).toBeVisible();

    return handle;
  }
}
