import { test, expect } from '../fixtures/test';
import {
  HostSpanStylesPage,
  HOST_SPAN_STYLES,
  TEXT_PROPERTIES,
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
test.describe('host-page span styles do not leak into grid UI spans', () => {
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
