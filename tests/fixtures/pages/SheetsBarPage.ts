import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page object for the sheets-bar fixture (fixtures/demo/sheets-bar.html).
 */
export class SheetsBarPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly bar: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.bar = page.getByTestId('sheets-bar');
  }

  async goto(options: { rtl?: boolean } = {}): Promise<void> {
    const rtlParam = options.rtl ? '&rtl=1' : '';
    // A script error on the fixture leaves the page with no test ids at all, which surfaces as
    // an unexplained ten-second timeout on the first locator. Collecting the errors turns that
    // into the actual cause — this suite has seen rare page-load failures whose artifacts
    // carried no page state to explain them.
    const pageErrors: string[] = [];

    this.page.on('pageerror', error => pageErrors.push(error.message));

    await this.page.goto(`/tests/fixtures/demo/sheets-bar.html?theme=${this.theme}&bundle=${this.bundle}${rtlParam}`);

    await expect(
      this.tab(0),
      pageErrors.length > 0 ? `the fixture page threw: ${pageErrors.join(' | ')}` : undefined,
    ).toBeVisible();
  }

  tab(index: number): Locator {
    return this.page.getByTestId(`sheet-tab-${index}`);
  }

  tabByName(name: string): Locator {
    // The tab itself carries the button role now, and its accessible name is the sheet name —
    // the trigger glyph inside it is hidden from the accessibility tree.
    return this.bar.getByRole('button', { name, exact: true });
  }

  chevron(index: number): Locator {
    return this.page.getByTestId(`sheet-tab-chevron-${index}`);
  }

  chevronByName(name: string): Locator {
    return this.tabByName(name).locator('.ht-sheets-bar__tab-chevron');
  }

  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  async clickTab(index: number): Promise<void> {
    await this.tab(index).locator('.ht-sheets-bar__tab-label').click();
  }

  async expectActiveTab(index: number): Promise<void> {
    // The tab is the control, so the state lives on the tab rather than on the label inside it.
    await expect(this.tab(index)).toHaveAttribute('aria-current', 'true');
  }

  async expectCell(row: number, col: number, text: string): Promise<void> {
    await expect(this.cell(row, col)).toHaveText(text);
  }

  menuItem(label: string): Locator {
    return this.page.locator('.htMenu:visible td', { hasText: label }).first();
  }

  get addButton(): Locator {
    return this.page.getByTestId('sheets-bar-add');
  }

  get allButton(): Locator {
    return this.page.getByTestId('sheets-bar-all');
  }

  get renameInput(): Locator {
    return this.page.locator('.ht-sheets-bar__tab-rename');
  }

  get pagePrev(): Locator {
    return this.page.getByTestId('sheets-bar-page-prev');
  }

  get pageNext(): Locator {
    return this.page.getByTestId('sheets-bar-page-next');
  }

  get pagingSection(): Locator {
    return this.page.locator('.ht-sheets-bar__paging');
  }
}
