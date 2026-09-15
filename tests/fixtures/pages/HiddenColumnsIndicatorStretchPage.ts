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
   * Whether the last visible column's header is actually carrying the indicator marker.
   *
   * Guards the subject: the fix moves the arrow, it must not delete it. Without this a stylesheet
   * that dropped the pseudo-element entirely would turn every assertion below green.
   */
  async indicatorMarkerCount(): Promise<number> {
    return this.page.evaluate(() => document.querySelectorAll(
      '[data-testid="grid"] .ht_master th.beforeHiddenColumn,' +
      '[data-testid="grid"] .ht_clone_top th.beforeHiddenColumn'
    ).length);
  }

  /**
   * How far the master pane's content overflows its own scroll box horizontally, in pixels.
   *
   * This is the mechanism, measured directly. Anything above zero is content the browser will
   * paint a scrollbar for — and under `stretchH` the columns already fit exactly, so the only
   * thing that can overflow is the indicator drawn outside its cell.
   */
  async horizontalOverflow(): Promise<number> {
    return this.page.evaluate(() => {
      const holder = document.querySelector(
        '[data-testid="grid"] .ht_master .wtHolder'
      ) as HTMLElement;

      return holder.scrollWidth - holder.clientWidth;
    });
  }

  /**
   * The size a scrollbar is taking out of the master scroll box, in pixels.
   *
   * The user-visible half of the symptom: a bar with nothing to scroll, sitting under columns that
   * already fit.
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
   * Scroll the master pane to the bottom and wait until both panes have settled there.
   *
   * Two assignments, not one: a single `scrollTop = scrollHeight` lands a couple of pixels short
   * once the draw that follows it grows the rendered band, and a bottom-seam defect then reads
   * clean. The wait afterwards is a positive condition — both holders at their own maximum — so a
   * pane that never moved fails here instead of passing the assertion that follows.
   */
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => {
      const holder = document.querySelector(
        '[data-testid="grid"] .ht_master .wtHolder'
      ) as HTMLElement;

      holder.scrollTop = holder.scrollHeight;
      holder.scrollTop = holder.scrollHeight;
    });

    await this.page.waitForFunction(() => {
      const grid = document.querySelector('[data-testid="grid"]') as HTMLElement;
      const master = grid.querySelector('.ht_master .wtHolder') as HTMLElement;
      const frozen = grid.querySelector('.ht_clone_inline_start .wtHolder') as HTMLElement;

      return master.scrollTop === master.scrollHeight - master.clientHeight &&
        frozen.scrollTop === frozen.scrollHeight - frozen.clientHeight;
    }, undefined, { polling: BUNDLE_POLLING_MS });
  }

  /**
   * How far a row in the frozen pane sits below the same row in the scrollable pane, in pixels.
   *
   * Both reads are `getBoundingClientRect()` on the SAME row index, so this is the misalignment a
   * user sees across the frozen boundary and not a difference in what each pane rendered. Zero is
   * correct; the defect puts one scrollbar's height between them.
   *
   * @param row The visual row index to compare. Pick one that both panes render.
   */
  async rowMisalignment(row: number): Promise<number> {
    const frozenTop = await this.frozenCell(row, 0)
      .evaluate(el => el.getBoundingClientRect().top);
    const masterTop = await this.masterCell(row, 2)
      .evaluate(el => el.getBoundingClientRect().top);

    return frozenTop - masterTop;
  }
}
