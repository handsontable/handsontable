import { test, expect, THEMES_TAG } from '../fixtures/test';
import { type Locator, type Page } from '@playwright/test';
import {
  HostSpanStylesPage,
  HOST_BOX_STYLES,
  HOST_SPAN_STYLES,
  TEXT_PROPERTIES,
  type BoxMetrics,
  type TextMetrics,
} from '../fixtures/pages/HostSpanStylesPage';

/**
 * DEV-75. The pagination labels and the multiselect chips are `<span>`s that relied on inheriting
 * their text metrics and font family from `.handsontable`. A host page rule as plain as
 * `span { font-size: 20px }` beats inheritance, so those spans took the host's size while the cells,
 * headers, buttons, and select next to them kept the theme token. The fix declares the properties as
 * `inherit` on every affected span, which wins over a bare element selector and still follows the
 * component root.
 *
 * Each test compares a span with its non-span cascade parent rather than with a hardcoded token,
 * so the assertion holds across main/horizon/classic and light/dark. A guard first proves the
 * parent's value differs from the host's, so an unfixed span (which computes to the host value)
 * can never match by coincidence. A control span outside the grid must compute the host values
 * first, so a fixture that silences the hostile rule fails loud instead of passing vacuously.
 */
test.describe('host-page span styles do not leak into grid UI spans', { tag: THEMES_TAG }, () => {
  function expectNotHostValues(metrics: TextMetrics): void {
    for (const property of TEXT_PROPERTIES) {
      expect(metrics[property], `${property} of the cascade parent coincides with the host value`)
        .not.toBe(HOST_SPAN_STYLES[property]);
    }
  }

  test('pagination labels keep the pagination bar text metrics', async({ page, theme, bundle }) => {
    const fixture = new HostSpanStylesPage(page, theme, bundle);

    await fixture.goto();

    const expected = await fixture.textMetrics(fixture.paginationBar);

    expectNotHostValues(expected);

    for (const label of [fixture.pageSizeLabel, fixture.pageNavLabel]) {
      for (const property of TEXT_PROPERTIES) {
        await expect(label).toHaveCSS(property, expected[property]);
      }
    }
  });

  test('multiselect chips keep the cell text metrics', async({ page, theme, bundle }) => {
    const fixture = new HostSpanStylesPage(page, theme, bundle);

    await fixture.goto();

    const expected = await fixture.textMetrics(fixture.multiselectCell);

    expectNotHostValues(expected);

    for (const span of [fixture.chip, fixture.chipLabel, fixture.chipRemove, fixture.overflow]) {
      for (const property of TEXT_PROPERTIES) {
        await expect(span).toHaveCSS(property, expected[property]);
      }
    }

    // The dropdown arrow is a span with `font-size: 0` (its glyph is a pseudo-element); the other
    // properties must still follow the cell.
    await expect(fixture.arrow).toHaveCSS('font-size', '0px');

    for (const property of TEXT_PROPERTIES.filter(name => name !== 'font-size')) {
      await expect(fixture.arrow).toHaveCSS(property, expected[property]);
    }
  });

  test('sheets bar tab labels and the rename field keep the tab text metrics', async({ page, theme, bundle }) => {
    const fixture = new HostSpanStylesPage(page, theme, bundle);

    await fixture.goto({ sheetsBar: true });

    const expected = await fixture.textMetrics(fixture.activeTab);

    expectNotHostValues(expected);

    for (const span of [fixture.tabLabel, fixture.tabChevron]) {
      for (const property of TEXT_PROPERTIES) {
        await expect(span).toHaveCSS(property, expected[property]);
      }
    }

    await fixture.startRename();

    for (const element of [fixture.renameInput, fixture.renameMirror]) {
      for (const property of TEXT_PROPERTIES) {
        await expect(element).toHaveCSS(property, expected[property]);
      }
    }
  });

  test('sheet names in the all-sheets menu keep the menu row text metrics', async({ page, theme, bundle }) => {
    const fixture = new HostSpanStylesPage(page, theme, bundle);

    await fixture.goto({ sheetsBar: true });
    await fixture.openAllSheetsMenu();

    const expected = await fixture.textMetrics(fixture.menuItemWrapper);

    expectNotHostValues(expected);

    for (const property of TEXT_PROPERTIES) {
      await expect(fixture.menuItemName).toHaveCSS(property, expected[property]);
    }
  });

  // A user override the parent-follow tests apply. Every value differs from the themes' tokens and
  // from the host rule, which the tests re-check against the live page before asserting.
  const USER_OVERRIDE: TextMetrics = {
    'font-size': '17px',
    'line-height': '37px',
    'font-weight': '600',
    'letter-spacing': '2px',
    'font-family': 'monospace',
  };

  function expectDistinctOverride(before: TextMetrics): void {
    for (const property of TEXT_PROPERTIES) {
      expect(USER_OVERRIDE[property], `${property} override coincides with the parent value`)
        .not.toBe(before[property]);
      expect(USER_OVERRIDE[property], `${property} override coincides with the host value`)
        .not.toBe(HOST_SPAN_STYLES[property]);
    }
  }

  function overrideRule(selector: string): string {
    return `${selector} { ${TEXT_PROPERTIES.map(property => `${property}: ${USER_OVERRIDE[property]};`).join(' ')} }`;
  }

  // The chips use `inherit`, not the theme token, so a user's own `td` rule must reach the chip text
  // too. A span pinned to the token would keep the old metrics while the cell and chip box change.
  // The rule is prepended ahead of the core stylesheet, so it has to win on specificity: core's cell
  // rule `.handsontable :where(...) > td` is (0,1,1), and `.handsontable tbody td` (0,1,2) beats it
  // wherever the user's CSS loads.
  test('multiselect chips follow a user override of the cell text metrics', async({ page, theme, bundle }) => {
    const fixture = new HostSpanStylesPage(page, theme, bundle);

    await fixture.goto();

    expectDistinctOverride(await fixture.textMetrics(fixture.multiselectCell));

    await fixture.prependUserStyles(overrideRule('.handsontable tbody td'));

    for (const property of TEXT_PROPERTIES) {
      await expect(fixture.multiselectCell).toHaveCSS(property, USER_OVERRIDE[property]);
    }

    for (const span of [fixture.chip, fixture.chipLabel, fixture.chipRemove, fixture.overflow]) {
      for (const property of TEXT_PROPERTIES) {
        await expect(span).toHaveCSS(property, USER_OVERRIDE[property]);
      }
    }
  });

  // Same contract for the pagination labels. The bar declares `font-size` and `line-height` on
  // `.handsontable.ht-pagination` (0,2,0), so the prepended user rule needs `div.handsontable.ht-pagination`
  // (0,2,1) to reach the bar at all; the labels must then follow it.
  test('pagination labels follow a user override of the pagination bar text metrics', async({ page, theme, bundle }) => {
    const fixture = new HostSpanStylesPage(page, theme, bundle);

    await fixture.goto();

    expectDistinctOverride(await fixture.textMetrics(fixture.paginationBar));

    await fixture.prependUserStyles(overrideRule('div.handsontable.ht-pagination'));

    for (const property of TEXT_PROPERTIES) {
      await expect(fixture.paginationBar).toHaveCSS(property, USER_OVERRIDE[property]);
    }

    for (const label of [fixture.pageSizeLabel, fixture.pageNavLabel]) {
      for (const property of TEXT_PROPERTIES) {
        await expect(label).toHaveCSS(property, USER_OVERRIDE[property]);
      }
    }
  });

  // Regression pin for #11306: header spans were the first instance of this bug and guard
  // font-size and line-height only (font-weight is left to `th` so a user's `.handsontable th`
  // bolding still applies). Asserting it here keeps all three guarded span families in one spec.
  test('column header spans keep the header cell font size and line height', async({ page, theme, bundle }) => {
    const fixture = new HostSpanStylesPage(page, theme, bundle);

    await fixture.goto();

    const expected = await fixture.textMetrics(fixture.columnHeaderCell);

    expect(expected['font-size']).not.toBe(HOST_SPAN_STYLES['font-size']);
    expect(expected['line-height']).not.toBe(HOST_SPAN_STYLES['line-height']);

    await expect(fixture.columnHeaderSpan).toHaveCSS('font-size', expected['font-size']);
    await expect(fixture.columnHeaderSpan).toHaveCSS('line-height', expected['line-height']);
  });
});

