import { expect, type Locator, type Page } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page object for the pagination page-size select fixture
 * (fixtures/demo/pagination-select.html).
 */
export class PaginationSelectPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly selectWrapper: Locator;
  readonly select: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.selectWrapper = page.locator('.ht-page-size-section__select-wrapper');
    this.select = this.selectWrapper.locator('select[name="pageSize"]');
  }

  async goto(): Promise<void> {
    const pageErrors: string[] = [];

    this.page.on('pageerror', error => pageErrors.push(error.message));

    await this.page.goto(`/tests/fixtures/demo/pagination-select.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);

    await expect(
      this.select,
      pageErrors.length > 0 ? `the fixture page threw: ${pageErrors.join(' | ')}` : undefined,
    ).toBeVisible();
  }

  /**
   * Resolves a theme token (e.g. `--ht-input-background-color`) to the concrete `rgb(...)` string
   * the browser computes for it, in the pagination bar's own cascade context. Reading the token
   * this way keeps the assertions theme-driven (main/horizon/classic, light/dark) with no hardcoded
   * colors.
   *
   * @param {string} varName The CSS custom property name.
   * @returns {Promise<string>} The computed `background-color` a probe painted with that token shows.
   */
  resolveToken(varName: string): Promise<string> {
    return this.page.evaluate((name) => {
      const root = document.querySelector('.ht-pagination') ?? document.body;
      const probe = document.createElement('div');

      probe.style.backgroundColor = `var(${name})`;
      root.appendChild(probe);

      const resolved = getComputedStyle(probe).backgroundColor;

      probe.remove();

      return resolved;
    }, varName);
  }
}
