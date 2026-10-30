import { expect, type Locator, type Page } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * The text properties a host `span {}` rule can push into the grid's own spans.
 * Kebab-case, as `toHaveCSS()` and `getPropertyValue()` expect.
 */
export const TEXT_PROPERTIES = ['font-size', 'line-height', 'font-weight', 'letter-spacing', 'font-family'] as const;

export type TextProperty = typeof TEXT_PROPERTIES[number];
export type TextMetrics = Record<TextProperty, string>;

/**
 * The values the fixture's host `span {}` rule sets. Kept here so the spec can prove an expected
 * value differs from the host's before asserting on it (an anti-vacuous guard).
 * Must match the `<style>` block in fixtures/demo/host-span-styles.html.
 */
export const HOST_SPAN_STYLES: TextMetrics = {
  'font-size': '23px',
  'line-height': '41px',
  'font-weight': '700',
  'letter-spacing': '3px',
  'font-family': 'serif',
};

/**
 * Page object for the host-span-styles fixture (fixtures/demo/host-span-styles.html).
 *
 * The fixture styles bare `<span>` elements on the host page. Every locator below points at either
 * a grid span that must resist that rule, or at the non-span ancestor whose computed metrics the
 * span is expected to keep.
 */
export class HostSpanStylesPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  /**
   * A span outside the grid. It must compute the host values; that proves the hostile rule is live.
   */
  readonly hostControl: Locator;

  /**
   * The pagination bar root (a div). Cascade parent of both labels.
   */
  readonly paginationBar: Locator;
  readonly pageSizeLabel: Locator;
  readonly pageNavLabel: Locator;

  /**
   * First multiselect cell (a td). Cascade parent of the chips.
   */
  readonly multiselectCell: Locator;
  readonly arrow: Locator;
  readonly chip: Locator;
  readonly chipLabel: Locator;
  readonly chipRemove: Locator;
  readonly overflow: Locator;

  /**
   * The "Airport" column header th (index 1: index 0 is the row-header corner cell) and the span
   * inside it. Any `span.colHeader` serves the #11306 regression pin; do not "fix" the index.
   */
  readonly columnHeaderCell: Locator;
  readonly columnHeaderSpan: Locator;

  /**
   * The active sheet tab (a div, the cascade parent of its label, chevron and rename field), and
   * the spans and the input inside it. Present only with `goto({ sheetsBar: true })`.
   */
  readonly activeTab: Locator;
  readonly tabLabel: Locator;
  readonly tabChevron: Locator;
  readonly renameInput: Locator;
  readonly renameMirror: Locator;

  /**
   * The all-sheets menu's first row wrapper (a div) and the sheet name span inside it.
   */
  readonly menuItemWrapper: Locator;
  readonly menuItemName: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;

    this.hostControl = page.getByTestId('host-control');

    this.paginationBar = page.locator('.ht-pagination');
    this.pageSizeLabel = this.paginationBar.locator('.ht-page-size-section__label');
    this.pageNavLabel = this.paginationBar.locator('.ht-page-navigation-section__label');

    // `.ht_master` scopes to the main table; the clone overlays render the same cells again.
    this.multiselectCell = page.locator('.ht_master tbody tr').first().locator('td').nth(1);
    this.arrow = this.multiselectCell.locator('.ht-multi-select-arrow');
    this.chip = this.multiselectCell.locator('.ht-multi-select-chip').first();
    this.chipLabel = this.chip.locator('.ht-multi-select-chip-label');
    this.chipRemove = this.chip.locator('.ht-multi-select-chip-remove');
    this.overflow = this.multiselectCell.locator('.ht-multi-select-overflow');

    this.columnHeaderCell = page.locator('.ht_clone_top thead tr').first().locator('th').nth(1);
    this.columnHeaderSpan = this.columnHeaderCell.locator('span.colHeader');

    this.activeTab = page.locator('.ht-sheets-bar__tab--active');
    this.tabLabel = this.activeTab.locator('.ht-sheets-bar__tab-label');
    this.tabChevron = this.activeTab.locator('.ht-sheets-bar__tab-chevron');
    this.renameInput = this.activeTab.locator('.ht-sheets-bar__tab-rename');
    this.renameMirror = this.activeTab.locator('.ht-sheets-bar__tab-rename-mirror');
    this.menuItemWrapper = page.locator('.htSheetsBarMenu .htItemWrapper').first();
    this.menuItemName = this.menuItemWrapper.locator('.ht-sheets-bar__menu-item-name');
  }

  /**
   * Opens the fixture.
   *
   * @param {object} [options] Fixture options.
   * @param {boolean} [options.sheetsBar] Adds the sheets bar to the grid.
   */
  async goto({ sheetsBar = false }: { sheetsBar?: boolean } = {}): Promise<void> {
    const pageErrors: string[] = [];

    this.page.on('pageerror', error => pageErrors.push(error.message));

    const query = sheetsBar ? '&sheetsBar=1' : '';

    await this.page.goto(`/tests/fixtures/demo/host-span-styles.html?theme=${this.theme}&bundle=${this.bundle}${query}`);
    await awaitBundle(this.page);

    const errorMessage = pageErrors.length > 0 ? `the fixture page threw: ${pageErrors.join(' | ')}` : undefined;

    // Fail loud if the fixture's hostile `span {}` rule is not applying: without it every later
    // "span equals parent" assertion would pass with the guard reverted.
    for (const property of TEXT_PROPERTIES) {
      await expect(this.hostControl, errorMessage).toHaveCSS(property, HOST_SPAN_STYLES[property]);
    }

    await expect(this.pageNavLabel, errorMessage).toBeVisible();
    await expect(this.chip, errorMessage).toBeVisible();
    // The overflow indicator only renders when the chips do not fit; its presence pins the fixture
    // geometry (column 200px, four values) so a later width change cannot silently drop it.
    await expect(this.overflow, errorMessage).toBeVisible();
  }

  /**
   * Starts a rename of the active sheet tab with a double click on its label.
   */
  async startRename(): Promise<void> {
    await this.tabLabel.dblclick();
    await expect(this.renameInput).toBeFocused();
  }

  /**
   * Opens the all-sheets menu.
   */
  async openAllSheetsMenu(): Promise<void> {
    await this.page.locator('.ht-sheets-bar__all').click();
    await expect(this.menuItemName).toBeVisible();
  }

  /**
   * Adds a user stylesheet as the first child of `<head>`, ahead of the core and theme stylesheets.
   * A rule that wins from there wins by specificity, not by source order, which is how a user's CSS
   * loaded before the grid behaves in a real app.
   *
   * @param {string} css The rules to add.
   */
  async prependUserStyles(css: string): Promise<void> {
    await this.page.evaluate((content) => {
      const style = document.createElement('style');

      style.textContent = content;
      document.head.prepend(style);
    }, css);
  }

  /**
   * Reads the computed text metrics of one element.
   *
   * @param {Locator} locator The element to read.
   * @returns {Promise<TextMetrics>} Computed values keyed by property name.
   */
  textMetrics(locator: Locator): Promise<TextMetrics> {
    return locator.evaluate((element, properties) => {
      const style = getComputedStyle(element);
      const metrics = {} as Record<string, string>;

      for (const property of properties) {
        metrics[property] = style.getPropertyValue(property);
      }

      return metrics as TextMetrics;
    }, TEXT_PROPERTIES);
  }
}
