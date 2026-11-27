import { type Page, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

/**
 * Page Object for `e2e/license-lock-guard.spec.ts`: the plain grid fixture (`demo/grid.html`), plus a second
 * grid built in the page with or without the test key. The spec drives it on a page the `page` fixture does
 * not guard, so the locked grid it builds on purpose fails only the assertions the spec makes.
 */
export class LicenseLockGuardPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * The fixture URL.
   *
   * @param {string} [license] A `?license=` value, for a page that asks for a license state on purpose.
   * @returns {string}
   */
  url(license?: string): string {
    const query = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    if (license !== undefined) {
      query.set('license', license);
    }

    return `/tests/fixtures/demo/grid.html?${query}`;
  }

  /**
   * Opens the fixture and waits for its keyed grid.
   *
   * @param {string} [license] A `?license=` value, for a page that asks for a license state on purpose.
   */
  async goto(license?: string): Promise<void> {
    await this.page.goto(this.url(license));
    await awaitBundle(this.page);
    await expect(this.page.getByTestId('cell-0-0')).toBeVisible();
  }

  /**
   * Builds a second grid in a container of its own, and returns how many license locks the page shows then.
   *
   * @param {object} options The options.
   * @param {boolean} options.keyed Whether the grid takes the test key.
   * @returns {Promise<number>}
   */
  async buildSecondGrid({ keyed }: { keyed: boolean }): Promise<number> {
    return this.page.evaluate((withKey) => {
      const win = window as unknown as {
        Handsontable: new(element: Element, settings: object) => { destroy(): void };
        htTestLicenseKey: string;
        htSecondGrid: { destroy(): void };
      };
      const container = document.createElement('div');

      document.body.appendChild(container);

      if (withKey) {
        win.htSecondGrid = new win.Handsontable(container, { data: [[1]], licenseKey: win.htTestLicenseKey });
      } else {
        win.htSecondGrid = new win.Handsontable(container, { data: [[1]] });
      }

      return document.getElementsByClassName('ht-license-lock').length;
    }, keyed);
  }

  /**
   * Destroys the second grid, and returns how many license locks the page shows then.
   *
   * @returns {Promise<number>}
   */
  async destroySecondGrid(): Promise<number> {
    return this.page.evaluate(() => {
      (window as unknown as { htSecondGrid: { destroy(): void } }).htSecondGrid.destroy();

      return document.getElementsByClassName('ht-license-lock').length;
    });
  }
}
