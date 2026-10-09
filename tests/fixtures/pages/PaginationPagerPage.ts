import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * The fixture's options, the visual suite's `/pagination-demo` route params by another name.
 */
export interface PagerOptions {
  pageSize?: '10' | 'auto';
  /**
   * `fixed` is a 450 px grid between two page inputs; `window` has no height, so the page scrolls.
   */
  size?: 'fixed' | 'window';
  dir?: 'ltr' | 'rtl';
}

/**
 * A pager button, by the page it moves to.
 */
export type PagerButton = 'first' | 'prev' | 'next' | 'last';

/**
 * What `Pagination#getPaginationData()` reports, the fields the specs read.
 */
export interface PaginationData {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  autoPageSize: boolean;
  firstVisibleRowIndex: number;
  lastVisibleRowIndex: number;
}

/**
 * How the rows of the page on screen fill the height they are given, read in one evaluation.
 */
export interface PageFit {
  /**
   * The rendered height of each row on the page, top to bottom.
   */
  rowHeights: number[];
  /**
   * The height the page's rows may take: the holder's client height minus the column header row for a
   * sized grid, and for a grid the window scrolls, the window's height minus the body's margins, the
   * pager and the column header row.
   */
  available: number;
  /**
   * Whether the grid's own holder scrolls vertically (it must not, with the auto page size).
   */
  holderScrolls: boolean;
  /**
   * Whether the page itself scrolls vertically.
   */
  windowScrolls: boolean;
}

/**
 * A box in viewport coordinates, as `getBoundingClientRect()` reports it.
 */
export interface Box {
  left: number;
  right: number;
}

/**
 * Page object for `fixtures/demo/pagination-pager.html`, the pager configured as the visual suite's
 * `/pagination-demo` route configures it.
 */
