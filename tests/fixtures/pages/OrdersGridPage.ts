import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { FiltersValueListPage } from './FiltersValueListPage';

/**
 * Whether `fixtures/demo/orders-grid.html` pages its rows: `off` is the js visual demo's shared `/`
 * grid, `10` its `/pagination-demo` route.
 */
export type OrdersPagination = 'off' | '10';

/**
 * The pagination state the plugin reports, and the counter text it draws.
 */
export type PageState = {
  currentPage: number,
  totalPages: number,
  firstVisibleRowIndex: number,
  lastVisibleRowIndex: number,
  counter: string,
  navigation: string,
};

type OrdersWindow = {
  hot: {
    getDataAtCol(column: number): unknown[],
    getDataAtCell(row: number, column: number): unknown,
    getSourceData(): unknown[][],
    getSelected(): number[][] | undefined,
    getPlugin(name: 'hiddenColumns'): { getHiddenColumns(): number[] },
    getPlugin(name: 'multiColumnSorting'): { getSortConfig(): Array<{ column: number, sortOrder: string }> },
    getPlugin(name: 'pagination'): {
      getPaginationData(): Omit<PageState, 'counter' | 'navigation'>,
    },
    getPlugin(name: string): unknown,
  },
};

/**
 * Page Object for the orders fixture: the shape of the js visual demo's shared grid and of its
 * pagination route, with filters, sorting, hidden columns and (optionally) pages.
 *
 * The filters dropdown helpers — the value list, its search box, "Select all" and "Clear", the
 * condition select and the OK button — come from `FiltersValueListPage`, whose waits already handle
 * the condition input's 10 ms focus timer. What this adds is the column header context menu, the
 * sort indicator, the pagination bar, and reads of what the grid shows.
 */
export class OrdersGridPage extends FiltersValueListPage {
  readonly pagination: OrdersPagination;

  constructor(page: Page, theme = 'main', bundle = 'umd', pagination: OrdersPagination = 'off') {
    super(page, theme, bundle, 'orders-grid.html');
    this.pagination = pagination;
  }

  /**
   * Opens the fixture and waits for the grid to render its first cell.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/orders-grid.html?theme=${this.theme}&bundle=${this.bundle}`
      + `&pagination=${this.pagination}`);
    await awaitBundle(this.page);

    const initError = await this.page.getByTestId('grid').getAttribute('data-init-error');

    if (initError !== null) {
      throw new Error(`The orders fixture failed to build its grid: ${initError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A column header, in the top overlay that takes the pointer.
   *
   * @param {number} column The visual column index.
   * @returns {Locator}
   */
  header(column: number): Locator {
    return this.page.locator('.ht_clone_top').getByTestId(`col-header-${column}`);
  }

  /**
   * The labels of the column headers the grid draws, left to right. A hidden column has no header.
   *
   * @returns {Promise<string[]>}
   */
  async drawnHeaders(): Promise<string[]> {
    return this.page.locator('.ht_clone_top thead th[data-testid^="col-header-"] .colHeader').allInnerTexts();
  }

  /**
   * The visual indexes of the hidden columns, as the HiddenColumns plugin reports them.
   *
   * @returns {Promise<number[]>}
   */
  async hiddenColumns(): Promise<number[]> {
    return this.page.evaluate(() => (window as unknown as OrdersWindow).hot.getPlugin('hiddenColumns')
      .getHiddenColumns());
  }

  /**
   * Opens a column header's context menu and clicks one of its items.
   *
   * @param {number} column The visual column index whose header is right-clicked.
   * @param {string} item The menu item's label.
   */
  async headerContextMenu(column: number, item: string): Promise<void> {
    await this.header(column).click({ button: 'right' });

    const entry = this.page.locator('.htContextMenu').getByRole('menuitem', { name: item, exact: true });

    await expect(entry).toBeVisible();
    await entry.click();
    await expect(this.page.locator('.htContextMenu:visible')).toHaveCount(0);
  }

