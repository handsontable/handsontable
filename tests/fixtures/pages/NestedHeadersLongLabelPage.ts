import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * The long group header's label and the collapse indicator beside it, read in one evaluation.
 */
export interface LabelGeometry {
  headerLeft: number;
  headerRight: number;
  labelLeft: number;
  labelRight: number;
  /**
   * The icon the indicator draws (`.collapsibleIndicator__icon`), narrower than the indicator's own
   * hit area.
   */
  iconLeft: number;
  iconRight: number;
  labelScrollWidth: number;
  labelClientWidth: number;
  textOverflow: string;
  whiteSpace: string;
  overflowX: string;
}

/**
 * Page object for `fixtures/demo/nested-headers-long-label.html`, the visual suite's
 * `/nested-headers-demo?longNestedHeaders=true` grid.
 */
export class NestedHeadersLongLabelPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  /**
   * The first group header of the top level, "Product with long text test".
   */
  readonly longGroup: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.longGroup = page.locator('.ht_clone_top thead tr:first-child th').filter({
      has: page.locator('span.colHeader').getByText('Product with long text test', { exact: true }),
    });
  }

  /**
   * Opens the fixture on the demo spec's 1920 x 1080 page.
   */
  async goto(): Promise<void> {
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await this.page.goto(`/tests/fixtures/demo/nested-headers-long-label.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.longGroup).toBeVisible();
  }

  /**
   * The first body cell of the master table.
   *
   * @returns {Locator}
   */
  firstCell(): Locator {
    return this.page.locator('.ht_master .htCore tbody > tr:first-child > td:first-of-type');
  }

  /**
   * The grid's selection, as `getSelected()` returns it.
   *
   * @returns {Promise<number[][] | undefined>}
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as { hot: { getSelected(): number[][] | undefined } })
      .hot.getSelected());
  }

  /**
   * Which of the given physical columns are hidden.
   *
   * @param {number[]} columns Physical column indexes.
   * @returns {Promise<boolean[]>}
   */
  async hidden(columns: number[]): Promise<boolean[]> {
    return this.page.evaluate(cols => cols.map(column => (window as unknown as {
      hot: { columnIndexMapper: { isHidden(index: number): boolean } };
    }).hot.columnIndexMapper.isHidden(column)), columns);
  }

  /**
   * Reads the long group header's label and indicator in one evaluation.
   *
   * @returns {Promise<LabelGeometry>}
   */
  async labelGeometry(): Promise<LabelGeometry> {
    return this.longGroup.evaluate((header) => {
      const label = header.querySelector('span.colHeader') as HTMLElement;
      const icon = header.querySelector('.collapsibleIndicator__icon') as HTMLElement;
      const headerBox = header.getBoundingClientRect();
      const labelBox = label.getBoundingClientRect();
      const iconBox = icon.getBoundingClientRect();
      const style = getComputedStyle(label);

      return {
        headerLeft: headerBox.left,
        headerRight: headerBox.right,
        labelLeft: labelBox.left,
        labelRight: labelBox.right,
        iconLeft: iconBox.left,
        iconRight: iconBox.right,
        labelScrollWidth: label.scrollWidth,
        labelClientWidth: label.clientWidth,
        textOverflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
        overflowX: style.overflowX,
      };
    });
  }
}