/**
 * The same host page also gives bare `<span>` and `<input>` elements padding, a margin, a border and
 * (inputs) a height, and adds two rules with three element selectors (`table th span`,
 * `body div input`) that outrank a guard of two element selectors. Every test below renders the page twice, without the host rules and with them,
 * and expects the grid's own spans and inputs, and the rows, bars and menus around them, to measure
 * the same both times. `goto()` first proves the host rules apply to a span and an input outside the
 * grid, so the comparison cannot pass because the rules went missing.
 */
test.describe('host-page span and input boxes do not resize grid UI', { tag: THEMES_TAG }, () => {
  type ReadMetrics = (fixture: HostSpanStylesPage) => Promise<Record<string, BoxMetrics>>;
  type GotoOptions = Parameters<HostSpanStylesPage['goto']>[0];

  async function renderCleanAndHostile(
    page: Page,
    theme: string,
    bundle: string,
    options: GotoOptions,
    read: ReadMetrics,
  ): Promise<{ clean: Record<string, BoxMetrics>; hostile: Record<string, BoxMetrics> }> {
    const cleanFixture = new HostSpanStylesPage(page, theme, bundle);

    await cleanFixture.goto({ ...options, withoutHostStyles: true });

    const clean = await read(cleanFixture);
    const hostileFixture = new HostSpanStylesPage(page, theme, bundle);

    await hostileFixture.goto(options);

    const hostile = await read(hostileFixture);

    return { clean, hostile };
  }

  function expectSameMetrics(clean: Record<string, BoxMetrics>, hostile: Record<string, BoxMetrics>): void {
    for (const name of Object.keys(clean)) {
      expect(hostile[name], `${name} measures differently under the host span and input rules`).toEqual(clean[name]);
    }
  }

  function expectCleanBoxDiffersFromHost(metrics: BoxMetrics, element: 'span' | 'input'): void {
    const differs = Object.entries(HOST_BOX_STYLES[element])
      .some(([property, value]) => metrics[property] !== value);

    expect(differs, `the clean ${element} already has the host box`).toBe(true);
  }

  function readAll(locators: (fixture: HostSpanStylesPage) => Record<string, Locator>): ReadMetrics {
    return fixture => fixture.boxMetrics(locators(fixture));
  }

  test('header spans keep the header and row heights', async({ page, theme, bundle }) => {
    const { clean, hostile } = await renderCleanAndHostile(page, theme, bundle, {}, readAll(fixture => ({
      columnHeaderCell: fixture.columnHeaderCell,
      columnHeaderSpan: fixture.columnHeaderSpan,
      cornerHeaderCell: fixture.cornerHeaderCell,
      cornerHeaderSpan: fixture.cornerHeaderSpan,
      rowHeaderCell: fixture.rowHeaderCell,
      rowHeaderSpan: fixture.rowHeaderSpan,
      firstDataCell: fixture.firstDataCell,
    })));

    for (const span of ['columnHeaderSpan', 'cornerHeaderSpan', 'rowHeaderSpan']) {
      expectCleanBoxDiffersFromHost(clean[span], 'span');
    }

    expectSameMetrics(clean, hostile);
  });

  test('multiselect chips and the dropdown arrow keep their boxes', async({ page, theme, bundle }) => {
    const { clean, hostile } = await renderCleanAndHostile(page, theme, bundle, {}, readAll(fixture => ({
      multiselectCell: fixture.multiselectCell,
      arrow: fixture.arrow,
      chip: fixture.chip,
      chipLabel: fixture.chipLabel,
      chipRemove: fixture.chipRemove,
      overflow: fixture.overflow,
    })));

    for (const span of ['arrow', 'chip', 'chipLabel', 'chipRemove', 'overflow']) {
      expectCleanBoxDiffersFromHost(clean[span], 'span');
    }

    expectSameMetrics(clean, hostile);
  });

  test('the pagination bar and its labels keep their size', async({ page, theme, bundle }) => {
    const { clean, hostile } = await renderCleanAndHostile(page, theme, bundle, {}, readAll(fixture => ({
      paginationBar: fixture.paginationBar,
      pageSizeLabel: fixture.pageSizeLabel,
      pageNavLabel: fixture.pageNavLabel,
    })));

    expectCleanBoxDiffersFromHost(clean.pageSizeLabel, 'span');
    expectCleanBoxDiffersFromHost(clean.pageNavLabel, 'span');
    expectSameMetrics(clean, hostile);
  });

  test('the Filters controls keep the dropdown menu size', async({ page, theme, bundle }) => {
    const { clean, hostile } = await renderCleanAndHostile(page, theme, bundle, { menus: true }, async(fixture) => {
      await fixture.openColumnMenu();

      const closed = await fixture.boxMetrics({
        menu: fixture.dropdownMenu,
        conditionCaptionLabel: fixture.conditionCaptionLabel,
        valueSearchInput: fixture.valueSearchInput,
        valueCheckboxLabel: fixture.valueCheckboxLabel,
        valueCheckboxText: fixture.valueCheckboxText,
        valueCheckboxBox: fixture.valueCheckboxBox,
        valueCheckboxInput: fixture.valueCheckboxInput,
        okButton: fixture.okButton,
        cancelButton: fixture.cancelButton,
      });

      await fixture.chooseCondition('Contains');

      const withCondition = await fixture.boxMetrics({
        menuWithCondition: fixture.dropdownMenu,
        conditionInput: fixture.conditionInput,
        operatorRadio: fixture.operatorRadio,
        okButtonWithCondition: fixture.okButton,
      });

      return { ...closed, ...withCondition };
    });

    for (const span of ['conditionCaptionLabel', 'valueCheckboxText', 'valueCheckboxBox']) {
      expectCleanBoxDiffersFromHost(clean[span], 'span');
    }

    for (const input of ['valueSearchInput', 'valueCheckboxInput', 'okButton', 'cancelButton', 'conditionInput',
      'operatorRadio']) {
      expectCleanBoxDiffersFromHost(clean[input], 'input');
    }

    expectSameMetrics(clean, hostile);
  });

  for (const { column, inputType } of [
    { column: 'Shipped on', inputType: 'date' },
    { column: 'Shipped at', inputType: 'time' },
    { column: 'Arrived', inputType: 'datetime-local' },
  ]) {
    test(`the ${inputType} condition input keeps the dropdown menu size`, async({ page, theme, bundle }) => {
      const { clean, hostile } = await renderCleanAndHostile(page, theme, bundle, { menus: true }, async(fixture) => {
        await fixture.openColumnMenu(column);
        await fixture.chooseCondition('Before');
        await expect(fixture.conditionInput).toHaveAttribute('type', inputType);

        return fixture.boxMetrics({
          menu: fixture.dropdownMenu,
          conditionInput: fixture.conditionInput,
          okButton: fixture.okButton,
        });
      });

      expectCleanBoxDiffersFromHost(clean.conditionInput, 'input');
      expectSameMetrics(clean, hostile);
    });
  }

  test('NestedRows level spacers keep the child row header and row heights', async({ page, theme, bundle }) => {
    const { clean, hostile } = await renderCleanAndHostile(page, theme, bundle, { nestedRows: true },
      readAll(fixture => ({
        childHeaderCell: fixture.nestedChildHeaderCell,
        levelSpacer: fixture.nestedLevelSpacer.first(),
        childHeaderSpan: fixture.nestedChildHeaderSpan,
        childDataCell: fixture.nestedChildDataCell,
      })));

    expectCleanBoxDiffersFromHost(clean.levelSpacer, 'span');
    expectCleanBoxDiffersFromHost(clean.childHeaderSpan, 'span');
    expectSameMetrics(clean, hostile);
  });

  test('menu check marks stay where the clean render draws them',async({ page, theme, bundle }) => {
    const { clean, hostile } = await renderCleanAndHostile(page, theme, bundle, { menus: true }, async(fixture) => {
      await fixture.openColumnMenu();

      return fixture.boxMetrics({
        checkMark: fixture.checkMark,
        checkMarkIcon: fixture.checkMarkIcon,
        mixedMark: fixture.mixedMark,
        mixedMarkIcon: fixture.mixedMarkIcon,
      });
    });

    expectCleanBoxDiffersFromHost(clean.checkMark, 'span');
    expectCleanBoxDiffersFromHost(clean.mixedMark, 'span');
    expectSameMetrics(clean, hostile);
  });
});