export class PaginationPagerPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly pager: Locator;
  readonly counter: Locator;
  readonly navigationLabel: Locator;
  readonly pageSizeSelect: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.pager = page.locator('.ht-pagination');
    this.counter = this.pager.locator('.ht-page-counter-section');
    this.navigationLabel = this.pager.locator('.ht-page-navigation-section__label');
    this.pageSizeSelect = this.pager.locator('select[name="pageSize"]');
  }

  /**
   * Opens the fixture with the given options and waits for the pager.
   *
   * @param {PagerOptions} options The fixture's options.
   */
  async goto(options: PagerOptions = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    if (options.pageSize) {
      params.set('pagesize', options.pageSize);
    }
    if (options.size) {
      params.set('size', options.size);
    }
    if (options.dir) {
      params.set('dir', options.dir);
    }

    await this.page.goto(`/tests/fixtures/demo/pagination-pager.html?${params}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.navigationLabel).toBeVisible();
  }

  /**
   * A pager button.
   *
   * @param {PagerButton} name The page it moves to.
   * @returns {Locator}
   */
  button(name: PagerButton): Locator {
    return this.pager.locator(`.ht-page-${name}`);
  }

  /**
   * Clicks a pager button and waits for the page it promises.
   *
   * @param {PagerButton} name The page it moves to.
   * @param {number} expectedPage The page the click must land on.
   */
  async go(name: PagerButton, expectedPage: number): Promise<void> {
    await this.button(name).click();
    await expect.poll(async() => (await this.paginationData()).currentPage).toBe(expectedPage);
  }

  /**
   * Picks a page size in the pager's select.
   *
   * @param {string} value `auto` or a number from the list.
   */
  async choosePageSize(value: string): Promise<void> {
    await this.pageSizeSelect.selectOption(value);
    await expect(this.pageSizeSelect).toHaveValue(value);
  }

  /**
   * Asserts which pager buttons are disabled, by both the attribute and the class the theme styles.
   *
   * @param {PagerButton[]} disabled The buttons that must be disabled; the others must be enabled.
   */
  async expectDisabled(disabled: PagerButton[]): Promise<void> {
    for (const name of ['first', 'prev', 'next', 'last'] as PagerButton[]) {
      const button = this.button(name);

      if (disabled.includes(name)) {
        await expect(button, `${name} disabled`).toBeDisabled();
        await expect(button).toHaveClass(/\bht-page-navigation-section__button--disabled\b/);
      } else {
        await expect(button, `${name} enabled`).toBeEnabled();
        await expect(button).not.toHaveClass(/\bht-page-navigation-section__button--disabled\b/);
      }
    }
  }

  /**
   * What the plugin reports about the page on screen.
   *
   * @returns {Promise<PaginationData>}
   */
  async paginationData(): Promise<PaginationData> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { getPlugin(name: string): { getPaginationData(): PaginationData } };
    }).hot.getPlugin('pagination').getPaginationData());
  }

  /**
   * Filters the Company name column to the values containing "a" and sorts by Country ascending, the
   * state the demo's specs reach through the dropdown menu and the header before they page.
   *
   * @returns {Promise<number>} How many rows the filter keeps.
   */
  async filterAndSort(): Promise<number> {
    return this.page.evaluate(() => {
      const hot = (window as unknown as {
        hot: {
          getPlugin(name: string): {
            addCondition(column: number, name: string, args: unknown[]): void;
            filter(): void;
            sort(config: { column: number; sortOrder: string }): void;
          };
          countRows(): number;
        };
      }).hot;
      const filters = hot.getPlugin('filters');

      filters.addCondition(0, 'contains', ['a']);
      filters.filter();
      hot.getPlugin('multiColumnSorting').sort({ column: 8, sortOrder: 'asc' });

      return hot.countRows();
    });
  }

  /**
   * The values of one column on the page on screen, by visual row.
   *
   * @param {number} column The visual column.
   * @returns {Promise<unknown[]>}
   */
  async pageColumnValues(column: number): Promise<unknown[]> {
    return this.page.evaluate((col) => {
      const hot = (window as unknown as {
        hot: {
          getPlugin(name: string): { getPaginationData(): { firstVisibleRowIndex: number; lastVisibleRowIndex: number } };
          getDataAtCell(row: number, column: number): unknown;
        };
      }).hot;
      const { firstVisibleRowIndex, lastVisibleRowIndex } = hot.getPlugin('pagination').getPaginationData();
      const values = [];

      for (let row = firstVisibleRowIndex; row <= lastVisibleRowIndex; row++) {
        values.push(hot.getDataAtCell(row, col));
      }

      return values;
    }, column);
  }

  /**
   * The row header labels on screen, top to bottom. The inline-start overlay draws them; the master's
   * header cells sit under it, empty.
   *
   * @returns {Promise<string[]>}
   */
  async renderedRowHeaders(): Promise<string[]> {
    return this.page.locator('.ht_clone_inline_start tbody th').allInnerTexts();
  }

  /**
   * How the page's rows fill the height they are given.
   *
   * @returns {Promise<PageFit>}
   */
  async pageFit(): Promise<PageFit> {
    return this.page.evaluate(() => {
      const hot = (window as unknown as {
        hot: { view: { isVerticallyScrollableByWindow(): boolean } };
      }).hot;
      const holder = document.querySelector('.ht_master .wtHolder') as HTMLElement;
      const headerRow = (document.querySelector('.ht_clone_top thead') as HTMLElement).getBoundingClientRect().height;
      const rowHeights = [...document.querySelectorAll('.ht_master tbody tr')]
        .map(row => row.getBoundingClientRect().height);
      let available;

      if (hot.view.isVerticallyScrollableByWindow()) {
        const body = getComputedStyle(document.body);
        const margins = Number.parseFloat(body.marginTop) + Number.parseFloat(body.marginBottom);
        const pager = (document.querySelector('.ht-pagination') as HTMLElement).getBoundingClientRect().height;

        available = window.innerHeight - margins - pager - headerRow;
      } else {
        available = holder.clientHeight - headerRow;
      }

      return {
        rowHeights,
        available,
        holderScrolls: holder.scrollHeight > holder.clientHeight,
        windowScrolls: (document.scrollingElement as HTMLElement).scrollHeight > window.innerHeight,
      };
    });
  }

  /**
   * The horizontal extent of the pager's parts, read in one evaluation.
   *
   * @returns {Promise<Record<string, Box>>}
   */
  async pagerLayout(): Promise<Record<string, Box>> {
    return this.page.evaluate(() => {
      const parts: Record<string, string> = {
        pageSize: '.ht-page-size-section',
        counter: '.ht-page-counter-section',
        navigation: '.ht-page-navigation-section',
        first: '.ht-page-first',
        prev: '.ht-page-prev',
        label: '.ht-page-navigation-section__label',
        next: '.ht-page-next',
        last: '.ht-page-last',
      };

      return Object.fromEntries(Object.entries(parts).map(([name, selector]) => {
        const rect = (document.querySelector(`.ht-pagination ${selector}`) as HTMLElement).getBoundingClientRect();

        return [name, { left: rect.left, right: rect.right }];
      }));
    });
  }
}
