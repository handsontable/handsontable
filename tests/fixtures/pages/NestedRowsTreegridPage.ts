import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * The treegrid attributes of one rendered row: `level`, `posinset` and `setsize` as read off its
 * `TR`, `expanded` off its row header. An attribute the row does not carry reads as `null`.
 */
export interface TreegridRowAttributes {
  level: string | null;
  posinset: string | null;
  setsize: string | null;
  expanded: string | null;
}

/**
 * Page Object for the nested-rows treegrid accessibility fixture.
 *
 * A row is painted in the master table and in the inline-start clone that carries the row headers,
 * so every attribute read walks both copies and reports a row only when they agree. A copy that
 * disagrees is a bug in itself, and the read says so instead of picking one.
 */
export class NestedRowsTreegridPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   *
   * @param options.dir The layout direction of the page and the grid.
   * @param options.aria `off` builds the grid with `ariaTags: false`.
   */
  async goto(options: { dir?: 'ltr' | 'rtl'; aria?: 'on' | 'off' } = {}): Promise<void> {
    const dir = options.dir ?? 'ltr';
    const aria = options.aria ?? 'on';

    await this.page.goto(
      `/tests/fixtures/demo/nested-rows-treegrid.html?theme=${this.theme}&bundle=${this.bundle}&dir=${dir}&aria=${aria}`
    );
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A single data cell, by visual row/column, via its stable test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The collapse/expand button in a row header, by visual row index.
   */
  collapseButton(row: number): Locator {
    return this.page.locator('.ht_clone_inline_start tbody tr').nth(row).locator('.ht_nestingButton');
  }

  /**
   * The treegrid attributes of every rendered row, top to bottom, read in one evaluation so a
   * re-render between two reads cannot mix two layouts. Throws when the master copy of a row and
   * its inline-start copy disagree, and when a row element carries `aria-expanded`, which belongs to
   * the row header.
   */
  rowAttributes(): Promise<TreegridRowAttributes[]> {
    return this.page.evaluate(() => {
      const read = (selector: string) => Array.from(document.querySelectorAll(`${selector} tbody tr`))
        .map((TR) => {
          if (TR.hasAttribute('aria-expanded')) {
            throw new Error('A row element carries aria-expanded, which belongs to its row header');
          }

          return {
            level: TR.getAttribute('aria-level'),
            posinset: TR.getAttribute('aria-posinset'),
            setsize: TR.getAttribute('aria-setsize'),
            expanded: TR.querySelector('th')?.getAttribute('aria-expanded') ?? null,
          };
        });
      const master = read('.ht_master');
      const clone = read('.ht_clone_inline_start');

      if (JSON.stringify(master) !== JSON.stringify(clone)) {
        throw new Error(`Row copies disagree: ${JSON.stringify({ master, clone })}`);
      }

      return master;
    });
  }

  /**
   * How many rendered rows still carry any of the treegrid attributes, across every copy.
   */
  countRowsWithTreegridAttributes(): Promise<number> {
    return this.page.evaluate(() => document.querySelectorAll(
      '[data-testid="grid"] tbody tr:is([aria-level], [aria-posinset], [aria-setsize])'
    ).length);
  }

  /**
   * The text of the first column for every visual row, top to bottom. Rows `HiddenRows` hides are
   * included, rows a collapse trims are not.
   */
  visibleNames(): Promise<string[]> {
    return this.page.evaluate(() => {
      const rows: string[] = [];

      for (let row = 0; row < window.hot.countRows(); row++) {
        rows.push(String(window.hot.getDataAtCell(row, 0)));
      }

      return rows;
    });
  }

  /**
   * The selected cell as `[row, column]` in VISUAL coordinates, or `null` when nothing is selected.
   * A row header reads as column `-1`.
   */
  selectedCell(): Promise<[number, number] | null> {
    return this.page.evaluate(() => {
      const last = window.hot.getSelectedLast();

      return last ? [last[0], last[1]] as [number, number] : null;
    });
  }

  /**
   * Put the focus on a row header the way a user does: click the first cell of the row, then step
   * into the header with the inline-start arrow.
   *
   * @param row Visual row index.
   */
  async focusRowHeader(row: number): Promise<void> {
    const isRtl = await this.page.evaluate(() => window.hot.isRtl());

    await this.cell(row, 0).click();
    await this.page.keyboard.press(isRtl ? 'ArrowRight' : 'ArrowLeft');
    await expect.poll(() => this.selectedCell()).toEqual([row, -1]);
  }

  /**
   * The polite live region the plugin announces through.
   */
  politeAnnouncer(): Locator {
    return this.page.locator('[role="status"][aria-live="polite"]');
  }

  /**
   * Push settings through `updateSettings()`.
   */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(config => window.hot.updateSettings(config), settings);
  }

  /**
   * Select a row header through the API, by visual row index. For a row whose cells cannot be
   * clicked, such as one with every column hidden.
   *
   * @param row Visual row index.
   */
  async selectRowHeader(row: number): Promise<void> {
    await this.page.evaluate(visualRow => window.hot.selectCell(visualRow, -1), row);
    await expect.poll(() => this.selectedCell()).toEqual([row, -1]);
  }

  /**
   * Hide rows through the `HiddenRows` plugin, by visual index.
   *
   * @param rows Visual row indexes to hide.
   */
  async hideRows(rows: number[]): Promise<void> {
    await this.page.evaluate(indexes => window.hot.updateSettings({ hiddenRows: { rows: indexes } }), rows);
  }

  /**
   * Replace the data with `loadData()`.
   */
  async loadData(data: unknown[]): Promise<void> {
    await this.page.evaluate(rows => window.hot.loadData(rows), data);
  }

  /**
   * Call one of the plugin's public methods in the page and return its result.
   */
  callPlugin(method: string, ...args: unknown[]): Promise<unknown> {
    return this.page.evaluate(
      ({ method: name, args: methodArgs }) => {
        const plugin = window.hot.getPlugin('nestedRows') as unknown as Record<string, (...a: unknown[]) => unknown>;

        return plugin[name](...methodArgs);
      },
      { method, args }
    );
  }
}
