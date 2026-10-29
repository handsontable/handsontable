import { test, expect } from '../fixtures/test';
import { MergeCellsSelectionRulesPage } from '../fixtures/pages/MergeCellsSelectionRulesPage';

/**
 * DEV-161: a cell selection covers every merged cell it touches whole, never part of one. The range
 * is a rectangle, so covering one merge can make it touch another, and it keeps growing until it
 * cuts no merge. A header selection keeps its own extent and is not covered here
 * (`header-range-merge-keyboard.spec.ts`).
 *
 * Two defects broke the rule. The range grew over the merges in exactly two passes, so a chain of
 * three merges declared top-down (the `staircase` case) was cut in half while the same merges
 * declared bottom-up were not. And a merge whose rows a filter hides still pulled the selection
 * onto the rows that took its place, so Delete on one plain cell emptied four.
 */
test.describe('MergeCells: a selection covers every merge it touches whole (DEV-161)', () => {
  for (const gridCase of ['staircase', 'staircase-reversed'] as const) {
    test(`selecting A4:C4 grows over the whole chain of merges (${gridCase})`, async({ page, theme, bundle }) => {
      const grid = new MergeCellsSelectionRulesPage(page, theme, bundle);

      await grid.goto(gridCase);
      await grid.selectRange([3, 0, 3, 2]);

      // A1:C4: A3:A4 brings in B2:B3, which brings in C1:C2. Rows 1 to 3 alone would cut C1:C2.
      expect(await grid.selected()).toEqual([0, 0, 3, 2]);
    });

    test(`Shift+ArrowLeft from C4 grows over the whole chain of merges (${gridCase})`, async({ page, theme, bundle }) => {
      const grid = new MergeCellsSelectionRulesPage(page, theme, bundle);

      await grid.goto(gridCase);
      await grid.click(3, 2); // C4
      await grid.pressKeys('Shift+ArrowLeft', 'Shift+ArrowLeft');

      // C1:A4, with the start corner on the right as the keys went left.
      expect(await grid.selected()).toEqual([0, 2, 3, 0]);
    });
  }

  test('a drag from one merge to another covers both, and every merge the rectangle cuts', async({ page, theme, bundle }) => {
    const grid = new MergeCellsSelectionRulesPage(page, theme, bundle);

    await grid.goto('merge-to-merge');
    await grid.drag([1, 1], [4, 4]); // B2:C3 to E5:F6

    // B1:F6: the rectangle B2:F6 cuts D1:D2, so it grows up to row 1 (index 0).
    expect(await grid.selected()).toEqual([0, 1, 5, 5]);
  });

  test('Shift+ArrowRight grows an earlier layer that Enter moved the focus back to', async({ page, theme, bundle }) => {
    const grid = new MergeCellsSelectionRulesPage(page, theme, bundle);

    await grid.goto('two-layers');
    await grid.click(1, 0); // A2
    await grid.addCell(5, 5); // F6, a second layer
    // Enter walks the focus on to the first layer, A2.
    await grid.pressKeys('Enter', 'Shift+ArrowRight');

    // The first layer reaches B2 and grows over the whole merge B1:B2, to A1:B2. A2:B2 would cut it.
    // The second layer, F6, is left as it was.
    expect(await grid.selectedLayers()).toEqual([[0, 0, 1, 1], [5, 5, 5, 5]]);
  });

  test('a drag the other way keeps its direction: the start corner moves out to cover the merges', async({ page, theme, bundle }) => {
    const grid = new MergeCellsSelectionRulesPage(page, theme, bundle);

    await grid.goto('merge-to-merge');
    await grid.drag([4, 4], [1, 1]); // E5:F6 to B2:C3

    // The same cells as the drag above, still from the bottom-right corner to the top-left one.
    expect(await grid.selected()).toEqual([5, 5, 0, 1]);
  });
});

test.describe('MergeCells: a merge whose rows a filter hides takes no part in selection (DEV-161)', () => {
  let grid: MergeCellsSelectionRulesPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new MergeCellsSelectionRulesPage(page, theme, bundle);

    await grid.goto('filtered');
    // Hides the rows of the merge A3:B4, so rows 5 and 6 move up into its place.
    await grid.filterOutColumnC(['C3', 'C4']);
  });

  test('clicking the cell that moved into the merge\'s place selects that one cell', async() => {
    await grid.click(2, 0);

    expect(await grid.valuesAt(2, 0, 2, 0)).toEqual([['A5']]);
    expect(await grid.selected()).toEqual([2, 0, 2, 0]);
  });

  test('Delete empties only the clicked cell', async() => {
    await grid.click(2, 0);
    await grid.pressKeys('Delete');

    expect(await grid.valuesAt(2, 0, 3, 1)).toEqual([
      [null, 'B5'],
      ['A6', 'B6'],
    ]);
  });

  test('a two-cell range there stays two cells and is painted as a range', async() => {
    await grid.drag([2, 0], [2, 1]);

    expect(await grid.selected()).toEqual([2, 0, 2, 1]);
    expect(await grid.isMultiple()).toBe(true);
    await expect(grid.cell(2, 0)).toContainClass('area');
  });
});
