import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, BUNDLE_POLLING_MS } from '../bundle';

/**
 * Page Object for the hidden-rows-indicator-auto-height fixture: the vertical twin of
 * #13500 / DEV-2921.
 *
 * A `height: 'auto'` grid must never scroll itself — it grows to its rows and the page scrolls
 * instead. The queries below read the master scroll box, which is the element the browser decides
 * that on, and the column-header clone, which is what the unwanted bar knocks out of step.
 */
export class HiddenRowsIndicatorAutoHeightPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate with the indicators on or off, and wait for real DOM conditions rather than a sleep.
   *
   * @param indicators Whether `hiddenRows.indicators` is enabled. `off` is the control.
   */
  async goto(indicators: 'on' | 'off' = 'on'): Promise<void> {
    await this.page.goto(
      '/tests/fixtures/demo/hidden-rows-indicator-auto-height.html' +
      `?theme=${this.theme}&bundle=${this.bundle}&indicators=${indicators}`
    );
    await awaitBundle(this.page);
    await this.page.waitForFunction(
      () => 'hot' in window || 'htBuildError' in window, undefined, { polling: BUNDLE_POLLING_MS },
    );

    const buildError = await this.page.evaluate(
      () => (window as { htBuildError?: string }).htBuildError ?? null,
    );

    if (buildError !== null) {
      throw new Error(`Handsontable constructor threw in the fixture:\n${buildError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
    await expect(this.cell(11, 0)).toBeVisible();
  }

  /**
   * A data cell in the grid's master table.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId('grid').locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The theme the grid actually resolved, read from the instance rather than from the DOM.
   */
  async activeTheme(): Promise<string> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { getCurrentThemeName(): string },
    }).hot.getCurrentThemeName());
  }

  /**
   * Which row headers carry an indicator marker, keyed by the header's own label.
   *
   * Row headers are 1-based, so row 4 reads as `5`. Keying by label pins WHICH row is marked rather
   * than just how many are, and pins that the fix did not delete the arrow.
   */
  async markedHeaders(): Promise<Record<string, string>> {
    return this.page.evaluate(() => {
      const marked: Record<string, string> = {};

      document.querySelectorAll(
        '[data-testid="grid"] .ht_clone_inline_start th, [data-testid="grid"] .ht_master tbody th'
      ).forEach((th) => {
        const kinds = ['beforeHiddenRow', 'afterHiddenRow']
          .filter(kind => th.classList.contains(kind));

        if (kinds.length > 0) {
          marked[(th.textContent ?? '').trim()] = kinds.join(' ');
        }
      });

      return marked;
    });
  }

  /**
   * How far the master pane's content overflows its own scroll box vertically, in pixels.
   *
   * The mechanism, measured directly. On a `height: 'auto'` grid the box is sized to the rows, so
   * anything above zero is content the box was never sized for — here, the indicator's box laid
   * out below its row header.
   */
  async verticalOverflow(): Promise<number> {
    return this.page.evaluate(() => {
      const holder = document.querySelector(
        '[data-testid="grid"] .ht_master .wtHolder'
      ) as HTMLElement | null;

      if (holder === null) {
        throw new Error('The master scroll box (.ht_master .wtHolder) is not in the DOM.');
      }

      return holder.scrollHeight - holder.clientHeight;
    });
  }

  /**
   * The size a scrollbar is taking out of the master scroll box, in pixels.
   *
   * The honest signal: the overflow pair are integers, so a sub-pixel overflow reads as zero while
   * the browser is already painting a full-size bar.
   */
  async scrollbarSizes(): Promise<{ vertical: number, horizontal: number }> {
    return this.page.evaluate(() => {
      const holder = document.querySelector(
        '[data-testid="grid"] .ht_master .wtHolder'
      ) as HTMLElement | null;

      if (holder === null) {
        throw new Error('The master scroll box (.ht_master .wtHolder) is not in the DOM.');
      }

      return {
        vertical: holder.offsetWidth - holder.clientWidth,
        horizontal: holder.offsetHeight - holder.clientHeight,
      };
    });
  }

  /**
   * How much wider the column-header clone is than the master pane's usable width, in pixels.
   *
   * The user-visible consequence: an unwanted vertical bar narrows the master pane but not the
   * header clone, and the two then disagree about where the columns are. Both rects are read in one
   * evaluation so a redraw cannot land between them.
   */
  async headerCloneWiderThanMasterBy(): Promise<number> {
    return this.page.evaluate(() => {
      const grid = document.querySelector('[data-testid="grid"]') as HTMLElement;
      const master = grid.querySelector('.ht_master .wtHolder') as HTMLElement | null;
      const headerClone = grid.querySelector('.ht_clone_top .wtHolder') as HTMLElement | null;

      if (master === null || headerClone === null) {
        throw new Error('The master scroll box or the column-header clone is not in the DOM.');
      }

      return headerClone.offsetWidth - master.clientWidth;
    });
  }
}
