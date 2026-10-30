import { expect, type Locator, type Page } from '@playwright/test';
import { assertKnownBundle, awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';

/**
 * Page object for fixtures/demo/sheets-bar-bundle-css.html: a sheets bar styled only by the
 * stylesheet the bundle injects, with no linked base stylesheet.
 */
export class SheetsBarBundleCssPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    assertKnownBundle(bundle, '(page, theme, bundle)');
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/sheets-bar-bundle-css.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.tab(0)).toBeVisible();
  }

  tab(index: number): Locator {
    return this.page.getByTestId(`sheet-tab-${index}`);
  }

  /**
   * Counts the stylesheets the page links whose path names the base stylesheet
   * (`styles/handsontable.css` or `styles/handsontable.min.css`).
   *
   * @returns {Promise<number>} The number of such `<link>` elements.
   */
  linkedBaseStylesheets(): Promise<number> {
    return this.page.evaluate(() => document.querySelectorAll('link[href*="/styles/handsontable."]').length);
  }

  /**
   * Reads a tab's computed `-webkit-user-select`. Every engine resolves it: WebKit applies only the
   * prefixed property, and Chromium and Firefox alias it to `user-select`.
   *
   * @param {number} index The tab index.
   * @returns {Promise<string>} The computed value.
   */
  tabUserSelect(index: number): Promise<string> {
    return this.tab(index).evaluate(tab => getComputedStyle(tab).webkitUserSelect);
  }
}
