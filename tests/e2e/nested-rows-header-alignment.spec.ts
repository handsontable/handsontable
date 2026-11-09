import { test, expect, THEMES_TAG } from '../fixtures/test';
import { NestedRowsHeaderAlignmentPage } from '../fixtures/pages/NestedRowsHeaderAlignmentPage';

/**
 * The collapse button of a NestedRows row header sits on the label's first line, at the top of the
 * row like the cell text. A row with an exact `rowHeights` height stretched the label to the full row
 * while the button stayed vertically centered, 30px and more below the label.
 */
test.describe('NestedRows row header alignment', { tag: THEMES_TAG }, () => {
  let grid: NestedRowsHeaderAlignmentPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new NestedRowsHeaderAlignmentPage(page, theme, bundle);
  });

  for (const mode of ['exact', 'minimum'] as const) {
    test(`puts the button on the label's first line at the top of the row (${mode} row heights)`, async() => {
      await grid.goto(mode);

      // visual rows 0 (100px), 2 (grown by wrapped text) and 4 (default height) are parents
      for (const row of [0, 2, 4]) {
        const alignment = await grid.alignment(row);

        expect(Math.abs(alignment.buttonToLabel), `row ${row}: button on the label's line`).toBeLessThanOrEqual(1);
        expect(alignment.buttonTop, `row ${row}: button inside the row`).toBeGreaterThanOrEqual(0);
        // at the top, never centered in a row taller than one line
        expect(alignment.labelTop, `row ${row}: label at the top`).toBeLessThan(16);
      }

      expect((await grid.alignment(0)).rowHeight).toBeGreaterThanOrEqual(99);
    });
  }
});
