import { test, expect } from '../fixtures/test';
import { NestedRowsPage } from '../fixtures/pages/NestedRowsPage';

/**
 * Collapsing a nested-rows section is backed by a TRIMMING map, so the collapsed rows leave visual
 * index space altogether and `countRows()` drops. The selection holds a VISUAL row, which that
 * invalidates - `Selection#repairSelection()` then drops the selection outright and the grid stops
 * answering the keyboard until the user clicks into it again (DEV-50).
 *
 * Collapsing now moves the selection to the nearest surviving ANCESTOR first, which is the usual
 * tree-view convention.
 *
 * Each spec proves the fix through a KEY PRESS, not through `document.activeElement`. The collapse
 * button is not focusable, so a real pointer press on it always leaves DOM focus on `<body>` - that
 * is true of a perfectly working grid and says nothing about this bug. Handsontable listens for keys
 * on the document, so what actually broke was the missing selection: with none, a key press had
 * nothing to move and did nothing at all. One press both moves the selection and pulls focus back
 * into the grid, which is why focus is asserted only afterwards.
 *
 * Every spec opens with a real click on a cell rather than `selectCell()`, so the grid starts out
 * focused the way it is for a user.
 *
 * The fixture tree is three levels deep on purpose - the ancestor walk only matters when the parent
 * is itself trimmed. Physical layout:
 *   0 Root A / 1 A-1 / 2 A-2 / 3 A-2-a / 4 A-2-b / 5 A-3 / 6 Root B / 7 B-1 / 8 B-2
 */

test.describe('NestedRows selection when a section is collapsed', () => {
  test('collapsing the last section moves the selection to its parent and keeps the grid usable',
    async({ page, theme }) => {
      const nestedRows = new NestedRowsPage(page, theme);

      await nestedRows.goto();

      // B-2 - the very last row, inside the last collapsible section. This is the ticket's case:
      // its visual index (8) lands PAST the row count once Root B collapses, so before the fix
      // nothing was left to draw the highlight on and the selection was dropped.
      await nestedRows.cell(8, 0).click();
      expect(await nestedRows.selectedCell()).toEqual([8, 0]);

      await nestedRows.collapseButton(6).click();

      expect(await nestedRows.visibleNames()).toEqual(['Root A', 'A-1', 'A-2', 'A-2-a', 'A-2-b', 'A-3', 'Root B']);

      // Root B is visual row 6 - the parent the user just collapsed, not "whatever index 8 now is".
      expect(await nestedRows.selectedCell()).toEqual([6, 0]);

      // Before the fix this press did nothing: there was no selection left to move.
      await page.keyboard.press('ArrowUp');
      expect(await nestedRows.selectedCell()).toEqual([5, 0]);
      expect(await nestedRows.focusInsideGrid()).toBe(true);
    });

  test('collapsing a section the selection is not in leaves the selection alone', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    // A-1 belongs to Root A. Collapsing Root B must not touch it.
    await nestedRows.cell(1, 0).click();

    await nestedRows.collapseButton(6).click();

    expect(await nestedRows.selectedCell()).toEqual([1, 0]);

    await page.keyboard.press('ArrowDown');
    expect(await nestedRows.selectedCell()).toEqual([2, 0]);
  });

  test('collapseAll from two levels deep lands on the nearest ancestor that survives', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    // A-2-a sits two levels down. `collapseAll()` trims its parent A-2 as well, so "the parent" is
    // not a valid target - the walk has to carry on up to Root A.
    await nestedRows.cell(3, 0).click();

    await nestedRows.callPlugin('collapseAll');

    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'Root B']);
    expect(await nestedRows.selectedCell()).toEqual([0, 0]);

    await page.keyboard.press('ArrowDown');
    expect(await nestedRows.selectedCell()).toEqual([1, 0]);
    expect(await nestedRows.focusInsideGrid()).toBe(true);
  });

  test('a highlight on a row header keeps the header column it was on', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    // The fixture runs with `navigableHeaders`, so column -1 is a real place for the highlight to
    // be. The move must carry the user's column across rather than dropping them into column 0.
    // Click first so the grid starts focused, then put the highlight on the header itself.
    await nestedRows.cell(8, 0).click();
    await nestedRows.selectCell(8, -1);
    expect(await nestedRows.selectedCell()).toEqual([8, -1]);

    await nestedRows.collapseButton(6).click();

    expect(await nestedRows.selectedCell()).toEqual([6, -1]);
  });

  test('a collapsed-state stash restore does not move the selection', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    // The stash is what `alter()` opens around an insert or a remove: it expands everything, the
    // operation runs, then `applyStash()` re-collapses. That restore reaches the same trimming seam
    // a user-initiated collapse does, but `alter()` owns the selection across it - `shiftRows()`
    // moves it with the rows - so the collapse guard must stay out of the way.
    await nestedRows.cell(0, 0).click();
    await nestedRows.collapseButton(6).click();
    await nestedRows.stashCollapsedState();

    // Root B is expanded again inside the stash window, so B-1 is a real row to sit on.
    await nestedRows.selectCell(7, 0);
    expect(await nestedRows.selectedCell()).toEqual([7, 0]);

    await nestedRows.applyCollapsedStash();

    // Unchanged behaviour: the restore trims B-1 away and the core drops the stale selection. What
    // must NOT happen is the guard firing and parking the user on Root B.
    expect(await nestedRows.selectedCell()).toBeNull();
  });
});
