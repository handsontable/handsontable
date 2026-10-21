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
      // No `document.body` fallback: the token only resolves inside the themed pagination bar,
      // so a missing bar must throw rather than silently compute to transparent - a transparent
      // token would let an unfixed (also transparent) wrapper match it and pass vacuously.
      const root = document.querySelector('.ht-pagination');

      if (!root) {
        throw new Error('pagination bar (.ht-pagination) not found');
      }

      const probe = document.createElement('div');

      probe.style.backgroundColor = `var(${name})`;
      root.appendChild(probe);

      const resolved = getComputedStyle(probe).backgroundColor;

      probe.remove();

      return resolved;
    }, varName);
  }

  /**
   * Reads the rendered pixel size of the wrapper and the select. The whole fix rests on the two
   * boxes coinciding: only then is a hover anywhere on the wrapper also a hover on the select, so
   * the wrapper `:hover` fill and the select's own `:hover` border/foreground stay in step.
   *
   * @returns {Promise<{ wrapper: [number, number]; select: [number, number] }>} Both box sizes.
   */
  boxDimensions(): Promise<{ wrapper: [number, number]; select: [number, number] }> {
    return this.page.evaluate(() => {
      const wrapper = document.querySelector('.ht-page-size-section__select-wrapper') as HTMLElement;
      const select = wrapper.querySelector('select') as HTMLElement;

      return {
        wrapper: [wrapper.offsetWidth, wrapper.offsetHeight] as [number, number],
        select: [select.offsetWidth, select.offsetHeight] as [number, number],
      };
    });
  }
}
