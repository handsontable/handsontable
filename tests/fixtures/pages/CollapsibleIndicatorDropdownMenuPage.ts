import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the collapsible-indicator-dropdown-menu fixture (DEV-214): one collapsible
 * nested-header group ("B", four columns wide) on a grid with the dropdown menu enabled.
 */
export class CollapsibleIndicatorDropdownMenuPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate and wait for the collapsible indicator to render (a real DOM condition, no sleep).
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/collapsible-indicator-dropdown-menu.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await expect(this.indicator()).toBeVisible();
  }

  /** The group's collapse/expand indicator, in the top overlay that owns the header rows. */
  indicator(): Locator {
    return this.page.locator('.ht_clone_top .collapsibleIndicator');
  }

  /** The dropdown button of the second-level header "b" (a column inside the group). */
  columnMenuButton(): Locator {
    return this.page.locator('.ht_clone_top thead tr').nth(1).locator('th').nth(1).locator('.changeType');
  }

  /** The dropdown menu, only while it is on screen. */
  openMenu(): Locator {
    return this.page.locator('.htDropdownMenu:visible');
  }

  async openColumnMenu(): Promise<void> {
    await this.columnMenuButton().click();
    await expect(this.openMenu()).toBeVisible();
  }

  /** Click the indicator like a user: a real pointer press, not a dispatched event. */
  async clickIndicator(): Promise<void> {
    await this.indicator().click();
  }

  async expectCollapsed(): Promise<void> {
    await expect(this.indicator()).toHaveClass(/\bcollapsed\b/);
  }

  async expectExpanded(): Promise<void> {
    await expect(this.indicator()).toHaveClass(/\bexpanded\b/);
  }

  /** The current selection as [rowStart, colStart, rowEnd, colEnd] ranges. */
  async selection(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as any).hot.getSelected());
  }
}
