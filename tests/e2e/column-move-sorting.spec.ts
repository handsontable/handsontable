import { test, expect } from '../fixtures/test';
import { ColumnMoveSortingPage } from '../fixtures/pages/ColumnMoveSortingPage';

/**
 * ColumnSorting and ManualColumnMove both want a press on the column header.
 * ManualColumnMove refuses any press whose target carries `sortAction`, the class
 * ColumnSorting puts on the header label — so once that label is allowed to fill the
 * whole header, there is nowhere left to start a drag and the column cannot be moved
 * by pointer at all (DEV-1782).
 *
 * These tests drive the flow from the bug report: sort a column, then move it.
 */
test.describe('column move with sorting enabled', () => {
  let grid: ColumnMoveSortingPage;

  test.beforeEach(async ({ page, theme }) => {
    grid = new ColumnMoveSortingPage(page, theme);
  });

  test('moves a sorted column when the drag starts at the header centre', async () => {
    await grid.goto();

    // Sorting the column also selects it, which is what makes the header draggable.
    await grid.sortByHeader(2);
    await grid.expectFirstRow(['A1', 'B1', 'C1', 'D1', 'E1', 'F1']);

    await grid.dragColumnFromHeaderCentre(2, 4);

    await grid.expectFirstRow(['A1', 'B1', 'D1', 'E1', 'C1', 'F1']);
  });

  test('keeps the header label clickable for sorting', async () => {
    await grid.goto();

    await grid.sortByHeader(2);
    await grid.expectCell(0, 2, 'C1');

    // A second click toggles to descending - the label must stay a usable sort target.
    await grid.sortLabel(2).click();
    await expect(grid.sortLabel(2)).toHaveClass(/descending/);
    await grid.expectCell(0, 2, 'C5');
  });

  test('sorts on a header click made while a validated cell is being edited', async ({ page }) => {
    await grid.goto();

    // Open the editor on the validated column A and change the value.
    await grid.cell(0, 0).dblclick();
    await page.keyboard.type('Z9');

    // A real click, so mouse up lands in its own task. Pressing the header closes the editor and
    // validates in a microtask that finishes first - sorting must still wait for it and then run.
    await grid.sortLabel(2).click();

    await expect(grid.sortLabel(2)).toHaveClass(/ascending/);
    await grid.expectCell(0, 2, 'C1');
  });

  test('selects the column without sorting when the bare header area is pressed', async () => {
    // Selecting a column is the first half of moving it. That press must not sort, otherwise
    // every attempt to move a column re-sorts it on the way. Only the label and its indicator
    // are the sort button; the rest of the header is not.
    await grid.goto();

    await grid.clickBareHeader(2);

    await grid.expectNotSorted(2);
    await grid.expectFirstRow(['A5', 'B5', 'C5', 'D5', 'E5', 'F5']);

    // ...and the column is now selected, so it can be dragged straight away.
    await grid.dragFromBareHeader(2, 4);

    await grid.expectNotSorted(4);
    await grid.expectFirstRow(['A5', 'B5', 'D5', 'E5', 'C5', 'F5']);
  });

  test('moves the column when the drag starts on the sorting label itself', async () => {
    // The label covers most of the header, so this is the gesture users actually make.
    // It must move the column and leave the sort order alone.
    await grid.goto();

    await grid.sortByHeader(2);

    await grid.dragFromSortLabel(2, 4);

    await grid.expectFirstRow(['A1', 'B1', 'D1', 'E1', 'C1', 'F1']);
    // The press travelled, so it was a drag - the sort must not have toggled to descending.
    await expect(grid.sortLabel(4)).toHaveClass(/ascending/);
  });

  test('does not move the column when a press on the header is released without moving', async () => {
    await grid.goto();

    await grid.sortByHeader(2);
    await grid.expectFirstRow(['A1', 'B1', 'C1', 'D1', 'E1', 'F1']);

    // Press and release at the header centre without travelling: a click, not a drag.
    await grid.pressAndReleaseHeaderCentre(2);

    // The order is untouched, and the click toggled the sort instead.
    await expect(grid.sortLabel(2)).toHaveClass(/descending/);
    await grid.expectFirstRow(['A5', 'B5', 'C5', 'D5', 'E5', 'F5']);
  });
});
