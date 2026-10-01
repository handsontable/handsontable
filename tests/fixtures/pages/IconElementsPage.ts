import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the icon-elements fixture. Every built-in icon site (column
 * sorting, hidden columns/rows, the dropdown menu button, the filters select and radio, the
 * select editor, pagination, sheets bar, multi-select, notifications, and more) now renders a
 * real `<i class="ht-icon ht-icon-<name>">` element, so `icon()` below finds it. Extend this
 * page object for a new icon site instead of re-deriving the selector.
 */
export class IconElementsPage {
  constructor(readonly page: Page, readonly theme = 'main', readonly bundle = 'umd') {}

  /**
   * Opens the fixture and waits for the bundle and the grid to be visible.
   */
  async goto(
    query: {
      dir?: 'rtl';
      pageDir?: 'rtl' | 'ltr';
      icons?: 'tabler';
      sheetsBar?: boolean;
      nestedHeaders?: boolean;
      nestedRows?: boolean;
      hiddenColumns?: boolean;
      hiddenRows?: boolean;
      selectEditor?: boolean;
      multiSelect?: boolean;
      notification?: boolean;
      noIcons?: boolean;
    } = {}
  ): Promise<void> {
    const booleanParams = [
      'sheetsBar', 'nestedHeaders', 'nestedRows', 'hiddenColumns', 'hiddenRows', 'selectEditor',
      'multiSelect', 'notification', 'noIcons',
    ];
    const extra = Object.entries(query)
      .map(([k, v]) => `&${k}=${booleanParams.includes(k) ? (v ? '1' : '0') : v}`)
      .join('');

    await this.page.goto(`/tests/fixtures/demo/icon-elements.html?theme=${this.theme}&bundle=${this.bundle}${extra}`);
    await awaitBundle(this.page);
    await expect(this.grid()).toBeVisible();
  }

  /**
   * Returns the grid root through its fixture-owned test id.
   */
  grid(): Locator {
    return this.page.getByTestId('grid');
  }

  /**
   * Returns the icon element for a given icon name, scoped to `within` (defaults to the whole page).
   */
  icon(name: string, within: Locator = this.page.locator('body')): Locator {
    return within.locator(`.ht-icon.ht-icon-${name}`);
  }

  /**
   * Reads a `--ht-icon-<name>` custom property off the grid element.
   */
  async cssVariable(name: string): Promise<string> {
    return this.grid().evaluate((el, n) => getComputedStyle(el).getPropertyValue(n).trim(), `--ht-icon-${name}`);
  }

  /**
   * Reads the resolved `mask-image` (or its `-webkit-` prefixed form) off a locator.
   */
  async maskImage(locator: Locator): Promise<string> {
    return locator.evaluate(el => getComputedStyle(el).getPropertyValue('mask-image') || getComputedStyle(el).getPropertyValue('-webkit-mask-image'));
  }

  /**
   * Reads the resolved `transform` off a locator.
   */
  async transform(locator: Locator): Promise<string> {
    return locator.evaluate(el => getComputedStyle(el).transform);
  }

  /**
   * Reads the resolved `background-color` off a locator.
   */
  async backgroundColor(locator: Locator): Promise<string> {
    return locator.evaluate(el => getComputedStyle(el).backgroundColor);
  }

  /**
   * Returns a first-level column header in the top overlay clone. The fixture has
   * `rowHeaders: true`, so the corner `th` comes first and is skipped.
   */
  sortHeader(visualColumn: number): Locator {
    return this.page.locator('.ht_clone_top thead tr:last-child th').nth(visualColumn + 1);
  }

