import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the icon-elements fixture (DEV-3003). Every built-in icon site (column
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
}
