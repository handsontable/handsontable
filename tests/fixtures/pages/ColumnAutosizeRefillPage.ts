import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * The fixture's cumulative paint counters (see `paintCounters()`).
 */
export interface PaintCounters {
  draws: number;
  cell00Paints: number;
}

/**
 * Page Object for the column-autosize-viewport-refill fixture (#6452 / DEV-406): a 320px-tall
 * grid whose column C starts 40px wide with wrapped, tall rows 1-7. Encapsulates the resize-handle
 * double-click, the "shorten texts" data change, and the "does the rendered band fill the
 * viewport" measurement.
 */
export class ColumnAutosizeRefillPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;

  readonly fixture: string;

  /**
   * @param {Page} page The Playwright page.
   * @param {string} [theme='main'] The theme project.
   * @param {string} [bundle='umd'] The bundle project.
   * @param {string} [fixture='column-autosize-viewport-refill'] The fixture file under
   *   `tests/fixtures/demo/`, without the extension. `merge-cells-refill` shares this grid's shape
   *   plus a merged block, so it reuses this page object.
   */
  constructor(page: Page, theme = 'main', bundle = 'umd', fixture = 'column-autosize-viewport-refill') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.fixture = fixture;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate, wait for the bundle to evaluate, then wait for the grid to render (a real DOM
   * condition, no sleep). The bundle wait comes first: `expect` is a 10s budget and the
   * `document.write`-injected `dist/handsontable.js` can outlast it on a cold worker.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/${this.fixture}.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the master table, by visual row/column.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The rows currently rendered in the master TBODY (the virtualized band, not the data length).
   */
  async renderedRowCount(): Promise<number> {
    return this.grid.locator('.ht_master tbody tr').count();
  }

  /**
   * Rendered width of a column header cell in the top (header) clone.
   */
  async columnHeaderWidth(col: number): Promise<number> {
    const box = await this.columnHeader(col).boundingBox();

    return box?.width ?? 0;
  }

  /**
   * Double-click the resize handle on the end edge of a column header, which the
   * ManualColumnResize plugin turns into an autosize of that column.
   */
  async autosizeColumnByDoubleClick(col: number): Promise<void> {
    const header = this.columnHeader(col);
    const box = await header.boundingBox();

    if (!box) {
      throw new Error(`Column header ${col} has no bounding box`);
    }

    // A raw pointer move, not `locator.hover()`: hovering near the end edge is what makes the
    // plugin append and position `.manualColumnResizer` right under the pointer, and `hover()`
    // then re-runs its hit-target actionability check, which now finds that handle covering the
    // TH and treats it as an obstruction — retrying forever. `mouse.move` performs no such check.
    // 3px inside the end edge, not on it: the point must still land on the TH itself, so the
    // `mouseover` reaches the header cell rather than its border or the neighboring column.
    await this.page.mouse.move(box.x + box.width - 3, box.y + box.height / 2);

    const handle = this.page.locator('.manualColumnResizer');

    await expect(handle).toBeVisible();
    await handle.dblclick();
  }

  /**
   * Replace the long wrapped sentences with a short value through the fixture's button.
   */
  async shortenTexts(): Promise<void> {
    await this.page.getByTestId('shorten-texts').click();
    await expect(this.cell(1, 2)).toHaveText('short');
  }

  /**
   * Assert the rendered band reaches the bottom of the scrollable holder — the viewport shows
   * rows all the way down, not a blank area after the last rendered row. Also cross-checks that
   * the DOM band is at least as long as the fully-visible row count the engine itself reports
   * (`countVisibleRows`), which was correct even while the DOM lagged behind.
   */
  async expectViewportFilled(): Promise<void> {
    await expect.poll(async () => (await this.probe()).gap, {
      message: 'rendered rows should reach the bottom of the viewport',
    }).toBeLessThanOrEqual(20); // a horizontal scrollbar may occupy the bottom of the holder; 20px covers every theme.

    await expect.poll(async () => {
      const { rendered, visible } = await this.probe();

      // `rendered > 0` first: an empty TBODY probes as `{ rendered: 0, visible: 0 }`, and this poll
      // reads its own frame, so `0 >= 0` would pass without the first poll ever seeing rows.
      return rendered > 0 && rendered >= visible;
    }, {
      message: 'rendered row count should be at least the fully-visible row count the engine reports',
    }).toBe(true);
  }

  /**
   * How many draws (`afterViewRender`) and how many paints of cell (0, 0) (`afterRenderer`) the
   * fixture counted since the page loaded. Read in one `page.evaluate`, so both describe the same
   * moment. Cumulative since page load — compare two snapshots, never the raw values: every draw
   * before the action would otherwise bank slack an extra paint could hide in.
   */
  async paintCounters(): Promise<PaintCounters> {
    return this.page.evaluate(() => {
      const counters = window as unknown as { drawCount: number; cell00Paints: number };

      return { draws: counters.drawCount, cell00Paints: counters.cell00Paints };
    });
  }

  /**
   * Assert that every draw since `before` painted cell (0, 0) exactly once: the refill passes
   * repaint only the rows they append (DEV-2908). Cell (0, 0) is in every band of this fixture (no
   * scrolling) and every draw here is a full draw, so the paint delta must equal the draw delta —
   * a whole-band repaint on any refill pass pushes it above. Snapshot `before` right before the
   * action so the assertion describes that action's draws alone.
   *
   * @param {PaintCounters} before The counters snapshotted before the action.
   */
  async expectOnePaintPerDrawSince(before: PaintCounters): Promise<void> {
    const after = await this.paintCounters();
    const draws = after.draws - before.draws;
    const cell00Paints = after.cell00Paints - before.cell00Paints;

    expect(draws).toBeGreaterThan(0);
    expect(cell00Paints).toBe(draws);
  }

  /**
   * Assert that the action drew at least once and painted cell (0, 0) at least once per draw. This
   * is the sanity half of the merge-cells refill spec; whether a merged grid took the FULL repaint on
   * each refill pass is pinned in the engine tier (`walkontable/test/spec/table.spec.js`, DEV-2908),
   * where no overlay clone renders and the band-render count is observable. The counters here
   * cannot tell a refill pass from a clone render, so no stronger claim is made from them.
   *
   * @param {PaintCounters} before The counters snapshotted before the action.
   */
  async expectPaintedOnEveryDrawSince(before: PaintCounters): Promise<void> {
    const after = await this.paintCounters();
    const draws = after.draws - before.draws;
    const cell00Paints = after.cell00Paints - before.cell00Paints;

    expect(draws).toBeGreaterThan(0);
    expect(cell00Paints).toBeGreaterThanOrEqual(draws);
  }

  /**
   * Column header cell in the top clone (where the resize handle attaches).
   */
  private columnHeader(col: number): Locator {
    return this.grid.locator('.ht_clone_top thead tr').first().locator('th').nth(col);
  }

  /**
   * Single measurement of the rendered band vs. the viewport. The three fields are read in one
   * `page.evaluate`, so they describe the same frame; each `expect.poll` above calls `probe()`
   * independently, so the two assertions read separate frames. Returns `gap: Infinity` (never
   * satisfies the `toBeLessThanOrEqual` assertion) when the master table is not in the DOM yet or
   * no rows are rendered yet, instead of throwing on a missing element.
   */
  private async probe(): Promise<{ gap: number; rendered: number; visible: number }> {
    return this.page.evaluate(() => {
      const empty = { gap: Number.POSITIVE_INFINITY, rendered: 0, visible: 0 };
      const master = document.querySelector('[data-testid="grid"] .ht_master') as HTMLElement | null;

      if (!master) {
        return empty;
      }

      const holder = master.querySelector('.wtHolder') as HTMLElement;
      const rows = master.querySelectorAll('tbody tr');
      const lastRow = rows[rows.length - 1] as HTMLElement | undefined;

      if (!lastRow) {
        return empty;
      }

      const gap = holder.getBoundingClientRect().bottom - lastRow.getBoundingClientRect().bottom;
      const hot = (window as unknown as { hot: { countVisibleRows(): number } }).hot;

      return { gap, rendered: rows.length, visible: hot.countVisibleRows() };
    });
  }
}