  /**
   * Calls `updateSettings()` on the fixture's grid.
   */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate((s) => {
      (window as unknown as { hot: any }).hot.updateSettings(s);
    }, settings);
  }

  /**
   * Sorts through the plugin API (`columnSorting` or `multiColumnSorting`), bypassing the header
   * click gate.
   */
  async sortThroughApi(
    pluginName: 'columnSorting' | 'multiColumnSorting',
    config: { column: number; sortOrder: 'asc' | 'desc' } | { column: number; sortOrder: 'asc' | 'desc' }[],
  ): Promise<void> {
    await this.page.evaluate(({ name, cfg }) => {
      (window as unknown as { hot: any }).hot.getPlugin(name).sort(cfg);
    }, { name: pluginName, cfg: config });
  }

  /**
   * Reads the sort order of a column from the plugin (`undefined` when unsorted).
   */
  async sortOrder(pluginName: 'columnSorting' | 'multiColumnSorting', column: number): Promise<string | undefined> {
    return this.page.evaluate(({ name, col }) => {
      return (window as unknown as { hot: any }).hot.getPlugin(name).getSortConfig(col)?.sortOrder;
    }, { name: pluginName, col: column });
  }

  /**
   * Builds an offscreen `.htGhostTable` header the way `AutoColumnSize` does, for each label class
   * list given, and reads the `*` stand-in pseudo-element's computed box. Also measures a plain
   * inline-block `*` in the same header, which is what the stand-in measures without an explicit
   * width. Everything is read in one evaluation and the probe is removed before returning.
   */
  async ghostSortReserve(labelClasses: string[]): Promise<{
    iconSize: number;
    starWidth: number;
    labels: { content: string; width: number; paddingInlineEnd: number }[];
  }> {
    return this.page.evaluate((classLists) => {
      const hot = (window as unknown as { hot: any }).hot;
      const ghost = document.createElement('div');

      ghost.className = `htGhostTable htAutoSize ${hot.rootElement.className}`;
      ghost.innerHTML = '<table class="htCore"><thead><tr>'
        + classLists.map(c => `<th><div class="relative"><span class="${c}">A</span></div></th>`).join('')
        + '<th class="star-probe"><div class="relative"><span class="colHeader"><span class="star" '
        + 'style="display: inline-block">*</span></span></div></th>'
        + '</tr></thead></table>';
      hot.rootElement.appendChild(ghost);

      const labels = Array.from(ghost.querySelectorAll('th:not(.star-probe) > .relative > span'))
        .map((label) => {
          const before = getComputedStyle(label, '::before');

          return {
            content: before.content,
            width: parseFloat(before.width),
            paddingInlineEnd: parseFloat(before.paddingInlineEnd),
          };
        });
      const star = ghost.querySelector('.star') as HTMLElement;
      const result = {
        iconSize: parseFloat(getComputedStyle(star).getPropertyValue('--ht-icon-size')),
        starWidth: star.getBoundingClientRect().width,
        labels,
      };

      ghost.remove();

      return result;
    }, labelClasses);
  }

  /**
   * Recalculates and reads the `AutoColumnSize` widths of the given visual columns.
   */
  async autoColumnWidths(columns: number[]): Promise<number[]> {
    return this.page.evaluate((cols) => {
      const plugin = (window as unknown as { hot: any }).hot.getPlugin('autoColumnSize');

      plugin.recalculateAllColumnsWidth();

      return cols.map(c => plugin.getColumnWidth(c));
    }, columns);
  }

  /**
   * Taps the center of the sort indicator in a column header with a finger-sized touch point.
   *
   * `page.touchscreen.tap()` sends a touch point with no radius, and Blink's touch adjustment
   * (which retargets a tap to the nearest tappable node inside the touch area) then has no area
   * to search. A real finger has one, so the tap goes through CDP with a radius instead
   * (Chromium only - every project in this suite is Chromium).
   */
  async tapSortIndicator(visualColumn: number, radius = 12): Promise<void> {
    const box = await this.sortHeader(visualColumn).locator('.ht-sort-indicator').boundingBox();

    if (box === null) {
      throw new Error(`Column ${visualColumn} has no rendered sort indicator to tap.`);
    }

    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2, radiusX: radius, radiusY: radius };
    const cdp = await this.page.context().newCDPSession(this.page);

    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach();
  }
}
