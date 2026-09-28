import { test, expect } from '../fixtures/test';
import { ColumnHeaderBorderOwnershipPage } from '../fixtures/pages/ColumnHeaderBorderOwnershipPage';

/**
 * DEV-2786, the row-axis twin of #6673.
 *
 * With column headers on, the first rendered body row was given a 1px `border-top` on top of the
 * `border-bottom` every cell carries, and `box-sizing: border-box` took both out of the same row
 * height - so that one row's content box was 1px shorter than every other row's. The column header
 * answered by dropping its own `border-bottom` at scroll offset 0 so the seam did not double, and
 * the engine gave it back (`innerBorderTop`) the moment the grid scrolled, with matching
 * compensations in the scroll target, the hider height, the layout snapshot's scrollbar prediction
 * and the row-height sums. So the header, and the whole table, changed height by being scrolled -
 * and a 1px layout shift after the overlays had been positioned cost a nested re-draw of the master
 * and every clone on each crossing of vertical offset 0.
 *
 * The gridline below the last head row now belongs to that header at every scroll position, and no
 * body row abutting a header draws a `border-top`. Every row then has the same content height, and
 * the header's height no longer depends on the scroll position.
 *
 * All of this is geometry, so none of it can be checked in jsdom, where every size reads as zero.
 * And none of it is a COLOR: `--ht-cell-vertical-border-color` resolves to `--ht-border-color` in
 * `main`, `horizon` and `classic` alike, so a color assertion on the seam would be true on all six
 * legs whichever element drew it. Everything below is measured instead.
 */
