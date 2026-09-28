import { type Page, expect } from '@playwright/test';

export class CssTransformGridPage {
  constructor(
    readonly page: Page,
    readonly theme = 'main',
    readonly bundle = 'umd',
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/css-transform.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await expect(this.page.locator('.ht_master')).toBeVisible();
  }

  async promoteMasterScrollLayer(): Promise<void> {
    await this.page.locator('.ht_master .wtHolder').evaluate((holder) => {
      const element = holder as HTMLElement;

      // Browser compositor promotion is not observable in Chromium CI. A high local stack level
      // deterministically models the failure: it escapes only when `.ht_master` has no stack context.
      element.style.position = 'relative';
      element.style.zIndex = '999';
    });
  }

  async scrollHorizontally(left: number): Promise<void> {
    await this.page.locator('.ht_master .wtHolder').evaluate((holder, scrollLeft) => {
      holder.scrollLeft = scrollLeft;
    }, left);
  }

  async elementAtFrozenPaneCenter(): Promise<'master' | 'frozenOverlay' | 'other'> {
    return this.page.locator('.ht_clone_inline_start').evaluate((pane) => {
      const { left, top, width, height } = pane.getBoundingClientRect();
      const element = document.elementFromPoint(left + (width / 2), top + (height / 2));

      if (element?.closest('[class*="ht_clone_"]')) {
        return 'frozenOverlay';
      }
      if (element?.closest('.ht_master')) {
        return 'master';
      }

      return 'other';
    });
  }
}
