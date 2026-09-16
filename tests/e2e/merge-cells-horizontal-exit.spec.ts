import { test, expect } from '../fixtures/test';
import { MergeCellsHorizontalExitPage } from '../fixtures/pages/MergeCellsHorizontalExitPage';

/**
 * DEV-102 (GitHub dev-handsontable#74): moving the selection over a merged cell with the keyboard
 * gave inconsistent results. Entering the merge B2:B4 from the top (B1 down) and leaving it left
 * landed on A2, but entering it from the bottom (B5 up) and leaving it left landed on A4 - the
 * result depended on the direction the merge was entered from.
 *
 * The merge is now addressed by its top-left corner: a horizontal move off it always keeps the
 * merge's top row, so both entry directions leave the merge on the same row. Vertical navigation
 * still keeps the entry column, and autoWrap traversal across the merge is unchanged (covered by
 * the plugin's keyboardShortcuts specs).
 */
test.describe('MergeCells: a horizontal move off a merge keeps its top row (DEV-102)', () => {
  test('entering from the bottom (Up) then leaving left lands on the top row', async({ page, theme, bundle }) => {
    const grid = new MergeCellsHorizontalExitPage(page, theme, bundle);

    await grid.goto();

    await grid.selectCell(4, 1); // B5
    await grid.pressKeys('ArrowUp'); // into the merge from below
    await grid.pressKeys('ArrowLeft'); // leave it to the left

    // A2 (the merge's top row), not A4 (the row it was entered on).
    expect(await grid.highlight()).toEqual({ row: 1, col: 0 });
  });

  test('entering from the top (Down) then leaving left lands on the same top row', async({ page, theme, bundle }) => {
    const grid = new MergeCellsHorizontalExitPage(page, theme, bundle);

    await grid.goto();

    await grid.selectCell(0, 1); // B1
    await grid.pressKeys('ArrowDown'); // into the merge from above
    await grid.pressKeys('ArrowLeft'); // leave it to the left

    // A2 - the same landing as the Up case, so the result no longer depends on the entry direction.
    expect(await grid.highlight()).toEqual({ row: 1, col: 0 });
  });

  test('entering from the bottom (Up) then leaving right also lands on the top row', async({ page, theme, bundle }) => {
    const grid = new MergeCellsHorizontalExitPage(page, theme, bundle);

    await grid.goto();

    await grid.selectCell(4, 1); // B5
    await grid.pressKeys('ArrowUp'); // into the merge from below
    await grid.pressKeys('ArrowRight'); // leave it to the right

    // C2 - the merge's top row on the other side.
    expect(await grid.highlight()).toEqual({ row: 1, col: 2 });
  });
});
