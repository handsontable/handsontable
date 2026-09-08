import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the auto-height-scrollbar-zoom fixture (DEV-2525): a `height: 'auto'` grid with
 * relative width and `stretchH`, rendered below 100% through CSS zoom.
 *
 * A grid told to size itself to its rows must never scroll itself, on either axis. The queries
 * below read the master scroll box, which is the element the browser decides that on.
 */
export class AutoHeightScrollbarZoomPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate at a given zoom and row count, and wait for a real DOM condition rather than a sleep.
   *
   * @param zoom The CSS zoom to render the page at. Below 1 reproduces the defect.
   * @param rows How many rows the grid holds.
   */
  async goto(zoom = 1, rows = 40): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/auto-height-scrollbar-zoom.html` +
      `?theme=${this.theme}&bundle=${this.bundle}&zoom=${zoom}&rows=${rows}`
    );
    // Wait for the bundle itself before anything else. The `document.write`-injected script and the
    // block that constructs the grid are separate, so a page can look ready while `Handsontable` is
    // still undefined, and the failure then surfaces inside a later `page.evaluate` far from its
    // cause. `waitForFunction`, not `expect`: the plain UMD bundle is ~6 MB and every worker pulls
    // its own copy, which outlasts the 10s `expect` timeout on a cold server.
    await this.page.waitForFunction(() => 'Handsontable' in window);
    await expect(this.cell(0, 0)).toBeVisible();
    await expect(this.lastRow()).toBeAttached();
  }

  /**
   * A data cell in the grid's master table.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId('grid').locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The last row of the master table. Virtualization is off in the fixture, so this is the last
   * row of the data.
   */
  lastRow(): Locator {
    return this.page.getByTestId('grid').locator('.ht_master table.htCore tbody tr').last();
  }

  /**
   * The theme the grid actually resolved, read from the instance rather than from the DOM.
   *
   * Linking a theme's stylesheet does not apply it — every rule is scoped to an `ht-theme-*` class
   * on the container. Without that class all three theme legs render the built-in default and
   * quietly test one configuration six times over.
   */
  async activeTheme(): Promise<string> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { getCurrentThemeName(): string },
    }).hot.getCurrentThemeName());
  }

  /**
   * The width the browser actually paints a cell's bottom border at.
   *
   * Asserted before anything else: no inflated border means the zoom did not take, and every
   * assertion below would pass on code that still has the defect.
   */
  async cellBorderBottomWidth(): Promise<number> {
    return this.page.evaluate(() => {
      const td = document.querySelector('[data-testid="grid"] .ht_master table.htCore tbody td');

      return Number.parseFloat(getComputedStyle(td as Element).borderBottomWidth);
    });
  }

  /**
   * The width a scrollbar is taking out of the master scroll box, in pixels.
   *
   * This is the honest signal rather than `scrollHeight - clientHeight`: those are integers, so a
   * sub-pixel overflow reads as zero while the browser is already painting a full-size bar.
   */
  async scrollbarSizes(): Promise<{ vertical: number, horizontal: number }> {
    return this.page.evaluate(() => {
      const holder = document.querySelector(
        '[data-testid="grid"] .ht_master .wtHolder'
      ) as HTMLElement;

      return {
        vertical: holder.offsetWidth - holder.clientWidth,
        horizontal: holder.offsetHeight - holder.clientHeight,
      };
    });
  }

  /**
   * How far the rendered table overflows the scroll box that holds it, in CSS pixels.
   *
   * Both sides are `getBoundingClientRect()` reads so the fraction survives and the two are in the
   * same coordinate space — a rect is scaled by CSS zoom and `clientHeight` is not, so mixing them
   * produces confident nonsense. Positive means the box is too short; zero or below is correct.
   */
  async tableOverflowBelowScrollBox(): Promise<number> {
    return this.page.evaluate(() => {
      const grid = document.querySelector('[data-testid="grid"]') as HTMLElement;
      const hider = grid.querySelector('.ht_master .wtHider') as HTMLElement;
      const table = grid.querySelector('.ht_master table.htCore') as HTMLElement;

      return table.getBoundingClientRect().height - hider.getBoundingClientRect().height;
    });
  }

  /**
   * How much taller the scroll box is than the table it holds, in CSS pixels.
   *
   * The other side of the same edge: the correction must not overshoot into a visible strip of
   * dead space below the last row.
   */
  async deadSpaceBelowTable(): Promise<number> {
    return -(await this.tableOverflowBelowScrollBox());
  }
}
