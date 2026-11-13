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
 * The box the fixture's host rules give bare `<span>` and `<input>` elements. Must match the
 * `<style id="host-element-styles">` block in fixtures/demo/host-span-styles.html.
 */
export const HOST_BOX_STYLES = {
  span: { 'padding-top': '12px', 'margin-top': '3px', 'border-top-width': '2px' },
  input: { 'padding-top': '10px', 'margin-top': '3px', 'border-top-width': '2px', height: '40px' },
} as const;

/**
 * The box the fixture's three-element host rules (`table th span`, `body div input`) give the spans
 * and inputs they reach. They outrank an element-level guard of two elements. Must match the
 * `<style id="host-element-styles">` block in fixtures/demo/host-span-styles.html.
 */
export const HOST_DEEP_BOX_STYLES = {
  span: { 'padding-top': '6px', 'margin-top': '4px' },
  input: { 'padding-top': '7px', 'margin-top': '4px', height: '36px' },
} as const;

/**
 * The computed properties a host element rule can push into the grid's own spans and inputs, read
 * by `HostSpanStylesPage#boxMetrics()`.
 */
export const BOX_PROPERTIES = [
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'height', 'line-height', 'font-size', 'font-weight', 'letter-spacing', 'font-family',
] as const;

/**
 * The size and position of one element, plus its computed `BOX_PROPERTIES`. The position is
 * relative to the element's `.handsontable` root, so a menu that opens a few pixels lower does not
 * hide or fake a difference inside it.
 */
