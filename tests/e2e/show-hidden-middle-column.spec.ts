import { test, expect } from '../fixtures/test';
import { ShowHiddenMiddleColumnPage } from '../fixtures/pages/ShowHiddenMiddleColumnPage';

/**
 * DEV-1040. `hidden()` on the Show column / Show row context-menu items only surfaced hidden
 * indexes at the first or last rendered header, inside a multi-header span, or when everything
 * was hidden. An initially hidden middle column (C) or row (3) next to a single selected header
 * produced no item until the user hid another index or selected across the gap.
 *
 * The fixture starts with those gaps already hidden, so the spec never uses Hide first — that
 * path already worked.
 */
test.describe('show an initially hidden middle column or row', () => {
  let grid: ShowHiddenMiddleColumnPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ShowHiddenMiddleColumnPage(page, theme, bundle);

    await grid.goto();
  });

  test('restores the hidden middle column from the previous header', async () => {
    await expect(grid.cell(0, 2)).toHaveCount(0);

    await grid.openColumnHeaderMenu(1);
    await expect(grid.showColumnMenuItem()).toBeVisible();
    await grid.clickShowColumn();

    await expect(grid.cell(0, 2)).toBeVisible();
    await expect(grid.cell(0, 2)).toHaveText('C1');
  });

  test('restores the hidden middle column from the next header', async () => {
    await expect(grid.cell(0, 2)).toHaveCount(0);

    await grid.openColumnHeaderMenu(3);
    await expect(grid.showColumnMenuItem()).toBeVisible();
    await grid.clickShowColumn();

    await expect(grid.cell(0, 2)).toBeVisible();
    await expect(grid.cell(0, 2)).toHaveText('C1');
  });

  test('does not offer Show column on a header that is not next to the hidden column', async () => {
    await expect(grid.cell(0, 2)).toHaveCount(0);

    await grid.openColumnHeaderMenu(4);
    await expect(grid.showColumnMenuItem()).toHaveCount(0);
  });

  test('restores the hidden middle row from the previous header', async () => {
    await expect(grid.cell(2, 0)).toHaveCount(0);

    await grid.openRowHeaderMenu(1);
    await expect(grid.showRowMenuItem()).toBeVisible();
    await grid.clickShowRow();

    await expect(grid.cell(2, 0)).toBeVisible();
    await expect(grid.cell(2, 0)).toHaveText('A3');
  });

  test('restores the hidden middle row from the next header', async () => {
    await expect(grid.cell(2, 0)).toHaveCount(0);

    await grid.openRowHeaderMenu(3);
    await expect(grid.showRowMenuItem()).toBeVisible();
    await grid.clickShowRow();

    await expect(grid.cell(2, 0)).toBeVisible();
    await expect(grid.cell(2, 0)).toHaveText('A3');
  });

  test('does not offer Show row on a header that is not next to the hidden row', async () => {
    await expect(grid.cell(2, 0)).toHaveCount(0);

    await grid.openRowHeaderMenu(4);
    await expect(grid.showRowMenuItem()).toHaveCount(0);
  });
});
