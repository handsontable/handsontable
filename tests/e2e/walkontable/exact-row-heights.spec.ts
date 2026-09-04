import { test, expect } from '../../fixtures/test';
import { ExactRowHeightsPage } from '../../fixtures/pages/walkontable/ExactRowHeightsPage';

/**
 * The engine's `rowHeightMode` (issue #4021). A provided row height used to be a floor only:
 * a table cell's `height` is a minimum in CSS table layout, and the engine read the rendered
 * height back after every draw and kept the larger value. In the `exact` mode the row renders
 * at exactly the provided height, on every cell, with the content clipped.
 */
test.describe('walkontable exact row heights', { tag: '@walkontable' }, () => {
  const {
    ROW_HEIGHT, MULTILINE_ROW, MULTILINE_COLUMN, TALL_FROZEN_ROW, CHECKBOX_COLUMN, AUTOCOMPLETE_COLUMN,
  } = ExactRowHeightsPage;

  let wt: ExactRowHeightsPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    wt = new ExactRowHeightsPage(page, theme, bundle);
  });

  test.describe('in the `min` mode (the default)', () => {
    test.beforeEach(async () => {
      await wt.goto({ mode: 'min' });
    });

    test('keeps a provided height shorter than the content as a floor', async () => {
      // The premise of every `exact` assertion below: the provided height alone does not shrink
      // a row. If this ever stops holding, the exact-mode tests would pass without proving anything.
      expect(await wt.rowHeight(wt.master, 1)).toBeGreaterThan(ROW_HEIGHT);
      expect(await wt.rowHeight(wt.master, MULTILINE_ROW)).toBeGreaterThan(await wt.rowHeight(wt.master, 1));
      expect(await wt.clipWrapperCount()).toBe(0);
    });
  });

  test.describe('in the `exact` mode', () => {
    test.beforeEach(async () => {
      await wt.goto({ mode: 'exact' });
    });

    test('renders every row at the provided height, including the first one', async () => {
      expect(await wt.distinctMasterRowHeights()).toEqual([ROW_HEIGHT]);
      expect(await wt.rowHeight(wt.master, 0)).toBe(ROW_HEIGHT);
    });

    test('renders the row headers at the provided height too', async () => {
      expect(await wt.rowHeight(wt.inlineStartOverlay, 1)).toBe(ROW_HEIGHT);
      expect(await wt.rowHeight(wt.inlineStartOverlay, MULTILINE_ROW)).toBe(ROW_HEIGHT);
      await expect(wt.rowHeader(wt.inlineStartOverlay, 1)).toHaveClass(/htExactHeight/);
    });

    test('clips content taller than the row instead of growing the row', async () => {
      expect(await wt.rowHeight(wt.master, MULTILINE_ROW)).toBe(ROW_HEIGHT);
      expect(await wt.isContentClipped(MULTILINE_ROW, MULTILINE_COLUMN)).toBe(true);
      await expect(wt.cell(MULTILINE_ROW, MULTILINE_COLUMN)).toHaveClass(/htExactHeight/);
    });

    test('keeps a row with a tall frozen cell at the provided height in both tables', async () => {
      // The frozen-column row sync measures the inline-start overlay for heights the master cannot
      // see. An exact row must not be re-recorded through that path either.
      expect(await wt.rowHeight(wt.inlineStartOverlay, TALL_FROZEN_ROW)).toBe(ROW_HEIGHT);
      expect(await wt.rowHeight(wt.master, TALL_FROZEN_ROW)).toBe(ROW_HEIGHT);

      await wt.scrollHorizontallyTo(500);

      expect(await wt.masterFirstRenderedColumn()).toBeGreaterThan(0);
      expect(await wt.rowHeight(wt.master, TALL_FROZEN_ROW)).toBe(ROW_HEIGHT);
      expect(await wt.rowOffsetWithinTable(wt.master, TALL_FROZEN_ROW + 2))
        .toBe(await wt.rowOffsetWithinTable(wt.inlineStartOverlay, TALL_FROZEN_ROW + 2));
    });

    test('keeps the checkbox and the autocomplete arrow inside the clipping wrapper', async () => {
      // In-flow content outside the wrapper would grow the row back to its content height.
      await expect(wt.cell(2, CHECKBOX_COLUMN).locator('.htCellClip > .htCheckboxRendererInput')).toHaveCount(1);
      await expect(wt.cell(2, AUTOCOMPLETE_COLUMN).locator('.htCellClip > .htAutocompleteArrow')).toHaveCount(1);
      expect(await wt.rowHeight(wt.master, 2)).toBe(ROW_HEIGHT);
    });

    test('keeps the scroll range stable and the row-height cache settled', async () => {
      const before = await wt.masterScrollHeight();

      await wt.scrollVerticallyTo(100000);
      await wt.scrollVerticallyTo(0);

      expect(await wt.masterScrollHeight()).toBe(before);
      expect(await wt.countRowCacheInvalidations(3)).toBe(0);
    });

    test('goes back to the content height when switched to the `min` mode', async () => {
      await wt.setMode('min');

      await expect.poll(async () => wt.clipWrapperCount()).toBe(0);
      expect(await wt.rowHeight(wt.master, 1)).toBeGreaterThan(ROW_HEIGHT);
      expect(await wt.rowHeight(wt.master, MULTILINE_ROW)).toBeGreaterThan(await wt.rowHeight(wt.master, 1));
      await expect(wt.cell(MULTILINE_ROW, MULTILINE_COLUMN)).toHaveText(/line one/);
    });
  });

  test.describe('in the `exact` mode with a uniform `rowHeights` option', () => {
    // The hook makes the row-size source non-uniform. The option alone is the uniform source, which
    // is what the common `rowHeights: <number>` configuration looks like to the engine: the uniform
    // shortcut in `markOversizedRows` and the row-height cache's uniform strategy run only here.
    const UNIFORM_HEIGHT = 40;

    test.beforeEach(async () => {
      await wt.goto({ mode: 'exact', hook: 0, rowHeights: UNIFORM_HEIGHT });
    });

    test('renders every row at the option height and clips the three-line cell', async () => {
      // The precondition of this block: without it the two tests here would only re-run the per-row
      // skip the block above already covers.
      expect(await wt.isRowSizeSourceUniform()).toBe(true);
      expect(await wt.distinctMasterRowHeights()).toEqual([UNIFORM_HEIGHT]);
      expect(await wt.rowHeight(wt.inlineStartOverlay, MULTILINE_ROW)).toBe(UNIFORM_HEIGHT);
      expect(await wt.isContentClipped(MULTILINE_ROW, MULTILINE_COLUMN)).toBe(true);
    });

    test('keeps the scroll range stable and the row-height cache settled', async () => {
      const before = await wt.masterScrollHeight();

      await wt.scrollVerticallyTo(100000);
      await wt.scrollVerticallyTo(0);

      expect(await wt.masterScrollHeight()).toBe(before);
      expect(await wt.countRowCacheInvalidations(3)).toBe(0);
    });
  });
});
