import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the row-height-device-scale fixture (#6280): an auto-height grid with
 * every row rendered and an element directly beneath it. Exposes the two edges the defect
 * pulled apart — the grid's own scroll range against the last row it holds, and the
 * row-header clone's scroll box against its own last row.
 *
 * Every measurement is a `getBoundingClientRect()` read, so it stays correct for rows that
 * sit below the fold: the grid is far taller than the window here, and scrolling it into
 * view would only add a source of flake.
 */
export class RowHeightDeviceScalePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate at a given zoom and wait for the grid to render a cell (a real DOM condition,
   * no sleep). The fixture applies the zoom before constructing the grid.
   *
   * @param zoom The CSS zoom to render the page at. Below 1 reproduces the defect.
   */
  async goto(zoom = 1): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/row-height-device-scale.html` +
      `?theme=${this.theme}&bundle=${this.bundle}&zoom=${zoom}`
    );
    await expect(this.cell(0, 0)).toBeVisible();
    await expect(this.lastRow()).toBeAttached();
  }

  /**
   * Navigate to the same grid with row moving switched on.
   *
   * `zoom` opens the page already zoomed out, so the grid is built under the inflated border.
   * `zoomAfter` is what a user does with Ctrl+minus on an open page: the grid is built at 100%, then
   * the zoom is applied and a `resize` follows. Both default to 100%.
   *
   * @param options The zoom the page is built at, and the zoom applied after the grid exists.
   */
  async gotoWithRowMove(options: { zoom?: number; zoomAfter?: number } = {}): Promise<void> {
    const { zoom = 1, zoomAfter = 1 } = options;

    await this.page.goto(
      `/tests/fixtures/demo/row-height-device-scale.html` +
      `?theme=${this.theme}&bundle=${this.bundle}&zoom=${zoom}&zoomAfter=${zoomAfter}&rowMove=1`
    );
    await expect(this.cell(0, 0)).toBeVisible();
    await expect(this.lastRow()).toBeAttached();
  }

  /**
   * Zooms the page while the grid is hidden, waits until the grid has handled that zoom's `resize`, then
   * shows the grid again and sends the `resize` the page gets then.
   *
   * What a user does with the grid in a closed tab: the zoom changes while nobody sees it, and the
   * application refreshes the grid once it is shown (`refreshDimensions()` runs on a window resize, and a
   * container observer skips a hidden grid). The wait is the positive control: the grid's handler of the
   * first `resize` can run a task after the event, and a grid shown before it ran would never be refreshed
   * while hidden, which is the case this method exists to set up.
   *
   * @param zoom The CSS zoom to apply while the grid is hidden.
   */
  async zoomWhileHidden(zoom: number): Promise<void> {
    await this.page.evaluate(() => {
      const state = window as unknown as {
        hiddenRefreshes: number;
        hot: { addHook(name: string, callback: () => void): void };
      };

      state.hiddenRefreshes = 0;
      state.hot.addHook('afterRefreshDimensions', () => {
        state.hiddenRefreshes += 1;
      });
      (document.getElementById('wrap') as HTMLElement).style.display = 'none';
    });
    await this.page.evaluate((cssZoom) => {
      document.documentElement.style.zoom = String(cssZoom);
      window.dispatchEvent(new Event('resize'));
    }, zoom);
    await expect.poll(
      () => this.page.evaluate(() => (window as unknown as { hiddenRefreshes: number }).hiddenRefreshes)
    ).toBeGreaterThan(0);
    await this.page.evaluate(() => {
      (document.getElementById('wrap') as HTMLElement).style.display = '';
      window.dispatchEvent(new Event('resize'));
    });
  }

  /**
   * The row header of a visual row, in the clone that holds the row headers.
   */
  rowHeader(row: number): Locator {
    return this.page.getByTestId('grid').locator('.ht_clone_inline_start').getByTestId(`row-header-${row}`);
  }

  /**
   * Selects a row by its header, presses that header, and drags it over the upper half of each row
   * header in `rows`, in order. For each one it returns how far the guideline's bottom edge sits
   * below the top edge of the header under the pointer: 0 when the line is on the row border.
   *
   * The rows are visited in one drag, with the real mouse, because the guideline is only drawn while
   * the header is held. The result is read right after each move; the plugin positions the line
   * synchronously from that event.
   *
   * @param startRow The visual row whose header is pressed.
   * @param rows The visual rows to hover, in order.
   */
  async guidelineGaps(startRow: number, rows: number[]): Promise<number[]> {
    const start = this.rowHeader(startRow);

    await start.scrollIntoViewIfNeeded();
    await start.click();

    const startBox = await start.boundingBox();

    if (!startBox) {
      throw new Error(`The header of row ${startRow} has no box`);
    }

    await this.page.mouse.move(startBox.x + 5, startBox.y + startBox.height / 2);
    await this.page.mouse.down();

    const gaps: number[] = [];

    for (const row of rows) {
      const header = this.rowHeader(row);

      await header.scrollIntoViewIfNeeded();

      const box = await header.boundingBox();

      if (!box) {
        throw new Error(`The header of row ${row} has no box`);
      }

      await this.page.mouse.move(box.x + 5, box.y + box.height / 2 + 6, { steps: 3 });
      await this.page.mouse.move(box.x + 5, box.y + 3, { steps: 3 });

      gaps.push(await this.page.evaluate((hoveredRow) => {
        const grid = document.querySelector('[data-testid="grid"]') as HTMLElement;
        const guideline = grid.querySelector('.ht__manualRowMove--guideline') as HTMLElement | null;
        const header = grid
          .querySelector('.ht_clone_inline_start')!
          .querySelector(`[data-testid="row-header-${hoveredRow}"]`) as HTMLElement;

        // A positive control: a guideline that is not drawn would read as a gap of nothing.
        if (!guideline || getComputedStyle(guideline).display === 'none') {
          throw new Error('The guideline is not drawn while the header is held');
        }

        return guideline.getBoundingClientRect().bottom - header.getBoundingClientRect().top;
      }, row));
    }

    await this.page.mouse.up();

    return gaps;
  }

  /**
   * A data cell in the grid's master table.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId('grid').locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The last row of the master table. Virtualization is off in the fixture, so this is the
   * last row of the data rather than the last one near the viewport.
   */
  lastRow(): Locator {
    return this.page.getByTestId('grid').locator('.ht_master table.htCore tbody tr').last();
  }

  /**
   * The theme the grid actually resolved, read from the instance rather than from the DOM.
   *
   * Linking a theme's stylesheet does not apply it — every rule is scoped to an `ht-theme-*` class on
   * the container. Without that class all three theme legs render the built-in default and quietly
   * test one configuration six times over.
   */
  async activeTheme(): Promise<string> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { getCurrentThemeName(): string },
    }).hot.getCurrentThemeName());
  }

  /**
   * The width the browser actually paints a cell's bottom border at.
   *
   * The suite asserts this before anything else. It is the mechanism the whole defect rests
   * on: the border is declared 1px, and only a browser rendering below 100% reports more.
   * Were the zoom not to apply, every geometry assertion below would pass for the wrong
   * reason, on code that still has the bug.
   */
  async cellBorderBottomWidth(): Promise<number> {
    return this.page.evaluate(() => {
      const grid = document.querySelector('[data-testid="grid"]') as HTMLElement;
      const cell = grid.querySelector('.ht_master table.htCore tbody td') as HTMLElement;

      return Number.parseFloat(getComputedStyle(cell).borderBottomWidth);
    });
  }

  /**
   * How far the last row's bottom edge sits below the grid's own scroll range.
   *
   * Positive means the grid renders taller than the box it reports, so the rows spill onto
   * whatever follows the grid. This is the number that grew by ~0.1px per row at 90% zoom.
   */
  async rowOverflowBelowGrid(): Promise<number> {
    return this.page.evaluate(() => {
      const grid = document.querySelector('[data-testid="grid"]') as HTMLElement;
      const hider = grid.querySelector('.ht_master .wtHider') as HTMLElement;
      const rows = grid.querySelectorAll('.ht_master table.htCore tbody tr');
      const lastRow = rows[rows.length - 1] as HTMLElement;

      return lastRow.getBoundingClientRect().bottom - hider.getBoundingClientRect().bottom;
    });
  }

  /**
   * How much of the row-header clone's last row its own scroll box cuts off.
   *
   * Positive means the bottom row numbers are clipped away — the visible half of this
   * defect. The clone's rows never drift from the master's; it is the box around them that
   * came up short.
   */
  async rowHeaderClipped(): Promise<number> {
    return this.page.evaluate(() => {
      const grid = document.querySelector('[data-testid="grid"]') as HTMLElement;
      const rows = grid.querySelectorAll('.ht_clone_inline_start table.htCore tbody tr');
      const lastRow = rows[rows.length - 1] as HTMLElement;
      const holder = grid.querySelector('.ht_clone_inline_start .wtHolder') as HTMLElement;

      return lastRow.getBoundingClientRect().bottom - holder.getBoundingClientRect().bottom;
    });
  }

  /**
   * The distance from one row's top to the next, averaged over the body rows, in the grid's own CSS
   * pixels (`offsetTop`, which CSS zoom does not scale).
   *
   * Engine-neutral evidence that the rows render taller than a whole-pixel height: Chromium shows the
   * inflation in the cell's computed border, and WebKit under CSS zoom does not, while its rows grow
   * all the same.
   */
  async rowPitch(): Promise<number> {
    return this.page.evaluate(() => {
      const grid = document.querySelector('[data-testid="grid"]') as HTMLElement;
      const rows = grid.querySelectorAll('.ht_master table.htCore tbody tr');
      const second = rows[1] as HTMLElement;
      const last = rows[rows.length - 1] as HTMLElement;

      return (last.offsetTop - second.offsetTop) / (rows.length - 2);
    });
  }

  /**
   * The gap between the grid's last row and the element placed under the grid. Negative
   * means the grid overlaps that element.
   */
  async gapToElementBelow(): Promise<number> {
    return this.page.evaluate(() => {
      const grid = document.querySelector('[data-testid="grid"]') as HTMLElement;
      const rows = grid.querySelectorAll('.ht_master table.htCore tbody tr');
      const lastRow = rows[rows.length - 1] as HTMLElement;
      const below = document.querySelector('[data-testid="below"]') as HTMLElement;

      return below.getBoundingClientRect().top - lastRow.getBoundingClientRect().bottom;
    });
  }
}
