import { type Locator, type Page } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

/**
 * The slice of the page the evaluate callbacks reach. Not an `interface Window` augmentation:
 * `windowTypes.ts` owns that and declares `hot` with another shape.
 */
interface TeardownWindow {
  buildGrid(settings: Record<string, unknown>): void;
  hot: {
    updateSettings(settings: Record<string, unknown>): void;
    render(): void;
    loadData(data: unknown[][]): void;
    getPlugin(name: string): {
      selectRows?(rows: number[]): boolean;
      setActiveSheet?(name: string): boolean;
    };
  };
}

/**
 * Rows of three text cells, `<prefix>A0`, `<prefix>B0`, `<prefix>C0` and so on.
 *
 * @param {number} rowCount The number of rows.
 * @param {string} prefix The text every cell starts with, so two sheets hold different values.
 * @returns {string[][]}
 */
export function textRows(rowCount: number, prefix = ''): string[][] {
  return Array.from({ length: rowCount }, (_, row) => [`${prefix}A${row}`, `${prefix}B${row}`, `${prefix}C${row}`]);
}

/**
 * Page object for the plugin-ui-teardown fixture (fixtures/demo/plugin-ui-teardown.html): an empty
 * page with the bundle loaded, where each test builds its own grid, then turns plugins on and off on
 * that grid or switches the sheets of a workbook, and reads back the UI the plugins drew. Every page
 * error is collected, so a call that throws fails the test that made it.
 */
export class PluginUiTeardownPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  async goto(): Promise<void> {
    this.page.on('pageerror', error => this.pageErrors.push(error.message));

    await this.page.goto(`/tests/fixtures/demo/plugin-ui-teardown.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
  }

  /**
   * The grid's container.
   */
  grid(): Locator {
    return this.page.getByTestId('grid');
  }

  /**
   * Builds the grid with row and column headers and the given settings.
   */
  async build(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(gridSettings => (window as unknown as TeardownWindow).buildGrid(gridSettings), settings);
  }

  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(
      newSettings => (window as unknown as TeardownWindow).hot.updateSettings(newSettings),
      settings,
    );
  }

  async render(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as TeardownWindow).hot.render());
  }

  async loadData(data: unknown[][]): Promise<void> {
    await this.page.evaluate(rows => (window as unknown as TeardownWindow).hot.loadData(rows), data);
  }

  /**
   * Ticks the RowSelection checkboxes of the given visual rows through the API.
   */
  async selectRows(rows: number[]): Promise<void> {
    await this.page.evaluate(
      visualRows => (window as unknown as TeardownWindow).hot.getPlugin('rowSelection').selectRows!(visualRows),
      rows,
    );
  }

  /**
   * Switches the sheets bar to the named sheet through the API and answers what
   * `setActiveSheet()` returned.
   */
  setActiveSheet(name: string): Promise<boolean> {
    return this.page.evaluate(
      sheetName => (window as unknown as TeardownWindow).hot.getPlugin('sheetsBar').setActiveSheet!(sheetName),
      name,
    );
  }

  /**
   * The first data cell drawn in the master table.
   */
  firstCell(): Locator {
    return this.grid().locator('.ht_master tbody td').first();
  }

  /**
   * Every checkbox input inside the grid, header checkboxes included.
   */
  checkboxes(): Locator {
    return this.grid().locator('input[type="checkbox"]');
  }

  /**
   * The ticked checkbox inputs inside the grid.
   */
  checkedCheckboxes(): Locator {
    return this.grid().locator('input[type="checkbox"]:checked');
  }

  /**
   * For each of the first `rowCount` rows of the row header clone, the row numbers its header cells
   * show (one per `.rowHeader` label), and whether a header cell of that row holds a checkbox.
   */
  rowHeaders(rowCount: number): Promise<Array<{ labels: string[], checkbox: boolean }>> {
    return this.grid().evaluate((root, count) => {
      const rows = Array.from(root.querySelectorAll('.ht_clone_inline_start tbody tr')).slice(0, count);

      return rows.map(row => ({
        labels: Array.from(row.querySelectorAll('th .rowHeader')).map(label => label.textContent ?? ''),
        checkbox: row.querySelector('th input[type="checkbox"]') !== null,
      }));
    }, rowCount);
  }

  /**
   * For each bottom column header of the top clone that holds a DropdownMenu button, the value of its
   * `aria-haspopup` attribute (`null` when it has none).
   */
  dropdownHeaderPopups(): Promise<Array<string | null>> {
    return this.grid().evaluate((root) => {
      const headerRow = root.querySelector('.ht_clone_top thead tr:last-child');

      return Array.from(headerRow?.querySelectorAll('th') ?? [])
        .filter(header => header.querySelector('.changeType') !== null)
        .map(header => header.getAttribute('aria-haspopup'));
    });
  }

  /**
   * The grid's root wrapper, which Pagination marks with `htPagination` while it shows its bar.
   */
  rootWrapper(): Locator {
    return this.grid().locator('.ht-wrapper').first();
  }

  /**
   * The pagination bar.
   */
  paginationBar(): Locator {
    return this.grid().locator('.ht-pagination');
  }
}
