import { test, expect, THEMES_TAG } from '../fixtures/test';
import { PageOffsetReverseSplitPage, type PageOffsetLayout } from '../fixtures/pages/PageOffsetReverseSplitPage';

/**
 * A grid with no size inside an ancestor that clips only the vertical axis (`overflow-y: clip`) scrolls
 * its columns in its own holder while the window owns the rows: the reverse split. The page offset in
 * front of the grid is then not part of the holder's scroll position, so a grid offset by it must lay
 * out and scroll exactly like the same grid with no offset and the same holder width. Each case compares
 * the offset layout (a 1000px viewport, a 200px margin: an 800px holder) with its twin (an 800px viewport,
 * no margin).
 */
const MARGIN = 200;

/**
 * Pairs a layout with the twin that has the same holder width and no offset.
 *
 * @param {PageOffsetLayout} layout The layout with the offset.
 * @returns {PageOffsetLayout[]} The offset layout and its twin.
 */
function withTwin(layout: PageOffsetLayout): [PageOffsetLayout, PageOffsetLayout] {
  return [
    { ...layout, margin: MARGIN, viewportWidth: 1000 },
    { ...layout, margin: 0, viewportWidth: 1000 - MARGIN },
  ];
}

test.describe('grid offset from the page edge inside a vertically clipping ancestor', { tag: THEMES_TAG }, () => {
  let grid: PageOffsetReverseSplitPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new PageOffsetReverseSplitPage(page, theme, bundle);
  });

  /**
   * Measures a layout and its twin.
   *
   * @param {PageOffsetLayout} layout The layout with the offset.
   * @returns {Promise<object>} The two measurements.
   */
  async function measureBoth(layout: PageOffsetLayout) {
    const [offsetLayout, twinLayout] = withTwin(layout);

    await grid.goto(offsetLayout);
    const offset = await grid.measure();

    await grid.goto(twinLayout);
    const twin = await grid.measure();

    return { offset, twin };
  }

  test('lays out and scrolls like the same grid with no offset (LTR)', async() => {
    const { offset, twin } = await measureBoth({ overflowY: 'clip' });

    expect(twin.holderWidth).toBe(800);
    expect(offset).toEqual(twin);
    // The selected cell clears the row header, and every keyboard step does.
    expect(Number.isFinite(offset.selectedCellInset)).toBe(true);
    expect(offset.selectedCellInset).toBeGreaterThanOrEqual(-1);
    expect(offset.stepsUnderHeader).toBe(0);
  });

  test('keeps the frozen columns in step with the scroll position (fixedColumnsStart)', async() => {
    const { offset, twin } = await measureBoth({ overflowY: 'clip', fixedColumnsStart: 2 });

    expect(offset).toEqual(twin);
    expect(offset.stepsUnderHeader).toBe(0);
    expect(offset.cloneInset).toBe(0);
  });

  test('places the inline-start overlay offset at the holder scroll position (frozen columns)', async() => {
    // The backlight of a column move reads this offset. The page offset is not part of the holder's scroll
    // position, so the two are equal; before, the offset was short by the margin.
    await grid.goto({ overflowY: 'clip', margin: MARGIN, fixedColumnsStart: 2 });
    const { overlayOffset, holderScroll } = await grid.overlayOffset();

    expect(holderScroll).toBeGreaterThan(0);
    expect(overlayOffset).toBe(holderScroll);
  });

  test('lays out and scrolls like the same grid with no offset (RTL)', async() => {
    const { offset, twin } = await measureBoth({ overflowY: 'clip', dir: 'rtl' });

    expect(offset).toEqual(twin);
    expect(offset.stepsUnderHeader).toBe(0);
  });

  test('renders the columns an owner-sized holder needs, not the ones of a wider workspace', async() => {
    await grid.goto({ overflowY: 'clip', margin: MARGIN });
    const offset = await grid.measure();

    await grid.goto({ overflowY: 'hidden', margin: MARGIN });
    const hidden = await grid.measure();

    expect(offset.renderedColumns).toBe(hidden.renderedColumns);
    expect(offset.lastFullyVisible).toBe(hidden.lastFullyVisible);
    // The absolute value too, so two layouts that break the same way cannot agree: the columns that fit
    // the holder after the row header, counted from the first fully visible one (100px columns).
    expect(offset.lastFullyVisible - offset.firstFullyVisible)
      .toBe(Math.floor((offset.holderWidth - offset.rowHeaderWidth) / 100) - 1);
  });

  for (const { name, layout } of [
    { name: '`preventOverflow: vertical` on a page the window scrolls', layout: { preventOverflow: 'vertical', overflowY: 'visible' } },
  ] as { name: string, layout: PageOffsetLayout }[]) {
    test(`lays out like its no-offset twin with ${name}`, async() => {
      const { offset, twin } = await measureBoth(layout);

      expect(offset).toEqual(twin);
    });
  }

  // Controls: the wrapper owns both axes here, so the changed code does not run and these pass with and without
  // the fix. They pin that the offset stays out of the layout when the grid is not in the reverse split.
  for (const overflowY of ['hidden', 'auto'] as const) {
    test(`control: an \`overflow-y: ${overflowY}\` ancestor lays out like its no-offset twin`, async() => {
      const { offset, twin } = await measureBoth({ overflowY });

      expect(offset).toEqual(twin);
    });
  }

  test('stretches the columns to the holder width, not the page width', async() => {
    // 50px header plus 8 x 100px columns is wider than the 800px holder and narrower than the 1000px page: the
    // page width would stretch them to 118.75px each, past the holder's edge. The holder width leaves them at 100.
    const [offsetLayout, twinLayout] = withTwin({ overflowY: 'clip', stretchH: 'all', columns: 8 });

    await grid.goto(offsetLayout);
    const offset = await grid.firstCellWidth();

    await grid.goto(twinLayout);
    const twin = await grid.firstCellWidth();

    expect(offset).toBeCloseTo(100, 0);
    expect(offset).toBeCloseTo(twin, 0);
  });

  test('keeps the page offset in the scroll position on a page the window scrolls', async() => {
    // No clipping ancestor: the window owns both axes, and the table starts MARGIN px into the page, so
    // the same window scroll shows columns MARGIN px earlier than on the page with no offset.
    await grid.goto({ overflowY: 'visible', margin: MARGIN });
    const offset = await grid.measure();

    await grid.goto({ overflowY: 'visible', margin: 0 });
    const flush = await grid.measure();

    expect(flush.firstFullyVisible - offset.firstFullyVisible).toBe(MARGIN / 100);
    expect(flush.lastFullyVisible - offset.lastFullyVisible).toBe(MARGIN / 100);
    // The page, not the holder, is the workspace here: the holder is narrower by the margin, yet the same
    // columns are rendered.
    expect(offset.holderWidth).toBe(flush.holderWidth - MARGIN);
    expect(offset.renderedColumns).toBe(flush.renderedColumns);
    expect(offset.stepsUnderHeader).toBe(0);
  });
});
