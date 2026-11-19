import { test, expect, THEMES_TAG } from '../fixtures/test';
import { NestedRowsHeaderAlignmentPage } from '../fixtures/pages/NestedRowsHeaderAlignmentPage';

/**
 * In a row with an exact `rowHeights` height, the collapse button of a NestedRows row header sits on the
 * label's first line, at the top of the row like the cell text: the label is stretched to the full row
 * there, and a centered button stayed 30px and more below it. A row that grows with its content keeps
 * the button centered on the label, as in 18.1.
 */
test.describe('NestedRows row header alignment', { tag: THEMES_TAG }, () => {
  let grid: NestedRowsHeaderAlignmentPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new NestedRowsHeaderAlignmentPage(page, theme, bundle);
  });

  for (const mode of ['exact', 'minimum'] as const) {
    test(`puts the button on the label's line (${mode} row heights)`, async() => {
      await grid.goto(mode);

      // visual rows 0 (100px), 2 (grown by wrapped text) and 4 (default height) are parents
      for (const row of [0, 2, 4]) {
        const alignment = await grid.alignment(row);

        expect(Math.abs(alignment.buttonToLabel), `row ${row}: button on the label's line`).toBeLessThanOrEqual(1);
        expect(alignment.buttonTop, `row ${row}: button inside the row`).toBeGreaterThanOrEqual(0);
      }

      expect((await grid.alignment(0)).rowHeight).toBeGreaterThanOrEqual(99);
    });
  }

  test('puts the label and the button at the top of a row with an exact height', async() => {
    await grid.goto('exact');

    const alignment = await grid.alignment(0);

    // never centered in the 100px row
    expect(alignment.labelTop).toBeLessThan(16);
    expect(alignment.buttonTop).toBeLessThan(16);
  });

  test('keeps the button on the first line of a wrapping label in a row with an exact height', async() => {
    await grid.goto('exact', 'long');

    const alignment = await grid.alignment(0);

    expect(alignment.labelLines, 'the label wraps').toBeGreaterThan(1);
    expect(Math.abs(alignment.buttonToLabel), 'button on the first line').toBeLessThanOrEqual(1);
  });

  test('centers the button on a wrapping label in a row that grows with its content, as in 18.1', async() => {
    await grid.goto('minimum', 'long');

    for (const row of [0, 2, 4]) {
      const alignment = await grid.alignment(row);

      expect(alignment.labelLines, `row ${row}: the label wraps`).toBeGreaterThan(1);
      expect(Math.abs(alignment.buttonToLabelBlock), `row ${row}: button centered on the label`)
        .toBeLessThanOrEqual(1);
    }
  });
});
