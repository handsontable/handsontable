import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * Which grid the `fixed-columns-end-review.html` fixture builds.
 */
export type ReviewScenario = 'freeze' | 'group';

/**
 * Query params the fixture understands.
 */
export interface FixedColumnsEndReviewOptions {
  scenario: ReviewScenario;
  rtl?: boolean;
  fixedColumnsStart?: number;
  fixedColumnsEnd?: number;
  /** The group scenario only: a visual column to hide (with indicators). */
  hiddenColumn?: number;
  /** The group scenario only: the `rowspan` of the group that reaches into the end band. */
  groupRowspan?: number;
}

/**
 * What a group header cell shows on a clone.
 */
export interface GroupCellInfo {
  text: string;
  colspan: number;
  /** Classes on the `th`. */
  cellClasses: string[];
  /** Classes on the inner `div.relative`, where `headerClassName` lands. */
  innerClasses: string[];
}

const END_CORNER = 'ht_clone_top_inline_end_corner';

type HotWindow = {
  hot: {
    getDataAtRow(row: number): string[];
    getSettings(): { fixedColumnsStart?: number };
    getPlugin(key: string): { freezeColumn(column: number): void; unfreezeColumn(column: number): void };
    render(): void;
  };
};

/**
 * Page Object for the `fixed-columns-end-review.html` fixture: ManualColumnFreeze next to a frozen end band, and
 * the cell a nested-headers group draws on the end clone. It hides the globals and the clone class names, so a
 * spec asserts what the user sees.
 */
export class FixedColumnsEndReviewPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly master: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.master = this.grid.locator('.ht_master');
  }

  /**
   * Navigate and wait for the grid to render (a real DOM condition, no sleep).
   *
   * @param {FixedColumnsEndReviewOptions} options The fixture options.
   */
  async goto(options: FixedColumnsEndReviewOptions): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    Object.entries(options).forEach(([name, value]) => {
      if (value !== undefined && value !== false) {
        params.set(name, value === true ? '1' : String(value));
      }
    });
    await this.page.goto(`/tests/fixtures/demo/fixed-columns-end-review.html?${params}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.master).toBeVisible();
  }

  /**
   * The first data row in visual order, joined: the column order the user sees.
   */
  async columnOrder(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.getDataAtRow(0));
  }

  /**
   * The number of columns frozen at the start.
   */
  async frozenStartCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.getSettings().fixedColumnsStart ?? 0);
  }

  /**
   * Freeze a column through the plugin API and render.
   *
   * @param {number} column Visual column.
   */
  async freezeByApi(column: number): Promise<void> {
    await this.page.evaluate((col) => {
      const { hot } = window as unknown as HotWindow;

      hot.getPlugin('manualColumnFreeze').freezeColumn(col);
      hot.render();
    }, column);
  }

  /**
   * Open the context menu on a body cell.
   *
   * @param {number} row Visual row.
   * @param {number} column Visual column.
   * @param {'master' | 'end'} where The clone that draws the cell.
   */
  async openContextMenu(row: number, column: number, where: 'master' | 'end'): Promise<void> {
    const scope = where === 'end' ? '.ht_clone_inline_end' : '.ht_master';

    await this.grid.locator(`${scope} [data-testid="cell-${row}-${column}"]`).click({ button: 'right' });
    await expect(this.page.locator('.htContextMenu').first()).toBeVisible();
  }

  /**
   * The menu entry with exactly this label, or an empty locator when the menu does not offer it.
   *
   * @param {string} label The translated label.
   */
  menuItem(label: string): Locator {
    return this.page.locator('.htContextMenu .ht_master td').filter({ hasText: new RegExp(`^${label}$`) });
  }

  /**
   * Scroll the master holder horizontally by setting the offset (a magnitude; the browser clamps it).
   *
   * @param {number} left The offset.
   */
  async scrollTo(left: number): Promise<void> {
    await this.master.locator('.wtHolder').evaluate((holder, target) => {
      const isRtl = getComputedStyle(holder).direction === 'rtl';

      holder.scrollLeft = isRtl ? -target : target;
    }, left);
  }

  /**
   * The non-placeholder group cells of one header level on the end corner clone.
   *
   * @param {number} level The header level, counted from the top.
   */
  async endGroups(level: number): Promise<GroupCellInfo[]> {
    return this.grid.locator(`.${END_CORNER} thead tr:nth-child(${level + 1}) th`).evaluateAll((cells) => {
      return cells
        .filter(el => el.querySelector('.colHeader') !== null && !el.classList.contains('hiddenHeader'))
        .map(el => ({
          text: (el.querySelector('.colHeader')?.textContent ?? '').trim(),
          colspan: Number(el.getAttribute('colspan') ?? 1),
          cellClasses: Array.from(el.classList),
          innerClasses: Array.from(el.querySelector('div.relative')?.classList ?? []),
        }));
    });
  }
}