/**
 * The guard against host element rules sits at element level, (0,0,4), so a user's rule on the
 * guarded element's own class, (0,1,0), still wins. The core stylesheet is injected after the
 * user's, so a guard of the same specificity as the user rule would win on order instead. Each
 * test reads the value first, to prove the user's value is not what the element computes anyway.
 */
test.describe('user class rules on guarded grid elements beat the host element guard', { tag: THEMES_TAG }, () => {
  test('user rules on header and pagination label classes apply', async({ page, theme, bundle }) => {
    const fixture = new HostSpanStylesPage(page, theme, bundle);
    const userRules = [
      { locator: fixture.columnHeaderSpan, rule: '.colHeader { font-weight: 600; }', property: 'font-weight', value: '600' },
      { locator: fixture.rowHeaderSpan, rule: '.rowHeader { padding-inline: 8px; }', property: 'padding-left', value: '8px' },
      { locator: fixture.pageSizeLabel, rule: '.ht-page-size-section__label { padding: 2px; }', property: 'padding-top', value: '2px' },
    ];

    await fixture.goto();

    for (const { locator, property, value } of userRules) {
      await expect(locator).not.toHaveCSS(property, value);
    }

    await fixture.prependUserStyles(userRules.map(({ rule }) => rule).join('\n'));

    for (const { locator, property, value } of userRules) {
      await expect.soft(locator).toHaveCSS(property, value);
    }
  });
});
