import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, BUNDLE_POLLING_MS } from '../bundle';

/**
 * Page Object for the hidden-columns-indicator-stretch fixture (#13500 / DEV-2921): a stretched
 * grid with frozen columns whose last visible column carries a hidden-column indicator.
 *
 * Every query below reads the master scroll box or the frozen-column clone, because those are the
 * two elements the defect drives apart.
 */
export class HiddenColumnsIndicatorStretchPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate with the indicators on or off, in a given text direction, and wait for real DOM
   * conditions rather than a sleep.
   *
   * A constructor throw is rethrown as itself. Without that, a grid that never built shows up as a
   * 10s locator timeout on `cell-0-2` — the bundle IS defined, so `awaitBundle()` passes — and the
   * real error never reaches the report.
   *
   * @param indicators Whether `hiddenColumns.indicators` is enabled. `off` is the control.
   * @param dir The document's text direction. `rtl` mirrors the indicator to the scrollable edge.
   */
  async goto(indicators: 'on' | 'off' = 'on', dir: 'ltr' | 'rtl' = 'ltr'): Promise<void> {
    await this.page.goto(
      '/tests/fixtures/demo/hidden-columns-indicator-stretch.html' +
      `?theme=${this.theme}&bundle=${this.bundle}&indicators=${indicators}&dir=${dir}`
    );
    // Wait for the bundle itself before anything else: the `document.write`-injected script and the
    // block that constructs the grid are separate, so a page can look ready while `Handsontable` is
    // still undefined, and the failure then surfaces inside a later `page.evaluate` far from its
    // cause. The helper owns the reasoning and the polling interval.
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

    await expect(this.masterCell(0, 2)).toBeVisible();
    await expect(this.frozenCell(0, 0)).toBeVisible();
  }

  /**
   * A cell in the master (scrollable) pane. Only unfrozen columns live here uniquely — a frozen
   * column's cell is also copied into the inline-start clone, so asking for one by test id alone
   * would match twice and fail strict mode.
   */
  masterCell(row: number, col: number): Locator {
    return this.page.getByTestId('grid').locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * A cell in the frozen-column clone — the pane that drifts.
   */
  frozenCell(row: number, col: number): Locator {
    return this.page.getByTestId('grid').locator('.ht_clone_inline_start')
      .getByTestId(`cell-${row}-${col}`);
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
   * Which column headers carry an indicator marker, keyed by the header's own label.
   *
   * A bare count would pass on an off-by-one in the marker's placement, which the plugin's
   * `AGENTS.md` calls out as "a real bug, not a style choice". Keying by label pins WHICH column is
   * marked, and pins that the fix did not delete the arrow it moves.
   */
  async markedHeaders(): Promise<Record<string, string>> {
    return this.page.evaluate(() => {
      const marked: Record<string, string> = {};

      document.querySelectorAll('[data-testid="grid"] .ht_master thead th').forEach((th) => {
        const kinds = ['beforeHiddenColumn', 'afterHiddenColumn']
          .filter(kind => th.classList.contains(kind));

        if (kinds.length > 0) {
          marked[(th.textContent ?? '').trim()] = kinds.join(' ');
        }
      });

      return marked;
    });
  }

  /**
   * How far the master pane's content overflows its own scroll box horizontally, in pixels.
   *
   * This is the mechanism, measured directly. Anything above zero is content the browser will
   * paint a scrollbar for — and under `stretchH` the columns already fit exactly, so the only
   * thing that can overflow is the indicator's box laid out past its cell.
   */
  async horizontalOverflow(): Promise<number> {
    return this.page.evaluate(() => {
      const holder = document.querySelector(
        '[data-testid="grid"] .ht_master .wtHolder'
      ) as HTMLElement | null;

      if (holder === null) {
        throw new Error('The master scroll box (.ht_master .wtHolder) is not in the DOM.');
      }

      return holder.scrollWidth - holder.clientWidth;
    });
  }

  /**
   * The size a scrollbar is taking out of the master scroll box, in pixels.
   *
   * The honest signal, and the reason both it and `horizontalOverflow()` are asserted: the overflow
   * pair are integers, so a sub-pixel overflow reads as zero while the browser is already painting
   * a full-size bar. `offsetHeight - clientHeight` cannot miss that. The same note is on
   * `AutoHeightScrollbarZoomPage.scrollbarSizes()`.
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
   * Scroll the master pane to the bottom and wait until the last row is actually rendered.
   *
   * Two assignments, not one: a single `scrollTop = scrollHeight` lands a couple of pixels short
   * once the draw that follows it grows the rendered band, and a bottom-seam defect then reads
   * clean.
   *
   * The wait ends on the RENDER state, never on `scrollTop`: the offset applies synchronously while
   * the redraw it triggers is coalesced into a later animation frame, so a settled offset does not
   * mean the band the assertions read has moved yet.
   */
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => {
      const holder = document.querySelector(
        '[data-testid="grid"] .ht_master .wtHolder'
      ) as HTMLElement | null;

      if (holder === null) {
        throw new Error('The master scroll box (.ht_master .wtHolder) is not in the DOM.');
      }

      holder.scrollTop = holder.scrollHeight;
      holder.scrollTop = holder.scrollHeight;
    });

    await expect.poll(() => this.page.evaluate(() => {
      const hot = (window as unknown as {
        hot: { view: { _wt: { wtTable: { getLastRenderedRow(): number } } }, countRows(): number },
      }).hot;

      return hot.view._wt.wtTable.getLastRenderedRow() === hot.countRows() - 1;
    })).toBe(true);
  }

  /**
   * How far a row in the frozen pane sits below the same row in the scrollable pane, in pixels.
   *
   * Both rects are read inside ONE `page.evaluate`, on nodes queried in that same evaluation.
   * Walkontable recycles `<tr>`/`<td>` nodes between draws, so two separately-resolved locators can
   * straddle a redraw and be measured on nodes that no longer hold the same row — a plausible
   * non-zero number on correct code (DEV-2827, `tests/AGENTS.md`).
   *
   * Zero is correct; the defect puts one scrollbar's height between them.
   *
   * @param row The visual row index to compare. Pick one that both panes render.
   */
  async rowMisalignment(row: number): Promise<number> {
    return this.page.evaluate((visualRow) => {
      const grid = document.querySelector('[data-testid="grid"]') as HTMLElement;
      const frozen = grid.querySelector(
        `.ht_clone_inline_start [data-testid="cell-${visualRow}-0"]`
      ) as HTMLElement | null;
      const master = grid.querySelector(
        `.ht_master [data-testid="cell-${visualRow}-2"]`
      ) as HTMLElement | null;

      if (frozen === null || master === null) {
        throw new Error(`Row ${visualRow} is not rendered in both panes ` +
          `(frozen: ${frozen !== null}, master: ${master !== null}).`);
      }

      return frozen.getBoundingClientRect().top - master.getBoundingClientRect().top;
    }, row);
  }
}
