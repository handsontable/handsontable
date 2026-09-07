import { test, expect } from '../fixtures/test';
import {
  MergeCellsNestedRowsCollapsePage,
  type FirstColumnCell,
} from '../fixtures/pages/MergeCellsNestedRowsCollapsePage';

/**
 * Issue #7686: with `nestedRows` and one merge per group, collapsing a parent left the merge on the
 * collapsed group spanning all six of its rows even though five of them had been trimmed away. A
 * trimmed row has no visual index, so the merge reached onto the rows below and the group under it
 * drew a second merged cell over the same rows. Expanding the parent again then left the recovered
 * rows as empty visible cells instead of restoring the merge.
 *
 * The grid is four groups of a parent plus five children, each covered by one merge in the first
 * column.
 */
const GROUP_SIZE = 6;

/**
 * Asserts that the first column reads as a sequence of merged blocks of the given sizes: each block
 * is one visible cell spanning its rows, followed by that many covered cells. A merge overlapping
 * its neighbor shows up here either as a visible cell where a covered one belongs, or as a block
 * whose span does not match the rows it owns.
 */
function expectBlocks(column: FirstColumnCell[], sizes: number[]): void {
  const expected: { covered: boolean, rowspan: number }[] = [];

  sizes.forEach((size) => {
    expected.push({ covered: false, rowspan: size });

    for (let covered = 1; covered < size; covered++) {
      expected.push({ covered: true, rowspan: 1 });
    }
  });

  expect(column.map(({ covered, rowspan }) => ({ covered, rowspan }))).toEqual(expected);
}

test.describe('`mergeCells` follows a `nestedRows` collapse', () => {
  test('every group is one merged block before anything is collapsed', async({ page, theme, bundle }) => {
    const grid = new MergeCellsNestedRowsCollapsePage(page, theme, bundle);

    await grid.goto();

    expectBlocks(await grid.firstColumn(), [GROUP_SIZE, GROUP_SIZE, GROUP_SIZE, GROUP_SIZE]);
  });

  test('a collapsed group shrinks to its parent row and leaves the group below intact',
    async({ page, theme, bundle }) => {
      const grid = new MergeCellsNestedRowsCollapsePage(page, theme, bundle);

      await grid.goto();
      await grid.collapse(0);

      // The collapsed group is a single row; the three groups below are whole and start one row
      // higher than before. Before the fix the second block started on the same row as the first.
      expectBlocks(await grid.firstColumn(), [1, GROUP_SIZE, GROUP_SIZE, GROUP_SIZE]);

      // The row right below the collapsed parent is the next group's own merged cell, not a second
      // cell spanning six rows on top of it.
      await expect(grid.cell(1, 0)).toHaveAttribute('rowspan', '6');
      await expect(grid.cell(1, 0)).toHaveText('P1');
    });

  test('expanding the group again restores every merge whole', async({ page, theme, bundle }) => {
    const grid = new MergeCellsNestedRowsCollapsePage(page, theme, bundle);

    await grid.goto();
    await grid.collapse(0);
    await grid.expand(0);

    expectBlocks(await grid.firstColumn(), [GROUP_SIZE, GROUP_SIZE, GROUP_SIZE, GROUP_SIZE]);

    // The recovered rows are covered by the restored merge rather than drawn as empty cells.
    await expect(grid.cell(0, 0)).toHaveAttribute('rowspan', '6');
    await expect(grid.cell(0, 0)).toHaveText('P0');
  });

  test('two collapsed groups expand back in reverse order', async({ page, theme, bundle }) => {
    const grid = new MergeCellsNestedRowsCollapsePage(page, theme, bundle);

    await grid.goto();
    await grid.collapse(0);
    // The parent is addressed by its row in the source data, which a collapse elsewhere does not
    // move, so the second group stays row 6 even though it now draws directly under the first.
    await grid.collapse(GROUP_SIZE);

    expectBlocks(await grid.firstColumn(), [1, 1, GROUP_SIZE, GROUP_SIZE]);

    await grid.expand(GROUP_SIZE);

    expectBlocks(await grid.firstColumn(), [1, GROUP_SIZE, GROUP_SIZE, GROUP_SIZE]);

    await grid.expand(0);

    expectBlocks(await grid.firstColumn(), [GROUP_SIZE, GROUP_SIZE, GROUP_SIZE, GROUP_SIZE]);
  });
});
