import { test, expect, THEMES_TAG, CROSS_BROWSER_TAG } from '../fixtures/test';
import { NestedHeadersLabelWrapPage, type GroupHeaderGeometry } from '../fixtures/pages/NestedHeadersLabelWrapPage';

/**
 * A nested group label longer than the columns it spans, with and without the CSS an application
 * writes to let header labels wrap (`.handsontable thead th .colHeader { white-space: normal; }`).
 *
 * With the CSS, the label wraps inside the width its columns already have and the header row grows to
 * the wrapped label, no taller. Two measurements used to defeat it: the NestedHeaders ghost table
 * measured every label on one line, so the group was widened to fit it; and core's pre-draw header
 * probe rendered the group label inside its first column alone, so the header row came out several
 * times taller than the label, and stayed that tall on every later render.
 *
 * Without the CSS the label stays on one line and the group is widened to fit it, as before.
 */

/**
 * The width the fixture gives every column (`colWidths: 80`).
 */
const COLUMN_WIDTH = 80;

/**
 * The space a header cell adds around its content box is its borders. The group header must add no
 * more than a one-line header of the bottom level does, or the row holds empty space under the label.
 * The `+ 1` is the top border the first header row draws and the bottom level does not.
 *
 * @param {GroupHeaderGeometry} geometry The measured headers.
 */
function expectGroupHeaderFitsItsLabel(geometry: GroupHeaderGeometry) {
  const groupChrome = geometry.groupHeaderHeight - geometry.groupContentHeight;
  const bottomChrome = geometry.bottomHeaderHeight - geometry.bottomContentHeight;

  expect(groupChrome, 'empty space in the group header').toBeLessThanOrEqual(bottomChrome + 1);
}

/**
 * With AutoRowSize, every header level takes at least the first level's height (a limit of AutoRowSize,
 * which reports one header height), so the bottom level is padded and cannot serve as the reference for
 * the group's borders. The group header must still hold nothing but its content box and its own borders
 * (`+ 1` for sub-pixel rounding), and no level may be taller than the group.
 *
 * @param {GroupHeaderGeometry} geometry The measured headers.
 */
function expectHeadersFitTheGroupLabelWithAutoRowSize(geometry: GroupHeaderGeometry) {
  expect(geometry.groupHeaderHeight - geometry.groupContentHeight, 'empty space in the group header')
    .toBeLessThanOrEqual(geometry.groupBorders + 1);
  expect(geometry.bottomHeaderHeight, 'the bottom level vs the group').toBeLessThanOrEqual(geometry.groupHeaderHeight);
}

test.describe('a nested group label with wrapping CSS', { tag: [THEMES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('wraps inside its columns and the header row grows to the label', async({ page, theme, bundle }) => {
    const grid = new NestedHeadersLabelWrapPage(page, theme, bundle);

    await grid.goto({ wrap: true });

    const geometry = await grid.geometry();

    expect(geometry.spannedColumnsWidth).toBe(4 * COLUMN_WIDTH);
    expect(geometry.groupWidth).toBeCloseTo(geometry.spannedColumnsWidth, 0);
    expect(geometry.labelLines).toBeGreaterThan(1);
    expectGroupHeaderFitsItsLabel(geometry);
  });

  test('keeps the same widths and heights after a full render and a data load', async({ page, theme, bundle }) => {
    const grid = new NestedHeadersLabelWrapPage(page, theme, bundle);

    await grid.goto({ wrap: true });

    const initial = await grid.geometry();

    await grid.updateSettingsAndRender();
    expect(await grid.geometry()).toEqual(initial);

    await grid.reloadData();
    expect(await grid.geometry()).toEqual(initial);
    expectGroupHeaderFitsItsLabel(initial);
  });

  test('keeps the group at its columns\' widths with AutoRowSize', async({ page, theme, bundle }) => {
    const grid = new NestedHeadersLabelWrapPage(page, theme, bundle);

    await grid.goto({ wrap: true, autoRowSize: true });

    const geometry = await grid.geometry();

    expect(geometry.spannedColumnsWidth).toBe(4 * COLUMN_WIDTH);
    expect(geometry.labelLines).toBeGreaterThan(1);
    expectHeadersFitTheGroupLabelWithAutoRowSize(geometry);
  });

  test('fits the header to the label with AutoRowSize when only some columns are sampled', async({
    page, theme, bundle,
  }) => {
    const grid = new NestedHeadersLabelWrapPage(page, theme, bundle);

    // AutoRowSize measures the header row from a sample of the columns, which skips repeated labels,
    // so three of the group's eight columns are in the sample. Measured over those three, the label
    // wraps; drawn over all eight, it fits one line.
    await grid.goto({ wrap: true, autoRowSize: true, wide: true });

    const geometry = await grid.geometry();

    expect(geometry.spannedColumnsWidth).toBe(8 * COLUMN_WIDTH);
    expect(geometry.groupWidth).toBeCloseTo(geometry.spannedColumnsWidth, 0);
    expect(geometry.labelLines).toBe(1);
    expectHeadersFitTheGroupLabelWithAutoRowSize(geometry);
  });

  test('wraps inside the visible columns when one of them is hidden', async({ page, theme, bundle }) => {
    const grid = new NestedHeadersLabelWrapPage(page, theme, bundle);

    await grid.goto({ wrap: true, autoRowSize: true, hideColumn: true });

    const geometry = await grid.geometry();

    expect(geometry.visibleSpannedColumns).toBe(3);
    expect(geometry.spannedColumnsWidth).toBe(3 * COLUMN_WIDTH);
    expect(geometry.groupWidth).toBeCloseTo(geometry.spannedColumnsWidth, 0);
    expect(geometry.labelLines).toBeGreaterThan(1);
    expectHeadersFitTheGroupLabelWithAutoRowSize(geometry);
  });
});

test.describe('a nested group label without wrapping CSS', { tag: [THEMES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('stays on one line and widens the group to fit it', async({ page, theme, bundle }) => {
    const grid = new NestedHeadersLabelWrapPage(page, theme, bundle);

    await grid.goto({ wrap: false });

    const geometry = await grid.geometry();

    expect(geometry.labelLines).toBe(1);
    expect(geometry.spannedColumnsWidth).toBeGreaterThan(4 * COLUMN_WIDTH);
    expect(geometry.groupWidth).toBeCloseTo(geometry.spannedColumnsWidth, 0);
    expectGroupHeaderFitsItsLabel(geometry);
  });
});