test.describe('Column header border ownership', () => {
  let grid: ColumnHeaderBorderOwnershipPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ColumnHeaderBorderOwnershipPage(page, theme, bundle);
    await grid.goto();
  });

  test('lets the column header own the gridline between itself and the first body row', async () => {
    // Exactly one border draws the seam. A missing seam and a doubled one are both failures, which
    // is why both sides are asserted rather than just the header's.
    expect(await grid.borders(grid.lastHeadRowCell('column-headers')))
      .toEqual({ top: 1, bottom: 1 });
    expect(await grid.borders(grid.firstBodyCell('column-headers')))
      .toEqual({ top: 0, bottom: 1 });
  });

  test('gives every body row the same height when column headers are enabled', async () => {
    const heights = await grid.bodyRowHeights('column-headers', 4);
    const [first] = heights;

    // The reported symptom: this used to read [30, 29, 29, 29].
    expect(heights).toEqual([first, first, first, first]);
  });

  test('keeps the header height and the scroll range unchanged by a vertical scroll', async () => {
    const before = await grid.verticalMetrics('column-headers', 'columnHeaders');

    await grid.scrollVerticallyTo('columnHeaders', 'column-headers', 12);

    // `getColumnHeaderHeight()` is re-measured from the DOM on every full draw, which is what made
    // the cached value flip with the offset. The whole table grew with it.
    expect(await grid.verticalMetrics('column-headers', 'columnHeaders')).toEqual(before);
  });

  test('keeps the header height unchanged at the very end of the scroll range', async () => {
    const before = await grid.verticalMetrics('column-headers', 'columnHeaders');

    await grid.scrollToLastRow('columnHeaders', 'column-headers');

    // The far end is its own case: the hider used to be expanded by a pixel on the way there
    // (`expandHiderVerticallyBy`) so the scroll could still reach the last row.
    expect(await grid.verticalMetrics('column-headers', 'columnHeaders')).toEqual(before);
    // And it still reaches it, flush against the holder's bottom edge.
    expect(await grid.lastRowBottomGap('column-headers')).toBe(0);
  });

  test('keeps every body row the same height after a vertical scroll', async () => {
    await grid.scrollVerticallyTo('columnHeaders', 'column-headers', 12);

    const heights = await grid.bodyRowHeights('column-headers', 4);
    const [first] = heights;

    expect(heights).toEqual([first, first, first, first]);
  });

  test('holds the same geometry in every configuration that renders a column header', async () => {
    for (const [testId, name] of [
      ['frozen', 'frozen'],
      ['frozen-bottom', 'frozenBottom'],
      ['nested', 'nested'],
      ['auto-row-size', 'autoRowSize'],
      ['multi-row-headers', 'multiRowHeaders'],
      // `preventOverflow: 'horizontal'` is the one shape the engine never stamped `innerBorderTop`
      // on, so it was the shape where NOTHING gave the header a bottom border at any offset.
      ['prevent-overflow', 'preventOverflow'],
    ] as const) {
      const before = await grid.verticalMetrics(testId, name);

      // Only the `bottom` here: the head row's `border-top` is the grid's top frame, which the FIRST
      // head row carries and a nested header's deeper levels do not.
      expect((await grid.borders(grid.lastHeadRowCell(testId))).bottom, testId).toBe(1);
      expect(await grid.borders(grid.firstBodyCell(testId)), testId)
        .toEqual({ top: 0, bottom: 1 });

      await grid.scrollVerticallyTo(name, testId, 12);

      expect(await grid.verticalMetrics(testId, name), testId).toEqual(before);
    }
  });

  test('leaves the bottom-freeze seam on the frozen row, which renders no head row above it', async () => {
    // The rule is per TABLE (`thead:not(:empty) + tbody`), not per grid, and this is why: the bottom
    // clone's `thead` is always empty, so its first row keeps its `border-top`. There the pixel is
    // the bottom-freeze seam, drawn over the master's last non-frozen row - nothing to do with a
    // column header. A grid-wide gate would have taken it away.
    const frozenRow = grid.firstBodyCell('frozen-bottom', '.ht_clone_bottom');

    expect(await grid.borders(frozenRow)).toEqual({ top: 1, bottom: 1 });
  });

  test('keeps the top-frozen row flush under the header, which does render one above it', async () => {
    // The mirror of the case above: the top clone holds the head row AND the frozen rows, so its
    // first body row abuts a header and gives the pixel up like the master's would.
    const frozenRow = grid.firstBodyCell('frozen', '.ht_clone_top');

    expect(await grid.borders(frozenRow)).toEqual({ top: 0, bottom: 1 });
  });

  test('keeps the first row 1px taller on a grid with no column headers', async () => {
    // Deliberately out of scope, and the reason the CSS rule is keyed on the table's own head row
    // rather than on the grid: with no header above it, that border is the grid's own top frame and
    // the row still carries it inside its declared height. The mirror of #6673 leaving column 0 a
    // pixel narrower on a grid with no row headers.
    expect(await grid.borders(grid.firstBodyCell('control'))).toEqual({ top: 1, bottom: 1 });

    const [first, second] = await grid.bodyRowHeights('control', 2);

    expect(first).toBe(second + 1);
  });

  test('reads the rendered head rows, not the colHeaders setting, when deciding the compensation', async () => {
    // `colHeaders: false` does not mean "no head row". NestedHeaders replaces the column-header
    // renderers through the documented `afterGetColumnHeaderRenderers` hook whenever it holds a
    // layer, and never consults `colHeaders` - so the grid renders a `thead`, the CSS rule fires,
    // and the first body row draws no `border-top`. A compensation keyed on the SETTING then adds a
    // pixel that is not there, and every row-height sum in the core is 1px long. The predicate is
    // therefore the RENDERED header count.
    const agreement = await grid.firstRowHeightAgreement('plugin-headers', 'pluginHeaders');

    // The premise. Without it the rest passes on a grid that simply has no headers.
    expect(agreement.hasColHeadersSetting).toBe(false);
    expect(agreement.headerRowsRendered).toBe(2);

    // The prediction the core acts on has to be what the DOM renders, for both rows.
    expect(agreement.predictedFirst).toBe(agreement.renderedFirst);
    expect(agreement.predictedSecond).toBe(agreement.renderedSecond);
    // And with a head row above it the first row is not the odd one out.
    expect(agreement.renderedFirst).toBe(agreement.renderedSecond);
  });

  test('still compensates the first row on a grid that renders no head row at all', async () => {
    // The negative half of the test above: keyed on the rendered count, the headerless control must
    // keep its compensation, or the fix would have removed it everywhere instead of narrowing it.
    const agreement = await grid.firstRowHeightAgreement('control', 'control');

    expect(agreement.headerRowsRendered).toBe(0);
    expect(agreement.predictedFirst).toBe(agreement.renderedFirst);
    expect(agreement.renderedFirst).toBe(agreement.renderedSecond + 1);
  });

  test('records no oversized rows in any configuration', async () => {
    // Every grid here has uniform rows, so the engine must measure exactly what it configured. A
    // spurious record is how a 1px accounting error shows up first, and it costs a row-height cache
    // invalidation on every draw for as long as it stands.
    for (const name of [
      'columnHeaders', 'frozen', 'frozenBottom', 'nested', 'autoRowSize', 'control',
      'multiRowHeaders', 'preventOverflow', 'pluginHeaders',
    ]) {
      expect(await grid.oversizedRowCount(name), name).toBe(0);
    }
  });

  test('keeps the whole selection top edge clear of the column header', async () => {
    await grid.selectCell('columnHeaders', 0, 1);

    // `.wtBorder` paints at z-index 10 and `.ht_clone_top` at 160, so an edge centred on the shared
    // gridline loses half its thickness behind the header. `Border#appear` therefore moves it onto
    // the cell's own top boundary when the cell draws no top border of its own and sits under a head
    // row - the row-axis twin of `standsBehindRowHeader`.
    expect(await grid.selectionTopEdgeOffset('column-headers', 0, 1)).toBe(0);
    expect(await grid.selectionEdgeHiddenBehindColumnHeader('column-headers')).toBe(false);
  });

  test('still straddles the gridline for a row with another row above it', async () => {
    // The control for the test above: nothing is painting over that pixel, so the edge is centred on
    // it as it always was. Asserted so the new branch cannot be widened into every row.
    await grid.selectCell('columnHeaders', 3, 1);

    expect(await grid.selectionTopEdgeOffset('column-headers', 3, 1)).toBe(-1);
  });

  test('accents the corner cells when the first body row is the active header', async () => {
    await grid.selectRow('columnHeaders', 3);

    // Read the theme's accent off a cell the `-prev-row` rule colors, which this change leaves alone.
    const accent = await grid.activeAccentColor('column-headers');

    await grid.selectRow('columnHeaders', 0);

    // Row 0 has no row above to borrow the accent from, and the border it used to carry itself is
    // gone. `SelectionManager` tags the head row's corner cells instead, so the accent rides the
    // gridline that is actually there.
    const corners = grid.cornerCells('column-headers');

    expect(await corners.count()).toBe(1);
    expect(await grid.taggedCornerCells('column-headers').count()).toBe(1);
    expect(await grid.bottomBorderColor(corners.first())).toBe(accent);
  });

  test('accents every corner cell when the grid has more than one row header', async () => {
    await grid.selectRow('multiRowHeaders', 3);

    const accent = await grid.activeAccentColor('multi-row-headers');

    await grid.selectRow('multiRowHeaders', 0);

    const corners = grid.cornerCells('multi-row-headers');

    expect(await corners.count()).toBe(2);
    expect(await grid.taggedCornerCells('multi-row-headers').count()).toBe(2);
    expect(await grid.bottomBorderColor(corners.nth(0))).toBe(accent);
    expect(await grid.bottomBorderColor(corners.nth(1))).toBe(accent);
  });

  test('leaves the corner cells untagged for a row that is not the first rendered one', async () => {
    await grid.selectRow('columnHeaders', 3);

    // The negative half. Without it the two tests above would pass against a tagger that stamped the
    // corner on every row-header selection.
    //
    // Asserted on the CLASS rather than the color, because the color cannot discriminate on every
    // leg: `classic` resolves `--ht-header-active-border-color` to the same value as the plain
    // border color, so `not.toBe(accent)` is false there whatever the tagger did. The corner is
    // still rendered - only its tag is gone - so the count is over the tagged subset, and the
    // untagged corner below is the proof the locator is not simply finding nothing.
    expect(await grid.cornerCells('column-headers').count()).toBe(1);
    expect(await grid.taggedCornerCells('column-headers').count()).toBe(0);
  });
});
