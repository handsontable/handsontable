import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * Page Object for the column-sorting-announcement fixture: a sortable grid whose second header is
 * `<b>Age</b> in <i>years</i>`, built with either sorting plugin and with `ariaTags` on or off.
 */
export class ColumnSortingAnnouncementPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   *
   * @param options.plugin The sorting plugin the grid is built with.
   * @param options.aria `off` builds the grid with `ariaTags: false`.
   */
  async goto(options: { plugin?: 'columnSorting' | 'multiColumnSorting'; aria?: 'on' | 'off' } = {}): Promise<void> {
    const plugin = options.plugin ?? 'columnSorting';
    const aria = options.aria ?? 'on';

    await this.page.goto(
      `/tests/fixtures/demo/column-sorting-announcement.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&plugin=${plugin}&aria=${aria}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A single data cell, by visual row/column, via its stable test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The column header cell of a visual column.
   */
  header(col: number): Locator {
    return this.page.locator('.ht_clone_top thead th').nth(col);
  }

  /**
   * The polite live region the sort is announced through.
   */
  politeAnnouncer(): Locator {
    return this.page.locator('[role="status"][aria-live="polite"]');
  }

  /**
   * The assertive live region, which a sort must leave empty.
   */
  assertiveAnnouncer(): Locator {
    return this.page.locator('[role="status"][aria-live="assertive"]');
  }

  /**
   * Assert the rendered column, top to bottom (web-first, auto-retrying).
   */
  async expectColumn(col: number, values: string[]): Promise<void> {
    for (const [row, value] of values.entries()) {
      await expect(this.cell(row, col)).toHaveText(value);
    }
  }

  /**
   * Start recording every message written to the polite live region, so a spec can tell an
   * announcement that never happened from one that a later one overwrote.
   */
  async recordAnnouncements(): Promise<void> {
    await this.page.evaluate(() => {
      const region = document.querySelector('[role="status"][aria-live="polite"]') as HTMLElement;
      const log: string[] = [];

      (window as unknown as { announcementLog: string[] }).announcementLog = log;
      new MutationObserver(() => {
        if (region.textContent) {
          log.push(region.textContent);
        }
      }).observe(region, { childList: true, characterData: true, subtree: true });
    });
  }

  /**
   * Every message written to the polite live region since {@link ColumnSortingAnnouncementPage#recordAnnouncements}.
   */
  announcements(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { announcementLog: string[] }).announcementLog);
  }

  /**
   * Sort through the public API, which must stay silent.
   */
  async sortThroughApi(plugin: string, column: number, sortOrder: 'asc' | 'desc'): Promise<void> {
    await this.page.evaluate(([key, col, order]) => {
      const { hot } = window as unknown as {
        hot: { getPlugin(name: string): { sort(config: unknown): void } };
      };

      hot.getPlugin(key as string).sort({ column: col, sortOrder: order });
    }, [plugin, column, sortOrder] as const);
  }
}