export type BoxMetrics = Record<string, string | number>;

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
   * An input outside the grid. It must take the host box rule; that proves the input rule is live.
   */
  readonly hostInputControl: Locator;

  /**
   * A span in a `th` and an input in a `div`, both outside the grid. They must take the
   * three-element host rules; that proves those rules are live.
   */
  readonly hostThSpanControl: Locator;
  readonly hostDivInputControl: Locator;

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
   * The corner header cell and its span, and the first row's header cell, header span, and data cell.
   */
  readonly cornerHeaderCell: Locator;
  readonly cornerHeaderSpan: Locator;
  readonly rowHeaderCell: Locator;
  readonly rowHeaderSpan: Locator;
  readonly firstDataCell: Locator;

  /**
   * The column dropdown menu (present only with `goto({ menus: true })`), its check marks, and the
   * Filters controls inside it.
   */
  readonly dropdownMenu: Locator;
  readonly checkMark: Locator;
  readonly checkMarkIcon: Locator;
  readonly mixedMark: Locator;
  readonly mixedMarkIcon: Locator;
  readonly conditionCaptionLabel: Locator;
  readonly conditionInput: Locator;
  readonly operatorRadio: Locator;
  readonly valueSearchInput: Locator;
  readonly valueCheckboxLabel: Locator;
  readonly valueCheckboxText: Locator;
  readonly valueCheckboxBox: Locator;
  readonly valueCheckboxInput: Locator;
  readonly okButton: Locator;
  readonly cancelButton: Locator;

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

  /**
   * The NestedRows grid (present only with `goto({ nestedRows: true })`): the header cell of its
   * second-level child row, the level spacers and label inside it, and the row's data cell.
   */
  readonly nestedGrid: Locator;
  readonly nestedChildHeaderCell: Locator;
  readonly nestedLevelSpacer: Locator;
  readonly nestedChildHeaderSpan: Locator;
  readonly nestedChildDataCell: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;

    this.hostControl = page.getByTestId('host-control');
    this.hostInputControl = page.getByTestId('host-input-control');
    this.hostThSpanControl = page.getByTestId('host-th-span-control');
    this.hostDivInputControl = page.getByTestId('host-div-input-control');

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

    this.cornerHeaderCell = page.locator('.ht_clone_top_inline_start_corner thead th').first();
    this.cornerHeaderSpan = this.cornerHeaderCell.locator('span.cornerHeader');
    this.rowHeaderCell = page.locator('.ht_clone_inline_start tbody tr').first().locator('th');
    this.rowHeaderSpan = this.rowHeaderCell.locator('span.rowHeader');
    this.firstDataCell = page.locator('.ht_master tbody tr').first().locator('td').first();

    this.dropdownMenu = page.locator('.htDropdownMenu[role="menu"]');
    this.checkMark = this.dropdownMenu.locator('.htItemWrapper > span.selected');
    this.checkMarkIcon = this.checkMark.locator('.ht-icon');
    this.mixedMark = this.dropdownMenu.locator('.htItemWrapper > span.htMixed');
    this.mixedMarkIcon = this.mixedMark.locator('.ht-icon');
    this.conditionCaptionLabel = this.dropdownMenu.locator('.htFiltersMenuCondition .htUISelectCaptionLabel').first();
    this.conditionInput = this.dropdownMenu.locator('.htFiltersMenuCondition .htUIInput input').first();
    this.operatorRadio = this.dropdownMenu.locator('.htFiltersMenuOperators input[type="radio"]').first();
    this.valueSearchInput = this.dropdownMenu.locator('.htUIMultipleSelectSearch input');
    this.valueCheckboxLabel = this.dropdownMenu
      .locator('.htUIMultipleSelect .ht_master .htCheckboxRendererLabel').first();
    this.valueCheckboxText = this.valueCheckboxLabel.locator('> span:not(.htCheckboxRendererBox)');
    this.valueCheckboxBox = this.valueCheckboxLabel.locator('.htCheckboxRendererBox');
    this.valueCheckboxInput = this.valueCheckboxLabel.locator('.htCheckboxRendererInput');
    this.okButton = this.dropdownMenu.locator('.htUIButtonOK input');
    this.cancelButton = this.dropdownMenu.locator('.htUIButtonCancel input');

    this.activeTab = page.locator('.ht-sheets-bar__tab--active');
    this.tabLabel = this.activeTab.locator('.ht-sheets-bar__tab-label');
    this.tabChevron = this.activeTab.locator('.ht-sheets-bar__tab-chevron');
    this.renameInput = this.activeTab.locator('.ht-sheets-bar__tab-rename');
    this.renameMirror = this.activeTab.locator('.ht-sheets-bar__tab-rename-mirror');
    this.menuItemWrapper = page.locator('.htSheetsBarMenu .htItemWrapper').first();
    this.menuItemName = this.menuItemWrapper.locator('.ht-sheets-bar__menu-item-name');

    this.nestedGrid = page.getByTestId('nested-grid');
    this.nestedChildHeaderCell = this.nestedGrid.locator('.ht_clone_inline_start tbody tr').nth(2).locator('th');
    this.nestedLevelSpacer = this.nestedChildHeaderCell.locator('span.ht_nestingLevel_empty');
    this.nestedChildHeaderSpan = this.nestedChildHeaderCell.locator('span.rowHeader');
    this.nestedChildDataCell = this.nestedGrid.locator('.ht_master tbody tr').nth(2).locator('td').first();
  }

  /**
   * Opens the fixture.
   *
   * @param {object} [options] Fixture options.
   * @param {boolean} [options.sheetsBar] Adds the sheets bar to the grid.
   * @param {boolean} [options.menus] Adds Filters and a dropdown menu with a checked and a mixed item.
   * @param {boolean} [options.nestedRows] Adds a second grid with NestedRows and three row levels.
   * @param {boolean} [options.withoutHostStyles] Removes the host element rules before the grid is
   * built, for the clean render a hostile one is compared with.
   */
  async goto({ sheetsBar = false, menus = false, nestedRows = false, withoutHostStyles = false }: {
    sheetsBar?: boolean;
    menus?: boolean;
    nestedRows?: boolean;
    withoutHostStyles?: boolean;
  } = {}): Promise<void> {
    const pageErrors: string[] = [];

    this.page.on('pageerror', error => pageErrors.push(error.message));

    const query = [
      sheetsBar ? '&sheetsBar=1' : '',
      menus ? '&menus=1' : '',
      nestedRows ? '&nestedRows=1' : '',
      withoutHostStyles ? '&withoutHostStyles=1' : '',
    ].join('');

    await this.page.goto(`/tests/fixtures/demo/host-span-styles.html?theme=${this.theme}&bundle=${this.bundle}${query}`);
    await awaitBundle(this.page);

    const errorMessage = pageErrors.length > 0 ? `the fixture page threw: ${pageErrors.join(' | ')}` : undefined;

    if (withoutHostStyles) {
      await expect(this.hostControl, errorMessage).not.toHaveCSS('font-size', HOST_SPAN_STYLES['font-size']);
      await expect(this.hostInputControl, errorMessage).not.toHaveCSS('height', HOST_BOX_STYLES.input.height);
      await expect(this.hostThSpanControl, errorMessage)
        .not.toHaveCSS('padding-top', HOST_DEEP_BOX_STYLES.span['padding-top']);
      await expect(this.hostDivInputControl, errorMessage).not.toHaveCSS('height', HOST_DEEP_BOX_STYLES.input.height);
    } else {
      // Fail loud if the fixture's hostile rules are not applying: without them every later
      // "span equals parent" or "clean equals hostile" assertion would pass with the guard reverted.
      for (const property of TEXT_PROPERTIES) {
        await expect(this.hostControl, errorMessage).toHaveCSS(property, HOST_SPAN_STYLES[property]);
      }

      for (const [property, value] of Object.entries(HOST_BOX_STYLES.span)) {
        await expect(this.hostControl, errorMessage).toHaveCSS(property, value);
      }

      for (const [property, value] of Object.entries(HOST_BOX_STYLES.input)) {
        await expect(this.hostInputControl, errorMessage).toHaveCSS(property, value);
      }

      for (const [property, value] of Object.entries(HOST_DEEP_BOX_STYLES.span)) {
        await expect(this.hostThSpanControl, errorMessage).toHaveCSS(property, value);
      }

      for (const [property, value] of Object.entries(HOST_DEEP_BOX_STYLES.input)) {
        await expect(this.hostDivInputControl, errorMessage).toHaveCSS(property, value);
      }
    }

    await expect(this.pageNavLabel, errorMessage).toBeVisible();
    await expect(this.chip, errorMessage).toBeVisible();
    // The overflow indicator only renders when the chips do not fit; its presence pins the fixture
    // geometry (column 200px, four values) so a later width change cannot silently drop it.
    await expect(this.overflow, errorMessage).toBeVisible();

    if (nestedRows) {
      await expect(this.nestedLevelSpacer, errorMessage).toHaveCount(2);
    }
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
   * Opens a column's dropdown menu, with the Filters controls in it.
   *
   * @param {string} [label] The column header's label.
   */
  async openColumnMenu(label = 'Airport'): Promise<void> {
    const headerCell = this.page.locator('.ht_clone_top thead tr').first().locator('th')
      .filter({ has: this.page.locator('span.colHeader').getByText(label, { exact: true }) });

    await headerCell.locator('.changeType').click();
    await expect(this.dropdownMenu).toBeVisible();
    await expect(this.okButton).toBeVisible();
    await expect(this.valueCheckboxInput).toBeAttached();
  }

  /**
   * Picks a condition in the first "Filter by condition" select, which shows its value input and
   * the and/or radios.
   *
   * @param {string} name The condition's menu label.
   */
  async chooseCondition(name: string): Promise<void> {
    await this.conditionCaptionLabel.click();

    const conditionsMenu = this.page.locator('.htFiltersConditionsMenu[role="menu"]');

    await conditionsMenu.getByRole('menuitem', { name, exact: true }).click();
    await expect(conditionsMenu).toBeHidden();
    await expect(this.conditionCaptionLabel).toHaveText(name);
    await expect(this.conditionInput).toBeVisible();
    await expect(this.operatorRadio).toBeVisible();
  }

  /**
   * Reads the size, the position inside the element's `.handsontable` root, and the computed
   * `BOX_PROPERTIES` of several elements, keyed by the caller's names. All of them are read in one
   * evaluation, so no render can land between two reads.
   *
   * @param {Record<string, Locator>} locators The elements to read.
   * @returns {Promise<Record<string, BoxMetrics>>} The metrics keyed by the same names.
   */
  async boxMetrics(locators: Record<string, Locator>): Promise<Record<string, BoxMetrics>> {
    const handles = await Promise.all(Object.values(locators).map(locator => locator.elementHandle()));

    const metrics = await this.page.evaluate(([elements, properties]) => elements.map((element) => {
      if (!element) {
        return null;
      }

      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const rootRect = (element.closest('.handsontable') ?? document.body).getBoundingClientRect();
      const result: Record<string, string | number> = {
        x: rect.x - rootRect.x,
        y: rect.y - rootRect.y,
        width: rect.width,
        renderedHeight: rect.height,
      };

      for (const property of properties) {
        result[property] = style.getPropertyValue(property);
      }

      return result;
    }), [handles, BOX_PROPERTIES] as const);

    return Object.fromEntries(Object.keys(locators).map((name, index) => {
      const value = metrics[index];

      if (!value) {
        throw new Error(`boxMetrics(): "${name}" is not in the page`);
      }

      return [name, value];
    }));
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
