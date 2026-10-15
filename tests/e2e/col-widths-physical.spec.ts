import { test } from '../fixtures/test';
import { ColWidthsPhysicalPage } from '../fixtures/pages/ColWidthsPhysicalPage';

/**
 * `colWidths` addresses a column by its physical index, so a width stays with its column when
 * the column is moved (DEV-918).
 */
test.describe('colWidths by physical column index', () => {
  let grid: ColWidthsPhysicalPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ColWidthsPhysicalPage(page, theme, bundle);
  });

  for (const form of ['array', 'function'] as const) {
    test(`keeps a ${form} width with its column after the column is moved`, async () => {
      await grid.goto(form);

      await grid.expectWidth(0, 100);
      await grid.expectWidth(1, 160);
      await grid.expectWidth(2, 220);

      // visual order becomes [B, C, A]
      await grid.moveColumn(0, 2);

      await grid.expectWidth(0, 160);
      await grid.expectWidth(1, 220);
      await grid.expectWidth(2, 100);
      // the column offsets follow the new widths too, not only the cell widths
      await grid.expectOffset(0, 1, 160);
      await grid.expectOffset(1, 2, 220);
    });
  }
});