  /**
   * Narrows a column's value list with its search box and keeps only what it lists: "Clear", the
   * search, "Select all", OK — the visual suite's `filterByValue()` gesture.
   *
   * @param {string} headerLabel The column's header label.
   * @param {string} term The search term.
   * @param {string[]} listed The values the search is expected to list, before "Select all".
   */
  async keepSearchedValues(headerLabel: string, term: string, listed: string[]): Promise<void> {
    await this.openMenu(headerLabel);
    await this.clearAllValues();
    await this.searchValues(term);
    await expect(this.valueLabels).toHaveText(listed);
    await this.selectAllValues();
    await this.confirmMenu();
  }

  /**
   * Filters a column by the "Is between" condition, typing both bounds.
   *
   * @param {string} headerLabel The column's header label.
   * @param {string} from The lower bound.
   * @param {string} to The upper bound.
   */
  async filterBetween(headerLabel: string, from: string, to: string): Promise<void> {
    await this.openMenu(headerLabel);
    await this.selectCondition('Is between');

    const inputs = this.menu.locator('.htFiltersMenuCondition .htUIInput input');

    // Choosing a condition focuses its first input on a 10 ms timer; typing before that hand-off
    // races it.
    await expect(inputs.first()).toBeFocused();
    await inputs.first().fill(from);
    await inputs.nth(1).fill(to);
    await this.confirmMenu();
  }

  /**
   * Clicks a column header's label, which sorts by that column (and selects it), until the header
   * reports the wanted order.
   *
   * @param {number} column The visual column index.
   * @param {'ascending' | 'descending'} order The wanted order.
   */
  async sortBy(column: number, order: 'ascending' | 'descending'): Promise<void> {
    const header = this.header(column);

    await header.locator('.columnSorting').click();

    if (await header.getAttribute('aria-sort') !== order) {
      await header.locator('.columnSorting').click();
    }

    await expect(header).toHaveAttribute('aria-sort', order);
  }

  /**
   * The sort the grid holds.
   *
   * @returns {Promise<Array<{ column: number, sortOrder: string }>>}
   */
  async sortConfig(): Promise<Array<{ column: number, sortOrder: string }>> {
    return this.page.evaluate(() => (window as unknown as OrdersWindow).hot.getPlugin('multiColumnSorting')
      .getSortConfig());
  }

  /**
   * The values of one column in the grid's visual order. Rows a filter took out are not in it;
   * rows on another page are.
   *
   * @param {number} column The visual column index.
   * @returns {Promise<unknown[]>}
   */
  async columnData(column: number): Promise<unknown[]> {
    return this.page.evaluate(c => (window as unknown as OrdersWindow).hot.getDataAtCol(c), column);
  }

  /**
   * The grid's source rows, in their original order and with every column, filtered out or not.
   *
   * @returns {Promise<unknown[][]>}
   */
  async sourceData(): Promise<unknown[][]> {
    return this.page.evaluate(() => (window as unknown as OrdersWindow).hot.getSourceData());
  }

  /**
   * The grid's selection.
   *
   * @returns {Promise<number[][] | undefined>}
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as OrdersWindow).hot.getSelected());
  }

  /**
   * The pagination state and the text of the counter and the page label, read together.
   *
   * @returns {Promise<PageState>}
   */
  async pageState(): Promise<PageState> {
    const data = await this.page.evaluate(() => (window as unknown as OrdersWindow).hot.getPlugin('pagination')
      .getPaginationData());

    return {
      currentPage: data.currentPage,
      totalPages: data.totalPages,
      firstVisibleRowIndex: data.firstVisibleRowIndex,
      lastVisibleRowIndex: data.lastVisibleRowIndex,
      counter: (await this.page.locator('.ht-page-counter-section').innerText()).trim(),
      navigation: (await this.page.locator('.ht-page-navigation-section__label').innerText()).trim(),
    };
  }

  /**
   * Clicks the pagination bar's next or previous page button.
   *
   * @param {'next' | 'prev'} direction Which button.
   */
  async turnPage(direction: 'next' | 'prev'): Promise<void> {
    await this.page.locator(`.ht-page-navigation-section .ht-page-${direction}`).click();
  }
}
