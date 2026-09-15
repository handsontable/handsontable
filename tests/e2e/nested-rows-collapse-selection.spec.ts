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

  test('a selection BELOW the collapsed section stays on its own row', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    // B-1 belongs to Root B, and collapsing Root A does not trim it - but it does trim five rows
    // ABOVE it, so the stored visual index (7) lands past the new row count of 4 and the core drops
    // the selection. The row the user picked is still on screen, so the walk to an ancestor must not
    // start: B-1 is its own answer.
    await nestedRows.cell(7, 0).click();
    expect(await nestedRows.selectedCell()).toEqual([7, 0]);

    await nestedRows.collapseButton(0).click();

    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'Root B', 'B-1', 'B-2']);

    // B-1 slid from visual 7 to visual 2. Landing on Root B (visual 1) would move the user off the
    // record they picked, onto a parent of a section they never collapsed.
    expect(await nestedRows.selectedCell()).toEqual([2, 0]);

    await page.keyboard.press('ArrowDown');
    expect(await nestedRows.selectedCell()).toEqual([3, 0]);
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

  test('a whole-column selection the core clamps is not replaced by a single cell', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    // Ctrl+Space selects the column: the highlight stays on B-2 but the extent is anchored in the
    // column header, so it TRACKS the grid. `deselectIfHighlightStranded()` re-pins such a selection
    // to the new row count instead of dropping it - the collapse must leave that repair alone rather
    // than reducing a surviving whole-column selection to one cell.
    await nestedRows.cell(8, 0).click();
    await page.keyboard.press('Control+Space');

    // Anchored at row -1, the column header - that anchor is what marks the extent as grid-tracking.
    expect(await nestedRows.selectedRange()).toEqual([-1, 0, 8, 0]);

    await nestedRows.collapseButton(6).click();

    // Still the whole column, clamped to the 7 rows that are left - not [6, 0, 6, 0].
    expect(await nestedRows.selectedRange()).toEqual([-1, 0, 6, 0]);
  });

  test('a collapsed-state stash restore does not move the selection', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    // The stash is what `alter()` opens around an insert or a remove: it expands everything, the
    // operation runs, then `applyStash()` re-collapses. It re-collapses through
    // `collapseMultipleChildren()` directly, bypassing the choke point the guard hangs off, because
    // `alter()` owns the selection across the operation - `shiftRows()` moves it with the rows.
    await nestedRows.cell(0, 0).click();
    await nestedRows.collapseButton(6).click();
    await nestedRows.stashCollapsedState();

    // Root B is expanded again inside the stash window, so B-1 is a real row to sit on.
    await nestedRows.selectCell(7, 0);
    expect(await nestedRows.selectedCell()).toEqual([7, 0]);

    await nestedRows.applyCollapsedStash();

    // Unchanged behavior: the restore trims B-1 away and the core drops the stale selection. What
    // must NOT happen is the guard firing and parking the user on Root B.
    expect(await nestedRows.selectedCell()).toBeNull();
  });

  test('a collapse driven from outside the grid does not pull focus into it', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    // The selection is inside the section that is about to be collapsed...
    await nestedRows.cell(8, 0).click();

    // ...but the user has moved on to a control of the app's own, outside the grid.
    await page.evaluate(() => {
      const button = document.createElement('button');

      button.id = 'outside-control';
      document.body.appendChild(button);
      button.focus();
    });

    expect(await nestedRows.focusInsideGrid()).toBe(false);

    await nestedRows.callPlugin('collapseAll');

    // `selectCell()` scrolls and takes the focus, which is right inside the grid and rude outside
    // it. A grid the user is not in keeps the behavior it always had: the core drops the stranded
    // selection, and nothing takes its place.
    expect(await nestedRows.focusInsideGrid()).toBe(false);
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('outside-control');
    expect(await nestedRows.selectedCell()).toBeNull();
  });

  test('an updateSettings replay does not move the selection', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    // `updatePlugin()` tears the plugin down and re-collapses the parents the user chose, and in
    // React it runs on EVERY re-render that carries the `nestedRows` key. The replay passes
    // `shouldRunHooks: false` precisely because it is not a new action, so it must not move the
    // selection, scroll, or pull focus - none of which the user asked for by re-rendering.
    await nestedRows.cell(0, 0).click();
    await nestedRows.collapseButton(0).click();

    // Root B survived Root A's collapse, so the selection can sit on one of its children.
    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'Root B', 'B-1', 'B-2']);
    await nestedRows.selectCell(3, 0);

    await nestedRows.updateSettings({ nestedRows: true });

    // The replay leaves the selection exactly as it found it. It ends up dropped, which is a
    // SEPARATE pre-existing effect: `disablePlugin()` untrims everything, so visual row 3 names
    // A-2-a for the length of the rebuild, and the re-collapse strands it. What this pins is that
    // the collapse guard did not fire - with it firing, the user would be parked on Root A ([0, 0]),
    // moved and scrolled by a re-render they never asked for.
    expect(await nestedRows.selectedCell()).toBeNull();
    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'Root B', 'B-1', 'B-2']);
  });
});
