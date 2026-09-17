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

  test('the top-row landing changes which cell is selected, not just its row', async({ page, theme, bundle }) => {
    // A second merge, A3:A5, sits left of B2:B4 and overlaps its rows. Old behavior kept the entered
    // row (3), landing inside A3:A5 and selecting that whole merge; the top-row snap lands on plain A2.
    const grid = new MergeCellsHorizontalExitPage(page, theme, bundle);

    await grid.goto('multi');

    await grid.selectCell(4, 1); // B5
    await grid.pressKeys('ArrowUp'); // into B2:B4 from below
    await grid.pressKeys('ArrowLeft'); // leave it to the left

    // A2, a single plain cell - not row 3, which would fall inside the A3:A5 merge.
    expect(await grid.highlight()).toEqual({ row: 1, col: 0 });
  });

  test('when the merge top row is hidden it lands on the topmost visible row', async({ page, theme, bundle }) => {
    // B2 (the merge's top row) is hidden. The snap must resolve to the topmost visible row, never the
    // hidden one - a non-renderable target throws inside the transform.
    const grid = new MergeCellsHorizontalExitPage(page, theme, bundle);

    await grid.goto('hidden-top');

    await grid.selectCell(4, 1); // B5
    await grid.pressKeys('ArrowUp'); // into the merge from below
    await grid.pressKeys('ArrowLeft'); // leave it to the left

    // A3 - the merge's topmost visible row, since B2 is hidden.
    expect(await grid.highlight()).toEqual({ row: 2, col: 0 });
  });

  test('the top-row snap holds in an RTL layout', async({ page, theme, bundle }) => {
    // The snap is direction-agnostic: it re-pins the row, and the column follows the RTL direction
    // (ArrowLeft steps toward the higher column index).
    const grid = new MergeCellsHorizontalExitPage(page, theme, bundle);

    await grid.goto('rtl');

    await grid.selectCell(4, 1); // B5
    await grid.pressKeys('ArrowUp'); // into the merge from below
    await grid.pressKeys('ArrowLeft'); // leave it horizontally

    // Row 1 (the merge's top row); column 2 is where ArrowLeft lands under RTL.
    expect(await grid.highlight()).toEqual({ row: 1, col: 2 });
  });

  test('entering the merge with the mouse then leaving left also lands on the top row', async({ page, theme, bundle }) => {
    // Documented user path (Excel-like): click into the merge, then leave horizontally. A merged
    // cell is a single origin TD, so the click itself already sits on the top-left; ArrowLeft from
    // there is A2. This does not uniquely prove the transformStart snap (the keyboard-from-below
    // cases do); it pins the advertised mouse-then-arrow landing.
    const grid = new MergeCellsHorizontalExitPage(page, theme, bundle);

    await grid.goto();

    await grid.selectCell(4, 1); // B5, below the merge
    await grid.selectCell(1, 1); // click the merge (B2:B4)
    await grid.pressKeys('ArrowLeft');

    // A2 - the merge's top row, the same landing as after a keyboard entry.
    expect(await grid.highlight()).toEqual({ row: 1, col: 0 });
  });

  test('Tab from the context menu keeps the entry row instead of snapping to the top', async({ page, theme, bundle }) => {
    // The context-menu Tab shortcut used to call transformStart without the Tab flag, so mergeCells
    // treated it as an arrow and snapped to the top row. Enter from below, open the menu, Tab: the
    // landing must stay on the row Tab cycles along (the merge's bottom row), not A/C2.
    const grid = new MergeCellsHorizontalExitPage(page, theme, bundle);

    await grid.goto();

    await grid.selectCell(4, 1); // B5
    await grid.pressKeys('ArrowUp'); // into the merge from below
    await grid.openContextMenu(1, 1);
    await grid.pressKeys('Tab');

    await expect(grid.contextMenu).toBeHidden();

    // C4 - Tab keeps row 3 (the row the merge was entered on from below), not C2.
    expect(await grid.highlight()).toEqual({ row: 3, col: 2 });
  });
});
