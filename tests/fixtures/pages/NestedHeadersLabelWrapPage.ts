import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * The group header and the headers around it, read in one evaluation.
 */
export interface GroupHeaderGeometry {
  /**
   * The rendered width of the group header (`colspan: 4`).
   */
  groupWidth: number;
  /**
   * The sum of the widths of the visible columns the first group spans, as the grid reports them.
   */
  spannedColumnsWidth: number;
  /**
   * How many of the columns the first group spans are visible.
   */
  visibleSpannedColumns: number;
  /**
   * How many lines the group label takes: its height over its computed line height.
   */
  labelLines: number;
  /**
   * The height of the group header cell, border included.
   */
  groupHeaderHeight: number;
  /**
   * The height of the group header's content box (`div.relative`, which carries the padding).
   */
  groupContentHeight: number;
  /**
   * The group header cell's own top and bottom borders, in px.
   */
  groupBorders: number;
  /**
   * The same two heights for a one-line header of the bottom level, which sets the cell's own chrome
   * (borders) for this theme.
   */
  bottomHeaderHeight: number;
  bottomContentHeight: number;
  /**
   * The line height of the group label, in px.
   */
  lineHeight: number;
}

/**
 * Page object for `fixtures/demo/nested-headers-label-wrap.html`: a 60-character group label over four
 * 80px columns, with or without the CSS that lets header labels wrap.
 */
export class NestedHeadersLabelWrapPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  /**
   * The first group header of the top level, in the top overlay that draws the headers.
   */
  readonly groupHeader: Locator;
  /**
   * How many columns the first group spans in the loaded fixture.
   */
  #groupColspan = 4;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.groupHeader = page.locator('.ht_clone_top thead tr:first-child th[colspan]').first();
  }

  /**
   * Opens the fixture.
   *
   * @param {object} options The fixture's switches.
   * @param {boolean} options.wrap Adds `white-space: normal` to the header labels.
   * @param {boolean} [options.autoRowSize] Turns on AutoRowSize.
   * @param {boolean} [options.hideColumn] Hides the group's second column.
   * @param {boolean} [options.wide] 32 columns in groups of four, with repeating bottom labels.
   */
  async goto({ wrap, autoRowSize = false, hideColumn = false, wide = false }: {
    wrap: boolean, autoRowSize?: boolean, hideColumn?: boolean, wide?: boolean,
  }): Promise<void> {
    this.#groupColspan = wide ? 8 : 4;
    await this.page.goto('/tests/fixtures/demo/nested-headers-label-wrap.html' +
      `?theme=${this.theme}&bundle=${this.bundle}&wrap=${wrap}&autoRowSize=${autoRowSize}` +
      `&hideColumn=${hideColumn}&wide=${wide}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.groupHeader).toBeVisible();
  }

  /**
   * Re-applies the settings and renders, the full render that re-measures the header heights.
   */
  async updateSettingsAndRender(): Promise<void> {
    await this.page.evaluate(() => {
      const { hot } = window as unknown as {
        hot: { updateSettings(settings: object): void; render(): void };
      };

      hot.updateSettings({ colHeaders: true });
      hot.render();
    });
  }

  /**
   * Loads a new copy of the fixture's data.
   */
  async reloadData(): Promise<void> {
    await this.page.evaluate(() => {
      const { hot, htFixtureData } = window as unknown as {
        hot: { loadData(data: unknown[][]): void };
        htFixtureData(): unknown[][];
      };

      hot.loadData(htFixtureData());
    });
  }

  /**
   * Reads the group header, its label and a bottom-level header in one evaluation.
   *
   * @returns {Promise<GroupHeaderGeometry>}
   */
  async geometry(): Promise<GroupHeaderGeometry> {
    return this.page.evaluate((groupColspan) => {
      const { hot } = window as unknown as {
        hot: {
          getColWidth(column: number): number;
          toPhysicalColumn(column: number): number;
          columnIndexMapper: { isHidden(physicalColumn: number): boolean };
        };
      };
      const spannedColumns = Array.from({ length: groupColspan }, (_, column) => column)
        .filter(column => !hot.columnIndexMapper.isHidden(hot.toPhysicalColumn(column)));
      // The top clone draws the headers the user sees; the master's copy sits under it.
      const head = document.querySelector('.ht_clone_top thead') as HTMLElement;
      const group = head.querySelector('tr:first-child th[colspan]') as HTMLElement;
      const label = group.querySelector('span.colHeader') as HTMLElement;
      const bottom = head.querySelector('tr:last-child th:last-child') as HTMLElement;
      const lineHeight = Number.parseFloat(getComputedStyle(label).lineHeight);
      const groupStyle = getComputedStyle(group);

      return {
        groupWidth: group.getBoundingClientRect().width,
        spannedColumnsWidth: spannedColumns.reduce((sum, column) => sum + hot.getColWidth(column), 0),
        visibleSpannedColumns: spannedColumns.length,
        labelLines: Math.round(label.getBoundingClientRect().height / lineHeight),
        groupHeaderHeight: group.getBoundingClientRect().height,
        groupContentHeight: (group.querySelector('div.relative') as HTMLElement).getBoundingClientRect().height,
        groupBorders: Number.parseFloat(groupStyle.borderTopWidth) + Number.parseFloat(groupStyle.borderBottomWidth),
        bottomHeaderHeight: bottom.getBoundingClientRect().height,
        bottomContentHeight: (bottom.querySelector('div.relative') as HTMLElement).getBoundingClientRect().height,
        lineHeight,
      };
    }, this.#groupColspan);
  }
}
