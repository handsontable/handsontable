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
   * overlay clones carry spreaders of their own.
   */
  async goto({ frozen = false } = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    if (frozen) {
      params.set('frozen', '1');
    }

    this.#pageProblems.length = 0;
    await this.page.goto(`/tests/fixtures/demo/walkontable/spreader-layout-shift.html?${params}`);

    try {
      await expect(this.master).toBeVisible();
      await expect(this.cell(0, 0)).toBeVisible();
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

  /** A data cell, by its test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
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
   */
  async wheelScroll({ deltaX = 0, deltaY = 0, steps = 12 }): Promise<void> {
    const rowBefore = await this.masterFirstRenderedRow();
    const columnBefore = await this.masterFirstRenderedColumn();

    await this.hoverMaster();

    for (let i = 0; i < steps; i += 1) {
      await this.page.mouse.wheel(deltaX, deltaY);
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
  async selectCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).click();
    await expect(this.cell(row, col)).toHaveClass(/\bcurrent\b/);
  }

  /** Open the editor on a cell with a double-click, and wait for it to appear. */
  async openEditor(row: number, col: number): Promise<Locator> {
    await this.cell(row, col).dblclick();

    const editor = this.grid.locator('.handsontableInputHolder').first();

    await expect(editor).toBeVisible();

    return editor;
  }

  /** The master's fill handle - the small square at the selection's bottom-right corner. */
  fillHandle(): Locator {
    return this.master.locator('.wtBorder.corner').first();
  }
}
