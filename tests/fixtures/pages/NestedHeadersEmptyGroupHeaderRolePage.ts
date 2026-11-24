import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

/**
 * A header row of `nestedHeaders`, one entry per header cell: a label or a group object.
 */
export type NestedHeaderRow = Array<string | { label: string, colspan?: number, rowspan?: number }>;

/**
 * Page Object for the nested headers fixture whose group row is shorter than the column count
 * (`nested-headers-empty-group-header-role.html`).
 *
 * Column headers are painted in the top overlay (`.ht_clone_top`) and again in the master table, so
 * every header locator is scoped to the overlay, the copy a user sees and a screen reader reads.
 */
export class NestedHeadersEmptyGroupHeaderRolePage {
  static readonly LEAF_ROW: NestedHeaderRow = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9'];

  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate to the fixture and wait for the header overlay to render.
   *
   * @param options.aria `off` builds the grid with `ariaTags: false`.
   */
  async goto(options: { aria?: 'on' | 'off' } = {}): Promise<void> {
    const query = `theme=${this.theme}&bundle=${this.bundle}&aria=${options.aria ?? 'on'}`;

    await this.page.goto(`/tests/fixtures/demo/nested-headers-empty-group-header-role.html?${query}`);
    await awaitBundle(this.page);

    const buildError = await this.page.evaluate(() => window.htBuildError ?? null);

    if (buildError) {
      throw new Error(`The fixture grid failed to build: ${buildError}`);
    }

    await expect(this.header(1, 9)).toHaveText('L9');
  }

  /**
   * The top header overlay, the copy of the headers a user sees.
   */
  headerOverlay(): Locator {
    return this.page.getByTestId('grid').locator('.ht_clone_top thead');
  }

  /**
   * The visible copy of a column header.
   *
   * @param level The header level, 0 is the top one.
   * @param column The visual index of the header's first column.
   */
  header(level: number, column: number): Locator {
    return this.headerOverlay().getByTestId(`col-header-${level}-${column}`);
  }

  /**
   * Every element the accessibility tree exposes as a column header in the top overlay.
   */
  columnHeaders(): Locator {
    return this.headerOverlay().getByRole('columnheader');
  }

  /**
   * The column headers of the top overlay that a screen reader would read with no name.
   */
  namelessColumnHeaders(): Locator {
    return this.columnHeaders().filter({ hasNotText: /\S/ });
  }

  /**
   * Replace the header rows through `updateSettings()`, which redraws the headers before it returns.
   * The `th` elements are recycled, so a header that had no label before can carry one after.
   *
   * @param topRow The new top header row; the bottom row stays `LEAF_ROW`.
   */
  async setTopHeaderRow(topRow: NestedHeaderRow): Promise<void> {
    await this.setHeaderRows([topRow, NestedHeadersEmptyGroupHeaderRolePage.LEAF_ROW]);
  }

  /**
   * Replace every header row through `updateSettings()`, which redraws the headers before it returns.
   *
   * @param rows The new `nestedHeaders` rows, top first.
   */
  async setHeaderRows(rows: NestedHeaderRow[]): Promise<void> {
    await this.page.evaluate(nestedHeaders => window.hot.updateSettings({ nestedHeaders }), rows);
  }
}
